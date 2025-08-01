import { Config } from "@core/Config";
import { DatabaseManager } from "@database/DatabaseManager";
import { officialPool } from "@database/official/OfficialDatabasePool";
import {
    constructOfficialDatabaseTable,
    OfficialDatabaseTables,
} from "@database/official/OfficialDatabaseTables";
import { OfficialDatabaseScore } from "@database/official/schema/OfficialDatabaseScore";
import { OfficialDatabaseUser } from "@database/official/schema/OfficialDatabaseUser";
import { BeatmapLeaderboardSortMode } from "@enums/interactions/BeatmapLeaderboardSortMode";
import {
    DroidAPIRequestBuilder,
    DroidLegacyModConverter,
    ModCustomSpeed,
    ModDifficultyAdjust,
    ModMap,
    ModUtil,
    SerializedMod,
} from "@rian8337/osu-base";
import { APIScore, Player, Score } from "@rian8337/osu-droid-utilities";
import { OnlinePlayerRank } from "@structures/utils/OnlinePlayerRank";
import { ApplicationCommandOptionChoiceData } from "discord.js";
import { readFile, stat } from "fs/promises";
import { RowDataPacket } from "mysql2";

/**
 * A helper for osu!droid related requests.
 */
export abstract class DroidHelper {
    /**
     * Retrieves the leaderboard of a beatmap.
     *
     * In debug mode, the osu!droid API will be requested. Otherwise, the official database will be queried.
     *
     * @param hash The MD5 hash of the beatmap.
     * @param page The page to retrieve. Defaults to 1.
     * @param scoresPerPage The amount of scores to retrieve per page. Only used when the database is queried. Defaults to 100.
     * @returns The leaderboard.
     */
    static async getBeatmapLeaderboard(
        hash: string,
        order: BeatmapLeaderboardSortMode = BeatmapLeaderboardSortMode.score,
        page: number = 1,
        scoresPerPage: number = 100
    ): Promise<Score[]> {
        if (Config.isDebug) {
            const apiRequestBuilder = new DroidAPIRequestBuilder()
                .setEndpoint("scoresearchv2.php")
                .addParameter("hash", hash)
                .addParameter("page", Math.max(0, page - 1));

            switch (order) {
                case BeatmapLeaderboardSortMode.score:
                    apiRequestBuilder.addParameter("order", "score");
                    break;

                case BeatmapLeaderboardSortMode.pp:
                    apiRequestBuilder.addParameter("order", "pp");
                    break;
            }

            const result = await apiRequestBuilder.sendRequest();

            if (result.statusCode !== 200) {
                throw new Error("Droid API request failed");
            }

            let response: APIScore[];

            try {
                response = JSON.parse(result.data.toString("utf-8"));
            } catch {
                throw new Error("Failed to parse JSON response");
            }

            return response.map((v) => new Score(v));
        }

        const leaderboardQuery = await officialPool.query<RowDataPacket[]>(
            `SELECT
                score.id as id,
                score.uid as uid,
                user.username as username,
                score.filename as filename,
                score.score as score,
                score.combo as combo,
                score.mark as mark,
                score.mods as mods,
                score.accuracy as accuracy,
                score.perfect as perfect,
                score.good as good,
                score.bad as bad,
                score.miss as miss,
                score.date as date,
                score.hash as hash,
                score.pp as pp
                FROM ${constructOfficialDatabaseTable(OfficialDatabaseTables.score)} score, ${constructOfficialDatabaseTable(OfficialDatabaseTables.user)} user
                WHERE score.hash = ? AND score.score > 0 AND user.id = score.uid ORDER BY score.score DESC${order === BeatmapLeaderboardSortMode.pp ? ", score.pp DESC" : ""} LIMIT ? OFFSET ?;`,
            [hash, scoresPerPage, (page - 1) * scoresPerPage]
        );

        // The query automatically converts TIMESTAMP columns to Date objects, but API returns a seconds
        // unix epoch timestamp. As such, we need to convert the converted Date object to its seconds counterpart.
        return (
            leaderboardQuery[0] as (OfficialDatabaseScore &
                Pick<OfficialDatabaseUser, "username">)[]
        ).map((v) => {
            return new Score({
                ...v,
                date: Math.floor(v.date.getTime() / 1000),
                mods: JSON.parse(v.mods) as SerializedMod[],
            });
        });
    }

