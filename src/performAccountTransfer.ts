import "module-alias/register";
import { DatabaseManager } from "@database/DatabaseManager";
import { officialPool } from "@database/official/OfficialDatabasePool";
import {
    constructOfficialDatabaseTable,
    OfficialDatabaseTables,
} from "@database/official/OfficialDatabaseTables";
import { OfficialDatabaseBestScore } from "@database/official/schema/OfficialDatabaseBestScore";
import { OfficialDatabaseScore } from "@database/official/schema/OfficialDatabaseScore";
import { RowDataPacket } from "mysql2";

function getScores(
    id: number,
): Promise<
    Map<string, Pick<OfficialDatabaseScore, "id" | "total_score" | "hash">>
> {
    return officialPool
        .query<
            RowDataPacket[]
        >(`SELECT id, total_score, hash FROM ${constructOfficialDatabaseTable(OfficialDatabaseTables.score)} WHERE uid = ?`, [id])
        .then(
            (res) =>
                new Map(
                    res[0].map(
                        (score) =>
                            [
                                score.hash,
                                {
                                    id: score.id,
                                    total_score: score.total_score,
                                    hash: score.hash,
                                },
                            ] as [
                                string,
                                Pick<
                                    OfficialDatabaseScore,
                                    "id" | "total_score" | "hash"
                                >,
                            ],
                    ),
                ),
        );
}

function getBestScores(
    id: number,
): Promise<Map<string, Pick<OfficialDatabaseBestScore, "id" | "pp" | "hash">>> {
    return officialPool
        .query<
            RowDataPacket[]
        >(`SELECT id, pp, hash FROM ${constructOfficialDatabaseTable(OfficialDatabaseTables.bestScore)} WHERE uid = ?`, [id])
        .then(
            (res) =>
                new Map(
                    res[0].map(
                        (score) =>
                            [
                                score.hash,
                                {
                                    id: score.id,
                                    pp: score.pp,
                                    hash: score.hash,
                                },
                            ] as [
                                string,
                                Pick<
                                    OfficialDatabaseBestScore,
                                    "id" | "pp" | "hash"
                                >,
                            ],
                    ),
                ),
        );
}

