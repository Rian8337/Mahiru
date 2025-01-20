import { DatabaseManager } from "@database/DatabaseManager";
import { OperationResult } from "structures/core/OperationResult";
import { DatabaseUserBind } from "structures/database/elainaDb/DatabaseUserBind";
import { PPEntry } from "@structures/pp/PPEntry";
import { PrototypePPEntry } from "@structures/pp/PrototypePPEntry";
import { Manager } from "@utils/base/Manager";
import { PPHelper } from "@utils/helpers/PPHelper";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { Snowflake } from "discord.js";
import { ObjectId } from "mongodb";
import { consola } from "consola";
import { Accuracy, MathUtils, Modes } from "@rian8337/osu-base";
import { Player } from "@rian8337/osu-droid-utilities";
import { UserBindLocalization } from "@localization/database/utils/elainaDb/UserBind/UserBindLocalization";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { Language } from "@localization/base/Language";
import { NumberHelper } from "@utils/helpers/NumberHelper";
import { DiscordBackendRESTManager } from "@utils/managers/DiscordBackendRESTManager";
import { PPProcessorRESTManager } from "@utils/managers/PPProcessorRESTManager";
import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { DroidHelper } from "@utils/helpers/DroidHelper";
import { OfficialDatabaseUser } from "@database/official/schema/OfficialDatabaseUser";

/**
 * Represents a Discord user who has at least one osu!droid account bound.
 */
export class UserBind extends Manager implements DatabaseUserBind {
    discordid: Snowflake;
    uid: number;
    username: string;
    clan?: string;
    joincooldown?: number;
    oldclan?: string;
    oldjoincooldown?: number;
    dailyRoleMetadataUpdateComplete?: boolean;

    /**
     * The BSON object ID of this document in the database.
     */
    readonly _id?: ObjectId;

    private get bindDb() {
        return DatabaseManager.elainaDb.collections.userBind;
    }

    constructor(
        data: DatabaseUserBind = DatabaseManager.elainaDb?.collections.userBind
            .defaultDocument ?? {},
    ) {
        super();

        this._id = data._id;
        this.discordid = data.discordid;
        this.uid = data.uid;
        this.username = data.username;
        this.clan = data.clan;
        this.joincooldown = data.joincooldown;
        this.oldclan = data.oldclan;
        this.dailyRoleMetadataUpdateComplete =
            data.dailyRoleMetadataUpdateComplete;
    }