    /**
     * Retrieves the global leaderboard.
     *
     * In debug mode, the osu!droid API will be requested. Otherwise, the official database will be queried.
     *
     * @param page The page to retrieve. Defaults to 1.
     * @param scoresPerPage The amount of scores to retrieve per page. Only used when the database is queried. Defaults to 100.
     * @returns The global leaderboard.
     */
    static async getGlobalLeaderboard(
        page: number = 1,
        scoresPerPage: number = 100
    ): Promise<OnlinePlayerRank[]> {
        // Page is 1-indexed, but the API is 0-indexed.
        --page;

        if (Config.isDebug) {
            const apiRequestBuilder = new DroidAPIRequestBuilder()
                .setEndpoint("top.php")
                .addParameter("page", page);

            const result = await apiRequestBuilder.sendRequest();

            if (result.statusCode !== 200) {
                throw new Error("Droid API request failed");
            }

            let response: OnlinePlayerRank[];

            try {
                response = JSON.parse(result.data.toString("utf-8"));
            } catch {
                throw new Error("Failed to parse JSON response");
            }

            return response;
        }

        const leaderboardQuery = await officialPool.query<RowDataPacket[]>(
            `SELECT id, username, pp, playcount, accuracy FROM ${constructOfficialDatabaseTable(
                OfficialDatabaseTables.user
            )} WHERE banned = 0 AND restrict_mode = 0 AND archived = 0 ORDER BY pp DESC LIMIT ? OFFSET ?;`,
            [scoresPerPage, page * scoresPerPage]
        );

        return leaderboardQuery[0] as OnlinePlayerRank[];
    }

    /**
     * Gets recent scores of a player from the official database.
     *
     * In debug mode, this always returns an empty array.
     *
     * @param uid The uid of the player.
     * @param amount The amount of scores to retrieve. Defaults to 50.
     * @param offset The offset of the scores to retrieve. Defaults to 0.
     * @param databaseColumns The columns to retrieve from the database if the database is queried. Defaults to all columns.
     * @returns The recent scores.
     */
    static async getRecentScores<K extends keyof OfficialDatabaseScore>(
        uid: number,
        amount: number = 50,
        offset: number = 0,
        databaseColumns?: K[]
    ): Promise<Pick<OfficialDatabaseScore, K>[]> {
        if (Config.isDebug) {
            return [];
        }

        const scoreQuery = await officialPool.query<RowDataPacket[]>(
            `SELECT ${
                databaseColumns?.join() || "*"
            } FROM ${constructOfficialDatabaseTable(
                OfficialDatabaseTables.score
            )} WHERE uid = ? AND score > 0 ORDER BY date DESC LIMIT ? OFFSET ?;`,
            [uid, amount, offset]
        );

        return scoreQuery[0] as OfficialDatabaseScore[];
    }