DatabaseManager.init().then(async () => {
    const dbManager = DatabaseManager.aliceDb.collections.accountTransfer;
    const transfers = await dbManager.get(
        "discordId",
        { transferDone: { $ne: true } },
        { projection: { _id: 0 } },
    );

    const userTable = constructOfficialDatabaseTable(
        OfficialDatabaseTables.user,
    );

    const scoreTable = constructOfficialDatabaseTable(
        OfficialDatabaseTables.score,
    );

    const bannedScoreTable = constructOfficialDatabaseTable(
        OfficialDatabaseTables.bannedScore,
    );

    const archivedScoreTable = constructOfficialDatabaseTable(
        OfficialDatabaseTables.archivedScore,
    );

    const bestScoreTable = constructOfficialDatabaseTable(
        OfficialDatabaseTables.bestScore,
    );

    const bestBannedScoreTable = constructOfficialDatabaseTable(
        OfficialDatabaseTables.bestBannedScore,
    );

    const archivedBestScoreTable = constructOfficialDatabaseTable(
        OfficialDatabaseTables.archivedBestScore,
    );

    console.log("Transfering", transfers.size, "accounts.");

    for (const transfer of transfers.values()) {
        console.log("Transferring account for", transfer.discordId);

        for (const uidToTransfer of transfer.transferList) {
            if (uidToTransfer === transfer.transferUid) {
                continue;
            }

            console.log(
                "Transferring",
                uidToTransfer,
                "to",
                transfer.transferUid,
            );

            // Mark the uid as archived.
            await officialPool.query(
                `UPDATE ${userTable} SET archived = 1 WHERE id = ?`,
                [uidToTransfer],
            );

            // Check for duplicate scores, and only keep the best score for each beatmap.
            const targetUidScores = await getScores(transfer.transferUid);
            const uidTransferScores = await getScores(uidToTransfer);

            const scoreIdsToArchive: number[] = [];

            for (const [hash, transferScore] of uidTransferScores) {
                const targetScore = targetUidScores.get(hash);

                if (!targetScore) {
                    continue;
                }

                if (targetScore.total_score > transferScore.total_score) {
                    // The target uid's score is better, so we move the transfer score to the archived table.
                    scoreIdsToArchive.push(transferScore.id);
                } else {
                    // The transfer score is better, so we move the target uid's score to the archived table.
                    scoreIdsToArchive.push(targetScore.id);
                }
            }

            let connection = await officialPool.getConnection();

            try {
                await connection.beginTransaction();

                for (const scoreId of scoreIdsToArchive) {
                    await connection.query(
                        `INSERT INTO ${archivedScoreTable} (SELECT * FROM ${scoreTable} WHERE id = ?) ON DUPLICATE KEY UPDATE id = VALUES(id)`,
                        [scoreId],
                    );

                    await connection.query(
                        `DELETE FROM ${scoreTable} WHERE id = ?`,
                        [scoreId],
                    );
                }

                await connection.commit();
            } catch (e) {
                console.error(e);

                await connection.rollback();
            } finally {
                connection.release();
            }

            // Do the same for best scores, except now pp is the deciding factor.
            const targetUidBestScores = await getBestScores(
                transfer.transferUid,
            );
            const uidTransferBestScores = await getBestScores(uidToTransfer);

            scoreIdsToArchive.length = 0;

            for (const [hash, transferScore] of uidTransferBestScores) {
                const targetScore = targetUidBestScores.get(hash);

                if (!targetScore) {
                    continue;
                }

                if (targetScore.pp > transferScore.pp) {
                    // The target uid's score is better, so we move the transfer score to the archived table.
                    scoreIdsToArchive.push(transferScore.id);
                } else {
                    // The transfer score is better, so we move the target uid's score to the archived table.
                    scoreIdsToArchive.push(targetScore.id);
                }
            }

            connection = await officialPool.getConnection();

            try {
                await connection.beginTransaction();

                for (const scoreId of scoreIdsToArchive) {
                    await connection.query(
                        `INSERT INTO ${archivedBestScoreTable} (SELECT * FROM ${bestScoreTable} WHERE id = ?) ON DUPLICATE KEY UPDATE id = VALUES(id)`,
                        [scoreId],
                    );

                    await connection.query(
                        `DELETE FROM ${bestScoreTable} WHERE id = ?`,
                        [scoreId],
                    );
                }

                await connection.commit();
            } catch (e) {
                console.error(e);

                await connection.rollback();
            } finally {
                connection.release();
            }

            // Finally, change the uid of the scores to the transfer uid.
            connection = await officialPool.getConnection();

            try {
                await connection.beginTransaction();

                await connection.query(
                    `UPDATE ${scoreTable} SET uid = ? WHERE uid = ?`,
                    [transfer.transferUid, uidToTransfer],
                );

                await connection.query(
                    `UPDATE ${bannedScoreTable} SET uid = ? WHERE uid = ?`,
                    [transfer.transferUid, uidToTransfer],
                );

                await connection.query(
                    `UPDATE ${archivedScoreTable} SET uid = ? WHERE uid = ?`,
                    [transfer.transferUid, uidToTransfer],
                );

                await connection.query(
                    `UPDATE ${bestScoreTable} SET uid = ? WHERE uid = ?`,
                    [transfer.transferUid, uidToTransfer],
                );

                await connection.query(
                    `UPDATE ${archivedBestScoreTable} SET uid = ? WHERE uid = ?`,
                    [transfer.transferUid, uidToTransfer],
                );

                await connection.query(
                    `UPDATE ${bestBannedScoreTable} SET uid = ? WHERE uid = ?`,
                    [transfer.transferUid, uidToTransfer],
                );

                await connection.commit();
            } catch (e) {
                console.error(e);

                await connection.rollback();
            } finally {
                connection.release();
            }
        }

        // Update user statistics.
        const topScores = await officialPool
            .query<
                RowDataPacket[]
            >(`SELECT pp, accuracy FROM ${bestScoreTable} WHERE uid = ? ORDER BY pp DESC LIMIT 100`, [transfer.transferUid])
            .then(
                (res) =>
                    res[0] as Pick<
                        OfficialDatabaseBestScore,
                        "pp" | "accuracy"
                    >[],
            );

        let totalPP = 0;
        let accuracy = 0;
        let accuracyWeight = 0;

        for (let i = 0; i < topScores.length; ++i) {
            const score = topScores[i];
            const weight = Math.pow(0.95, i);

            totalPP += score.pp * weight;
            accuracy += score.accuracy * weight;
            accuracyWeight += weight;
        }

        if (accuracy > 0) {
            accuracy /= accuracyWeight;
        } else {
            accuracy = 1;
        }

        const connection = await officialPool.getConnection();

        try {
            await connection.query(
                `UPDATE ${userTable}
                SET score = (SELECT SUM(total_score) FROM ${scoreTable} WHERE uid = ?),
                pp = ${totalPP},
                accuracy = ${accuracy},
                playcount = (SELECT COUNT(*) FROM ${scoreTable} WHERE uid = ? AND score > 0),
                archived = 0
                WHERE id = ?`,
                [
                    transfer.transferUid,
                    transfer.transferUid,
                    transfer.transferUid,
                ],
            );

            await connection.commit();
        } catch (e) {
            console.error(e);

            await connection.rollback();
        } finally {
            connection.release();
        }

        await dbManager.updateOne(
            { discordId: transfer.discordId },
            { $set: { transferDone: true } },
        );

        await DatabaseManager.elainaDb.collections.userBind.updateOne(
            { discordid: transfer.discordId },
            { $set: { uid: transfer.transferUid } },
        );

        console.log(`Transfer for ${transfer.discordId} has been completed.`);
    }

    console.log("All transfers have been completed.");

    process.exit(0);
});