    /**
     * Calculates this player's dpp into the prototype dpp database.
     *
     * @param reworkType The rework type of the prototype.
     */
    async calculatePrototypeDPP(reworkType: string): Promise<OperationResult> {
        const currentList: PPEntry[] = [];
        const newList: PrototypePPEntry[] = [];

        const topScores = await DroidHelper.getTopScores(this.uid);

        if (!topScores) {
            return this.createOperationResult(
                false,
                "Failed to fetch top scores",
            );
        }

        for (const score of topScores) {
            const beatmapInfo = await BeatmapManager.getBeatmap(score.hash, {
                checkFile: false,
            });

            if (!beatmapInfo) {
                continue;
            }

            const liveAttribs =
                await PPProcessorRESTManager.getOnlineScoreAttributes(
                    score.uid,
                    score.hash,
                    Modes.droid,
                    PPCalculationMethod.live,
                );

            if (!liveAttribs) {
                continue;
            }

            const rebalAttribs =
                await PPProcessorRESTManager.getOnlineScoreAttributes(
                    score.uid,
                    score.hash,
                    Modes.droid,
                    PPCalculationMethod.rebalance,
                );

            if (!rebalAttribs) {
                continue;
            }

            const { performance: perfResult, params } = liveAttribs.attributes;
            const { performance: rebalPerfResult, params: rebalParams } =
                rebalAttribs.attributes;

            const accuracy = new Accuracy(params.accuracy);

            const currentEntry: PPEntry = {
                uid: score.uid,
                hash: beatmapInfo.hash,
                title: beatmapInfo.fullTitle,
                pp: NumberHelper.round(perfResult.total, 2),
                mods: liveAttribs.attributes.difficulty.mods,
                accuracy: NumberHelper.round(accuracy.value() * 100, 2),
                combo: params.combo,
                miss: accuracy.nmiss,
            };

            const prototypeEntry: PrototypePPEntry = {
                uid: score.uid,
                hash: beatmapInfo.hash,
                title: beatmapInfo.fullTitle,
                pp: NumberHelper.round(rebalPerfResult.total, 2),
                newAim: NumberHelper.round(rebalPerfResult.aim, 2),
                newTap: NumberHelper.round(rebalPerfResult.tap, 2),
                newAccuracy: NumberHelper.round(rebalPerfResult.accuracy, 2),
                newVisual: NumberHelper.round(rebalPerfResult.visual, 2),
                prevPP: NumberHelper.round(perfResult.total, 2),
                prevAim: NumberHelper.round(perfResult.aim, 2),
                prevTap: NumberHelper.round(perfResult.tap, 2),
                prevAccuracy: NumberHelper.round(perfResult.accuracy, 2),
                prevVisual: NumberHelper.round(perfResult.visual, 2),
                mods: rebalAttribs.attributes.difficulty.mods,
                accuracy: NumberHelper.round(accuracy.value() * 100, 2),
                combo: params.combo,
                miss: accuracy.nmiss,
                speedMultiplier:
                    rebalParams.customSpeedMultiplier !== 1
                        ? rebalParams.customSpeedMultiplier
                        : undefined,
                calculatedUnstableRate: rebalPerfResult.calculatedUnstableRate,
                estimatedUnstableRate: NumberHelper.round(
                    rebalPerfResult.deviation * 10,
                    2,
                ),
                estimatedSpeedUnstableRate: NumberHelper.round(
                    rebalPerfResult.tapDeviation * 10,
                    2,
                ),
                overallDifficulty:
                    rebalAttribs.attributes.difficulty.overallDifficulty,
                hit300: accuracy.n300,
                hit100: accuracy.n100,
                hit50: accuracy.n50,
                aimSliderCheesePenalty: rebalPerfResult.aimSliderCheesePenalty,
                flashlightSliderCheesePenalty:
                    rebalPerfResult.flashlightSliderCheesePenalty,
                visualSliderCheesePenalty:
                    rebalPerfResult.visualSliderCheesePenalty,
                speedNoteCount:
                    rebalAttribs.attributes.difficulty.speedNoteCount,
                liveTapPenalty: params.tapPenalty,
                rebalanceTapPenalty: rebalParams.tapPenalty,
                averageBPM: MathUtils.millisecondsToBPM(
                    rebalAttribs.attributes.difficulty.averageSpeedDeltaTime,
                ),
            };

            consola.info(
                `${beatmapInfo.fullTitle} ${score.completeModString}: ${prototypeEntry.prevPP} ⮕  ${prototypeEntry.pp}`,
            );

            currentList.push(currentEntry);
            newList.push(prototypeEntry);
        }

        currentList.sort((a, b) => b.pp - a.pp);
        newList.sort((a, b) => b.pp - a.pp);

        const currentTotal =
            PPHelper.calculateFinalPerformancePoints(currentList);
        const newTotal = PPHelper.calculateFinalPerformancePoints(newList);

        consola.info(`${currentTotal.toFixed(2)} ⮕  ${newTotal.toFixed(2)}`);

        return DatabaseManager.aliceDb.collections.prototypePP.updateOne(
            {
                discordid: this.discordid,
                reworkType: reworkType,
            },
            {
                $set: {
                    pp: [...newList.values()],
                    pptotal: newTotal,
                    prevpptotal: currentTotal,
                    lastUpdate: Date.now(),
                    uid: this.uid,
                    username: this.username,
                    scanDone: true,
                },
            },
            { upsert: true },
        );
    }

    /**
     * Moves the bind of this Discord account to another Discord account.
     *
     * @param to The ID of the Discord account to move to.
     * @param language The locale of the user who attempted to move the bind. Defaults to English.
     * @returns An object containing information about the operation.
     */
    async moveBind(
        to: Snowflake,
        language: Language = "en",
    ): Promise<OperationResult> {
        const localization = this.getLocalization(language);

        if (this.discordid === to) {
            return this.createOperationResult(
                false,
                localization.getTranslation("cannotRebindToSameAccount"),
            );
        }

        const otherBindInfo = await this.bindDb.getFromUser(to, {
            projection: {
                _id: 0,
                uid: 1,
            },
        });

        if (otherBindInfo) {
            return this.createOperationResult(
                false,
                localization.getTranslation("targetAccountAlreadyBound"),
            );
        }

        await DatabaseManager.aliceDb.collections.nameChange.updateOne(
            { discordid: this.discordid },
            { $set: { discordid: to } },
        );

        // Append the Discord account's account transfer information.
        const transferInfo =
            await DatabaseManager.aliceDb.collections.accountTransfer.getFromDiscordId(
                this.discordid,
            );

        if (transferInfo) {
            await DatabaseManager.aliceDb.collections.accountTransfer.updateOne(
                { discordId: to },
                {
                    $addToSet: {
                        transferList: { $each: transferInfo.transferList },
                    },
                    $setOnInsert: {
                        discordId: to,
                        transferUid: transferInfo.transferUid,
                        // Assume transfer is done.
                        transferDone: true,
                    },
                },
                { upsert: true },
            );

            // Remove the Discord account's account transfer information.
            await DatabaseManager.aliceDb.collections.accountTransfer.deleteOne(
                { discordId: this.discordid },
            );
        }

        const currentId = this.discordid;

        await this.bindDb.updateOne(
            { discordid: this.discordid },
            { $set: { discordid: to } },
        );

        this.discordid = to;

        return DatabaseManager.aliceDb.collections.playerInfo.updateOne(
            { discordid: currentId },
            { $set: { discordid: to } },
        );
    }