    /**
     * Gets the top scores of a player.
     *
     * In debug mode, the osu!droid API will be requested. Otherwise, the official database will be queried.
     *
     * @param uid The uid of the player.
     * @param amount The amount of scores to retrieve. Defaults to 100.
     * @returns The top scores.
     */
    static async getTopScores(
        uid: number,
        amount: number = 100
    ): Promise<Score[]> {
        if (Config.isDebug) {
            const apiRequestBuilder = new DroidAPIRequestBuilder()
                .setEndpoint("scoresearchv2.php")
                .addParameter("uid", uid)
                .addParameter("page", 0)
                .addParameter("order", "pp")
                .addParameter("limit", amount);

            const data = await apiRequestBuilder.sendRequest();

            if (data.statusCode !== 200) {
                return [];
            }

            let response: APIScore[];

            try {
                response = JSON.parse(data.data.toString("utf-8"));
            } catch {
                throw new Error("Failed to parse JSON response");
            }

            return response.map((v) => new Score(v));
        }

        const scoreQuery = await officialPool.query<RowDataPacket[]>(
            `SELECT
                score.id as id,
                score.uid as uid,
                user.username as username,
                score.filename as filename,
                score.score as score,
                score.combo as combo,
                score.mark as mark,
                score.mods as mods,
                score.accuracy as accuracy,
                score.perfect as perfect,
                score.good as good,
                score.bad as bad,
                score.miss as miss,
                score.date as date,
                score.hash as hash,
                score.pp as pp
                FROM ${constructOfficialDatabaseTable(OfficialDatabaseTables.bestScore)} score, ${constructOfficialDatabaseTable(OfficialDatabaseTables.user)} user
                WHERE score.uid = ? AND user.id = score.uid ORDER BY score.pp DESC LIMIT ?;`,
            [uid, amount]
        );

        return (scoreQuery[0] as APIScore[]).map((v) => new Score(v));
    }

    /**
     * Gets a player's information from their uid or username.
     *
     * In debug mode, the osu!droid API will be requested. Otherwise, the official database will be queried.
     *
     * @param uidOrUsername The uid or username of the player.
     * @param databaseColumns The columns to retrieve from the database if the database is queried. Defaults to all columns.
     * @returns The player's information, `null` if not found.
     */
    static async getPlayer<K extends keyof OfficialDatabaseUser>(
        uidOrUsername: string | number,
        databaseColumns?: K[]
    ): Promise<Pick<OfficialDatabaseUser, K> | Player | null> {
        if (Config.isDebug) {
            return Player.getInformation(uidOrUsername);
        }

        const playerQuery = await officialPool.query<RowDataPacket[]>(
            `SELECT ${
                databaseColumns?.join() || "*"
            } FROM ${constructOfficialDatabaseTable(
                OfficialDatabaseTables.user
            )} WHERE ${
                typeof uidOrUsername === "number" ? "id" : "username"
            } = ? AND banned = 0 AND restrict_mode = 0;`,
            [uidOrUsername]
        );

        return (playerQuery[0] as OfficialDatabaseUser[]).at(0) ?? null;
    }

    /**
     * Obtains a rank from the official database based on a score.
     *
     * In debug mode, this will return `null`.
     *
     * @param score The score to get the rank from.
     * @returns The rank of the player, `null` if not found.
     */
    static async getPlayerScoreRank(score: number): Promise<number | null> {
        if (Config.isDebug) {
            return null;
        }

        const rankQuery = await officialPool.query<RowDataPacket[]>(
            `SELECT COUNT(*) + 1 FROM ${constructOfficialDatabaseTable(
                OfficialDatabaseTables.user
            )} WHERE banned = 0 AND restrict_mode = 0 AND archived = 0 AND score > ?;`,
            [score]
        );

        return (
            (rankQuery[0] as { "COUNT(*) + 1": number }[]).at(0)?.[
                "COUNT(*) + 1"
            ] ?? null
        );
    }

    /**
     * Obtains the rank of a player.
     *
     * In debug mode, this will return `null`.
     *
     * @param id The ID of the player to get the rank from.
     * @returns The rank of the player, `null` if not found.
     */
    static async getPlayerPPRank(id: number): Promise<number | null> {
        if (Config.isDebug) {
            return null;
        }

        const table = constructOfficialDatabaseTable(
            OfficialDatabaseTables.user
        );

        const rankQuery = await officialPool.query<RowDataPacket[]>(
            `SELECT COUNT(*) + 1 FROM ${table} WHERE banned = 0 AND restrict_mode = 0 AND archived = 0 AND pp > (SELECT pp FROM ${table} WHERE id = ?);`,
            [id]
        );

        return (
            (rankQuery[0] as { "COUNT(*) + 1": number }[]).at(0)?.[
                "COUNT(*) + 1"
            ] ?? null
        );
    }

    /**
     * Gets a score from a player on a beatmap.
     *
     * In debug mode, the osu!droid API will be requested. Otherwise, the official database will be queried.
     *
     * @param uid The uid of the player.
     * @param hash The MD5 hash of the beatmap.
     * @param databaseColumns The columns to retrieve from the database if the database is queried. Defaults to
     * @returns The score, `null` if not found.
     */
    static async getScore<K extends keyof OfficialDatabaseScore>(
        uid: number,
        hash: string,
        databaseColumns?: K[]
    ): Promise<Pick<OfficialDatabaseScore, K> | Score | null> {
        if (Config.isDebug) {
            return Score.getFromHash(uid, hash);
        }

        const scoreQuery = await officialPool.query<RowDataPacket[]>(
            `SELECT ${
                databaseColumns?.join() || "*"
            } FROM ${constructOfficialDatabaseTable(
                OfficialDatabaseTables.score
            )} WHERE uid = ? AND hash = ? AND score > 0;`,
            [uid, hash]
        );

        return (scoreQuery[0] as OfficialDatabaseScore[]).at(0) ?? null;
    }

    /**
     * Gets scores from a player.
     *
     * @param uid The uid of the player.
     * @param page The page to retrieve. Defaults to 1.
     * @param scoresPerPage The amount of scores to retrieve per page. Defaults to 100.
     * @param order The order of the scores. Defaults to the ID of the score.
     * @param databaseColumns The columns to retrieve from the database if the database is queried. Defaults to all columns.
     * @returns The scores.
     */
    static async getScores<K extends keyof OfficialDatabaseScore>(
        uid: number,
        page: number = 1,
        scoresPerPage: number = 100,
        order: keyof OfficialDatabaseScore = "id",
        databaseColumns?: K[]
    ): Promise<Pick<OfficialDatabaseScore, K>[] | Score[]> {
        if (Config.isDebug) {
            const apiRequestBuilder = new DroidAPIRequestBuilder()
                .setEndpoint("scoresearchv2.php")
                .addParameter("uid", uid)
                .addParameter("page", page - 1);

            const data = await apiRequestBuilder.sendRequest();

            if (data.statusCode !== 200) {
                return [];
            }

            let response: APIScore[];

            try {
                response = JSON.parse(data.data.toString("utf-8"));
            } catch {
                throw new Error("Failed to parse JSON response");
            }

            return response.map((v) => new Score(v));
        }

        const scoreQuery = await officialPool.query<RowDataPacket[]>(
            `SELECT ${
                databaseColumns?.join() || "*"
            } FROM ${constructOfficialDatabaseTable(
                OfficialDatabaseTables.score
            )} WHERE uid = ? AND score > 0 ORDER BY ? DESC LIMIT ? OFFSET ?;`,
            [uid, order, scoresPerPage, (page - 1) * scoresPerPage]
        );

        return scoreQuery[0] as OfficialDatabaseScore[];
    }

    /**
     * Gets the complete mod string of a score (mods, speed multiplier, force CS, force AR, force OD, and force HP combined).
     *
     * @param score The score.
     * @returns The complete mod string.
     */
    static getCompleteModString(modstring: string): string {
        const parsedMods = DroidLegacyModConverter.convert(modstring);

        return `+${
            !parsedMods.isEmpty
                ? ModUtil.modsToOrderedString(parsedMods)
                : "No Mod"
        }`;
    }

    /**
     * Gets the avatar URL of a player.
     *
     * @param uid The uid of the player.
     * @returns The avatar URL.
     */
    static getAvatarURL(uid: number): string {
        return `https://osudroid.moe/user/avatar?id=${uid}`;
    }