    /**
     * Binds an osu!droid account to this Discord account.
     *
     * @param uid The uid of the osu!droid account.
     * @param language The locale of the user who attempted to bind. Defaults to English.
     * @returns An object containing information about the operation.
     */
    async bind(uid: number, language?: Language): Promise<OperationResult>;

    /**
     * Binds an osu!droid account to this Discord account.
     *
     * @param username The username of the osu!droid account.
     * @param language The locale of the user who attempted to bind. Defaults to English.
     * @returns An object containing information about the operation.
     */
    async bind(username: string, language?: Language): Promise<OperationResult>;

    /**
     * Binds an osu!droid account to this Discord account.
     *
     * @param player The player.
     * @param language The locale of the user who attempted to bind. Defaults to English.
     * @returns An object containing information about the operation.
     */
    async bind(
        player: Pick<OfficialDatabaseUser, "id" | "username"> | Player,
        language?: Language,
    ): Promise<OperationResult>;

    async bind(
        uidOrUsernameOrPlayer:
            | string
            | number
            | Pick<OfficialDatabaseUser, "id" | "username">
            | Player,
        language: Language = "en",
    ): Promise<OperationResult> {
        const player =
            uidOrUsernameOrPlayer instanceof Player
                ? uidOrUsernameOrPlayer
                : typeof uidOrUsernameOrPlayer === "string" ||
                    typeof uidOrUsernameOrPlayer === "number"
                  ? await DroidHelper.getPlayer(uidOrUsernameOrPlayer, [
                        "id",
                        "username",
                    ])
                  : uidOrUsernameOrPlayer;

        const localization = this.getLocalization(language);

        if (!player) {
            return this.createOperationResult(
                false,
                localization.getTranslation("playerWithUidOrUsernameNotFound"),
            );
        }

        this.uid = player.id;
        this.username = player.username;

        return this.bindDb.updateOne(
            { discordid: this.discordid },
            {
                $set: {
                    username: this.username,
                    uid: this.uid,
                },
            },
        );
    }

    /**
     * Unbinds the osu!droid account bound to this Discord account.
     *
     * @returns An object containing information about the operation.
     */
    async unbind(): Promise<OperationResult> {
        // Kick the user from any clan
        if (this.clan) {
            const clan =
                await DatabaseManager.elainaDb.collections.clan.getFromName(
                    this.clan,
                );

            if (clan) {
                await clan.removeMember(this.discordid);

                if (!clan.exists) {
                    await clan.notifyLeader(
                        new UserBindLocalization(
                            CommandHelper.getLocale(this.discordid),
                        ).getTranslation("unbindClanDisbandNotification"),
                    );
                }
            }
        }

        return this.bindDb.deleteOne({ discordid: this.discordid });
    }

    /**
     * Sets the clan of this Discord account.
     *
     * @param name The name of the clan.
     */
    async setClan(name: string): Promise<OperationResult> {
        this.clan = name;

        return this.bindDb.updateOne(
            { discordid: this.discordid },
            {
                $set: {
                    clan: this.clan,
                },
            },
        );
    }

    /**
     * Updates the role connection metadata of this user.
     */
    async updateRoleMetadata(): Promise<OperationResult> {
        const response = await DiscordBackendRESTManager.updateMetadata(
            this.discordid,
        );

        if (response.statusCode === 200) {
            return DatabaseManager.elainaDb.collections.userBind.updateOne(
                { discordid: this.discordid },
                {
                    $set: {
                        dailyRoleMetadataUpdateComplete: true,
                    },
                },
            );
        } else {
            return this.createOperationResult(false, "Metadata update failed");
        }
    }

    /**
     * Gets the localization of this database utility.
     *
     * @param language The language to localize.
     */
    private getLocalization(language: Language): UserBindLocalization {
        return new UserBindLocalization(language);
    }
}