    /**
     * Converts a `ModMap` to its legacy mod string counterpart.
     *
     * @param mods The `ModMap` to convert.
     * @returns The legacy mod string.
     */
    static modMapToLegacyString(mods: ModMap): string {
        let modstring = "";

        for (const modType of ModUtil.allMods.values()) {
            if (!mods.has(modType)) {
                continue;
            }

            for (const legacyModKey of DroidLegacyModConverter.legacyStorableMods.keys()) {
                if (
                    modType ===
                    DroidLegacyModConverter.legacyStorableMods.get(legacyModKey)
                ) {
                    modstring += legacyModKey;
                    break;
                }
            }
        }

        const customSpeed = mods.get(ModCustomSpeed);
        const difficultyAdjust = mods.get(ModDifficultyAdjust);

        if (customSpeed) {
            modstring += `|${customSpeed.trackRateMultiplier.value.toFixed(2)}`;
        }

        if (typeof difficultyAdjust?.cs.value === "number") {
            modstring += `|CS${difficultyAdjust.cs.value.toFixed(1)}`;
        }
        if (typeof difficultyAdjust?.ar.value === "number") {
            modstring += `|AR${difficultyAdjust.ar.value.toFixed(1)}`;
        }
        if (typeof difficultyAdjust?.od.value === "number") {
            modstring += `|OD${difficultyAdjust.od.value.toFixed(1)}`;
        }
        if (typeof difficultyAdjust?.hp.value === "number") {
            modstring += `|HP${difficultyAdjust.hp.value.toFixed(1)}`;
        }

        return modstring;
    }

    /**
     * Obtains the avatar of a player.
     *
     * In debug mode, the avatar will be obtained by requesting the osu!droid server.
     * Otherwise, the avatar will be obtained via the file system.
     *
     * @param uid The uid of the player.
     * @returns The avatar of the player, `null` if the avatar is not found or the osu!droid server cannot be requested.
     */
    static async getAvatar(uid: number): Promise<Buffer | null> {
        if (Config.isDebug) {
            return fetch(this.getAvatarURL(uid))
                .then((res) => res.arrayBuffer())
                .then(Buffer.from.bind(Buffer))
                .catch(() => null);
        }

        const avatarBasePath = "/hdd/osudroid/avatar/";
        let avatarPath = `${avatarBasePath}${uid}.png`;

        const avatarStats = await stat(avatarPath).catch(() => null);

        if (!avatarStats?.isFile()) {
            avatarPath = `${avatarBasePath}0.png`;
        }

        return readFile(avatarPath).catch(() => null);
    }

    /**
     * Searches for player names.
     *
     * In debug mode, this queries the database instead.
     *
     * @param name The name to search for.
     * @param amount The amount of player names to retrieve. Defaults to 25.
     * @returns The player names, `null` if in debug mode or the database cannot be queried.
     */
    static async searchPlayersForAutocomplete(
        name: string,
        amount = 25
    ): Promise<ApplicationCommandOptionChoiceData<string>[]> {
        name = name.trim();

        // Usernames only allow:
        // - 2 to 20 characters.
        // - alphanumeric characters and underscores.
        if (
            name.length < 2 ||
            name.length > 20 ||
            !/^[a-zA-Z0-9_]*$/.test(name)
        ) {
            return [];
        }

        if (Config.isDebug) {
            return DatabaseManager.elainaDb.collections.userBind.searchPlayersForAutocomplete(
                name,
                amount
            );
        }

        const playerQuery = await officialPool
            .query<
                RowDataPacket[]
            >(`SELECT username FROM ${constructOfficialDatabaseTable(OfficialDatabaseTables.user)} WHERE username LIKE ? LIMIT ${amount};`, [`${name}%`])
            .then((res) => res[0] as Pick<OfficialDatabaseUser, "username">[]);

        return playerQuery.map((v) => {
            return {
                name: v.username,
                value: v.username,
            };
        });
    }

    /**
     * Cleans up filenames received from the score table to a proper title.
     *
     * @param filename The filename to clean up.
     * @returns The cleaned up filename.
     */
    static cleanupFilename(filename: string): string {
        if (!filename.endsWith(".osu")) {
            return filename;
        }

        return filename.substring(0, filename.length - 4).replace(/_/g, " ");
    }
}
