import { Config } from "@core/Config";
import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { Bonus } from "structures/challenge/Bonus";
import { BonusDescription } from "structures/challenge/BonusDescription";
import { PassRequirement } from "structures/challenge/PassRequirement";
import { DatabaseChallenge } from "structures/database/aliceDb/DatabaseChallenge";
import { BonusID } from "structures/challenge/BonusID";
import { ChallengeStatusType } from "structures/challenge/ChallengeStatusType";
import { ChallengeType } from "structures/challenge/ChallengeType";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { PerformanceCalculationParameters } from "@utils/pp/PerformanceCalculationParameters";
import { ArrayHelper } from "@utils/helpers/ArrayHelper";
import {
    ApplicationCommandOptionChoiceData,
    Collection,
    Snowflake,
    TextChannel,
    bold,
    roleMention,
    userMention,
} from "discord.js";
import { ObjectId } from "mongodb";
import { Manager } from "@utils/base/Manager";
import { BeatmapDifficultyHelper } from "@utils/helpers/BeatmapDifficultyHelper";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { StringHelper } from "@utils/helpers/StringHelper";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { OperationResult } from "structures/core/OperationResult";
import {
    Mod,
    ModEasy,
    ModNoFail,
    ModHalfTime,
    ModUtil,
    Modes,
    Accuracy,
} from "@rian8337/osu-base";
import {
    DroidDifficultyAttributes,
    OsuDifficultyAttributes,
} from "@rian8337/osu-difficulty-calculator";
import {
    ReplayAnalyzer,
    ReplayData,
    HitErrorInformation,
} from "@rian8337/osu-droid-replay-analyzer";
import { Score } from "@rian8337/osu-droid-utilities";
import { Language } from "@localization/base/Language";
import {
    ChallengeLocalization,
    ChallengeStrings,
} from "@localization/database/utils/aliceDb/Challenge/ChallengeLocalization";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { RESTManager } from "@utils/managers/RESTManager";
import { createHash } from "crypto";
import { ReplayHelper } from "@utils/helpers/ReplayHelper";
import { CompleteCalculationAttributes } from "@structures/difficultyattributes/CompleteCalculationAttributes";
import { DroidPerformanceAttributes } from "@structures/difficultyattributes/DroidPerformanceAttributes";
import { PPProcessorRESTManager } from "@utils/managers/PPProcessorRESTManager";
import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { OsuPerformanceAttributes } from "@structures/difficultyattributes/OsuPerformanceAttributes";
import { OfficialDatabaseScore } from "@database/official/schema/OfficialDatabaseScore";
import { DroidHelper } from "@utils/helpers/DroidHelper";

/**
 * Represents a daily or weekly challenge.
 */
export class Challenge extends Manager {
    /**
     * The BSON object ID of this document in the database.
     */
    readonly _id?: ObjectId;

    /**
     * The ID of the challenge.
     */
    challengeid: string;

    /**
     * The ID of the beatmap in the challenge.
     */
    beatmapid: number;

    /**
     * The Discord ID of the user who featured the challenge.
     */
    featured: Snowflake;

    /**
     * The download links to the challenge beatmapset.
     *
     * The first element is the download link via Google Drive,
     * the second element is the download link via OneDrive.
     */
    link: [string, string];

    /**
     * The status of the challenge.
     */
    status: ChallengeStatusType;

    /**
     * The MD5 hash of the challenge beatmapset.
     */
    hash: string;

    /**
     * The mods required to complete this challenge.
     */
    constrain: string;

    /**
     * The amount of points awarded for completing the challenge.
     */
    points: number;

    /**
     * The epoch time at which the challenge will end, in seconds.
     */
    timelimit: number;

    /**
     * The pass condition of the challenge.
     */
    pass: PassRequirement;

    /**
     * The bonuses for the challenge, mapped by their ID.
     */
    bonus: Collection<BonusID, Bonus>;

    /**
     * The type of the challenge.
     */
    get type(): ChallengeType {
        return this.challengeid.startsWith("w") ? "weekly" : "daily";
    }

    /**
     * Whether this challenge is a weekly challenge.
     */
    get isWeekly(): boolean {
        return this.type === "weekly";
    }

    /**
     * Whether the challenge is scheduled.
     */
    get isScheduled(): boolean {
        return this.status === "scheduled";
    }

    /**
     * Whether the challenge is ongoing.
     */
    get isOngoing(): boolean {
        return this.status === "ongoing";
    }

    /**
     * Whether the challenge has finished.
     */
    get hasFinished(): boolean {
        return this.status === "finished";
    }

    static readonly challengeManagerRole = "973476729039499284";

    static readonly passCommandChoices: ApplicationCommandOptionChoiceData<string>[] =
        [
            {
                name: "Score V1",
                value: "score",
            },
            {
                name: "Accuracy",
                value: "acc",
            },
            {
                name: "Score V2",
                value: "scorev2",
            },
            {
                name: "Misses",
                value: "miss",
            },
            {
                name: "Maximum Combo",
                value: "combo",
            },
            {
                name: "Rank",
                value: "rank",
            },
            {
                name: "Droid PP",
                value: "dpp",
            },
            {
                name: "PC pp",
                value: "pp",
            },
            {
                name: "Minimum 300",
                value: "m300",
            },
            {
                name: "Maximum 100",
                value: "m100",
            },
            {
                name: "Maximum 50",
                value: "m50",
            },
            {
                name: "Unstable Rate",
                value: "ur",
            },
        ];

    static readonly bonusCommandChoices: ApplicationCommandOptionChoiceData<string>[] =
        this.passCommandChoices.concat({
            name: "Mods",
            value: "mod",
        });

    private readonly challengeChannelID = "669221772083724318";

    constructor(
        data: DatabaseChallenge = DatabaseManager.aliceDb?.collections.challenge
            .defaultDocument ?? {},
    ) {
        super();

        this._id = data._id;
        this.challengeid = data.challengeid;
        this.beatmapid = data.beatmapid;
        this.featured = data.featured || Config.botOwners[1];
        this.link = data.link;
        this.status = data.status;
        this.hash = data.hash;
        this.constrain = data.constrain;
        this.points = data.points;
        this.timelimit = data.timelimit;
        this.pass = data.pass;
        this.bonus = ArrayHelper.arrayToCollection(data.bonus ?? [], "id");
    }

    /**
     * Starts the challenge.
     *
     * @param language The locale of the user who attempted to start the challenge. Defaults to English.
     * @returns An object containing information about the operation.
     */
    async start(language: Language = "en"): Promise<OperationResult> {
        const localization = this.getLocalization(language);

        if (this.status !== "scheduled") {
            return this.createOperationResult(
                false,
                localization.getTranslation("challengeNotFound"),
            );
        }

        // Check if any challenges are ongoing
        if (
            await DatabaseManager.aliceDb.collections.challenge.getOngoingChallenge(
                this.type,
            )
        ) {
            return this.createOperationResult(
                false,
                localization.getTranslation("challengeOngoing"),
            );
        }

        this.status = "ongoing";

        this.timelimit =
            Math.floor(Date.now() / 1000) + 86400 * (this.isWeekly ? 7 : 1);

        const notificationChannel = <TextChannel>(
            await this.client.channels.fetch(this.challengeChannelID)
        );

        const challengeEmbedOptions = await EmbedCreator.createChallengeEmbed(
            this,
            this.isWeekly ? "#af46db" : "#e3b32d",
            language,
        );

        if (!challengeEmbedOptions) {
            return this.createOperationResult(
                false,
                localization.getTranslation("challengeEmbedGenerationFailed"),
            );
        }

        await notificationChannel.send({
            content: MessageCreator.createAccept(
                `Successfully started challenge \`${
                    this.challengeid
                }\`.\n${roleMention("674918022116278282")}`,
            ),
            ...challengeEmbedOptions,
        });

        return DatabaseManager.aliceDb.collections.challenge.updateOne(
            { challengeid: this.challengeid },
            {
                $set: {
                    status: "ongoing",
                    timelimit: this.timelimit,
                },
            },
        );
    }

    /**
     * Ends the challenge.
     *
     * @param force Whether to force end the challenge.
     * @param language The locale of the user who attempted to end the challenge. Defaults to English.
     * @returns An object containing information about the operation.
     */
    async end(
        force?: boolean,
        language: Language = "en",
    ): Promise<OperationResult> {
        const localization = this.getLocalization(language);

        if (!this.isOngoing) {
            return this.createOperationResult(
                false,
                localization.getTranslation("challengeNotOngoing"),
            );
        }

        if (
            !force &&
            DateTimeFormatHelper.getTimeDifference(this.timelimit * 1000) > 0
        ) {
            return this.createOperationResult(
                false,
                localization.getTranslation("challengeNotExpired"),
            );
        }

        this.status = "finished";

        const notificationChannel = <TextChannel>(
            await this.client.channels.fetch(this.challengeChannelID)
        );

        const challengeEmbedOptions = await EmbedCreator.createChallengeEmbed(
            this,
            this.isWeekly ? "#af46db" : "#e3b32d",
            language,
        );

        if (!challengeEmbedOptions) {
            return this.createOperationResult(
                false,
                localization.getTranslation("challengeEmbedGenerationFailed"),
            );
        }

        await notificationChannel.send({
            content: MessageCreator.createAccept(
                `Successfully ended challenge \`${this.challengeid}\`.`,
            ),
            ...challengeEmbedOptions,
        });

        await DatabaseManager.aliceDb.collections.challenge.updateOne(
            { challengeid: this.challengeid },
            { $set: { status: this.status } },
        );

        // Award first place in leaderboard
        const firstPlaceScore = (await this.getCurrentLeaderboard()).shift();

        if (firstPlaceScore) {
            const winnerBindInfo =
                await DatabaseManager.elainaDb.collections.userBind.getFromUid(
                    firstPlaceScore.uid,
                    {
                        projection: {
                            _id: 0,
                            uid: 1,
                        },
                    },
                );

            if (winnerBindInfo) {
                await DatabaseManager.aliceDb.collections.playerInfo.updateOne(
                    { uid: winnerBindInfo.uid },
                    {
                        $inc: {
                            points: this.isWeekly ? 50 : 25,
                            coins: this.isWeekly ? 100 : 50,
                        },
                    },
                );

                await DatabaseManager.elainaDb.collections.clan.updateOne(
                    { "member_list.id": winnerBindInfo.discordid },
                    { $inc: { power: this.isWeekly ? 50 : 25 } },
                );

                const coinEmoji = this.client.emojis.cache.get(
                    Constants.mahiruCoinEmote,
                )!;

                await notificationChannel.send({
                    content: MessageCreator.createAccept(
                        `Congratulations to ${userMention(
                            winnerBindInfo.discordid,
                        )} for achieving first place in challenge \`${
                            this.challengeid
                        }\`, earning them \`${
                            this.isWeekly ? "50" : "25"
                        }\` points and ${coinEmoji}\`${
                            this.isWeekly ? "100" : "50"
                        }\` Mahiru coins!`,
                    ),
                });
            }
        }

        return this.createOperationResult(true);
    }

    /**
     * Checks whether a score fulfills the challenge requirement.
     *
     * @param score The score.
     * @param replay The replay of the score, if any.
     * @param language The locale of the user who attempted to check the score. Defaults to English.
     * @returns An object containing information about the operation.
     */
    async checkScoreCompletion(
        score:
            | Pick<
                  OfficialDatabaseScore,
                  | "id"
                  | "score"
                  | "mode"
                  | "combo"
                  | "mode"
                  | "perfect"
                  | "good"
                  | "bad"
                  | "miss"
                  | "mark"
              >
            | Score,
        replay?: ReplayAnalyzer,
        language: Language = "en",
    ): Promise<OperationResult> {
        const localization = this.getLocalization(language);
        const mods =
            score instanceof Score
                ? score.mods
                : DroidHelper.parseMods(score.mode).mods;

        if (!this.isConstrainFulfilled(mods)) {
            return this.createOperationResult(
                false,
                localization.getTranslation("constrainNotFulfilled"),
            );
        }

        if (!this.isModFulfilled(mods)) {
            return this.createOperationResult(
                false,
                localization.getTranslation("eznfhtUsage"),
            );
        }

        replay ??= new ReplayAnalyzer({
            scoreID: score.id,
        });
        await ReplayHelper.analyzeReplay(replay);

        const { data } = replay;

        if (!data) {
            return this.createOperationResult(
                false,
                localization.getTranslation("replayNotFound"),
            );
        }

        if (data.isReplayV4() && data.forceAR !== undefined) {
            return this.createOperationResult(
                false,
                localization.getTranslation("customARSpeedMulUsage"),
            );
        }

        if (
            data.isReplayV5() &&
            (data.forceCS !== undefined ||
                data.forceAR !== undefined ||
                data.forceOD !== undefined ||
                data.forceHP !== undefined)
        ) {
            return this.createOperationResult(
                false,
                localization.getTranslation("customARSpeedMulUsage"),
            );
        }

        const calcParams =
            BeatmapDifficultyHelper.getCalculationParamsFromScore(score);
        const droidAttribs =
            await PPProcessorRESTManager.getPerformanceAttributes(
                this.beatmapid,
                Modes.droid,
                PPCalculationMethod.live,
                calcParams,
            );

        if (!droidAttribs) {
            return this.createOperationResult(
                false,
                localization.getTranslation("beatmapNotFound"),
            );
        }

        const osuAttribs =
            await PPProcessorRESTManager.getPerformanceAttributes(
                this.beatmapid,
                Modes.osu,
                PPCalculationMethod.live,
                calcParams,
            );

        if (!osuAttribs) {
            return this.createOperationResult(
                false,
                localization.getTranslation("beatmapNotFound"),
            );
        }

        const pass = await this.verifyPassCompletion(
            score,
            droidAttribs.attributes,
            osuAttribs.attributes,
            replay.calculateHitError()!,
        );

        return this.createOperationResult(
            pass,
            localization.getTranslation("passReqNotFulfilled"),
        );
    }

    /**
     * Checks whether a replay fulfills the challenge requirement.
     *
     * @param score The data of the replay.
     * @param language The locale of the user who attempted to check the replay. Defaults to English.
     * @returns An object containing information about the operation.
     */
    async checkReplayCompletion(
        replay: ReplayAnalyzer,
        language: Language = "en",
    ): Promise<OperationResult> {
        const localization = this.getLocalization(language);

        if (!replay.data) {
            await ReplayHelper.analyzeReplay(replay);

            if (!replay.data) {
                return this.createOperationResult(
                    false,
                    localization.getTranslation("cannotParseReplay"),
                );
            }
        }

        const { data } = replay;

        if (!data.isReplayV3()) {
            return this.createOperationResult(
                false,
                localization.getTranslation("constrainNotFulfilled"),
            );
        }

        if (!this.isConstrainFulfilled(data.convertedMods)) {
            return this.createOperationResult(
                false,
                localization.getTranslation("constrainNotFulfilled"),
            );
        }

        if (!this.isModFulfilled(data.convertedMods)) {
            return this.createOperationResult(
                false,
                localization.getTranslation("eznfhtUsage"),
            );
        }

        if (data.isReplayV4() && data.forceAR !== undefined) {
            return this.createOperationResult(
                false,
                localization.getTranslation("customARSpeedMulUsage"),
            );
        }

        if (
            data.isReplayV5() &&
            (data.forceCS !== undefined ||
                data.forceAR !== undefined ||
                data.forceOD !== undefined ||
                data.forceHP !== undefined)
        ) {
            return this.createOperationResult(
                false,
                localization.getTranslation("customARSpeedMulUsage"),
            );
        }

        const attribs = await this.getReplayCalculationResult(replay);

        if (!attribs) {
            return this.createOperationResult(
                false,
                localization.getTranslation("beatmapNotFound"),
            );
        }

        const pass = await this.verifyPassCompletion(
            replay,
            attribs[0],
            attribs[1],
            replay.calculateHitError()!,
        );

        return this.createOperationResult(
            pass,
            localization.getTranslation("passReqNotFulfilled"),
        );
    }

    /**
     * Calculates the bonus level achieved by a replay with respect to the challenge.
     *
     * @param replay The replay.
     * @returns The bonus level.
     */
    async calculateBonusLevel(replay: ReplayAnalyzer): Promise<number>;

    /**
     * Calculates the bonus level achieved by a score with respect to the challenge.
     *
     * @param score The score.
     * @returns The bonus level.
     */
    async calculateBonusLevel(
        score:
            | Pick<
                  OfficialDatabaseScore,
                  | "id"
                  | "score"
                  | "combo"
                  | "perfect"
                  | "good"
                  | "bad"
                  | "miss"
                  | "mode"
                  | "mark"
              >
            | Score,
    ): Promise<number>;

    async calculateBonusLevel(
        scoreOrReplay:
            | Pick<
                  OfficialDatabaseScore,
                  | "id"
                  | "score"
                  | "combo"
                  | "perfect"
                  | "good"
                  | "bad"
                  | "miss"
                  | "mode"
                  | "mark"
              >
            | Score
            | ReplayAnalyzer,
    ): Promise<number> {
        const replay = await ReplayHelper.analyzeReplay(scoreOrReplay);
        const { data } = replay;

        if (!data) {
            return 0;
        }

        let droidAttribs: CompleteCalculationAttributes<
            DroidDifficultyAttributes,
            DroidPerformanceAttributes
        > | null = null;
        let osuAttribs: CompleteCalculationAttributes<
            OsuDifficultyAttributes,
            OsuPerformanceAttributes
        > | null = null;

        if (scoreOrReplay instanceof Score) {
            const calcParams =
                BeatmapDifficultyHelper.getCalculationParamsFromScore(
                    scoreOrReplay,
                );

            droidAttribs =
                (
                    await PPProcessorRESTManager.getPerformanceAttributes(
                        this.beatmapid,
                        Modes.droid,
                        PPCalculationMethod.live,
                        calcParams,
                    )
                )?.attributes ?? null;
            osuAttribs =
                (
                    await PPProcessorRESTManager.getPerformanceAttributes(
                        this.beatmapid,
                        Modes.osu,
                        PPCalculationMethod.live,
                        calcParams,
                    )
                )?.attributes ?? null;
        } else if (scoreOrReplay instanceof ReplayAnalyzer) {
            const attribs =
                await this.getReplayCalculationResult(scoreOrReplay);

            if (attribs) {
                [droidAttribs, osuAttribs] = attribs;
            }
        } else {
            const calcParams =
                BeatmapDifficultyHelper.getCalculationParamsFromScore(
                    scoreOrReplay,
                );

            droidAttribs =
                (
                    await PPProcessorRESTManager.getPerformanceAttributes(
                        this.beatmapid,
                        Modes.droid,
                        PPCalculationMethod.live,
                        calcParams,
                    )
                )?.attributes ?? null;

            osuAttribs =
                (
                    await PPProcessorRESTManager.getPerformanceAttributes(
                        this.beatmapid,
                        Modes.osu,
                        PPCalculationMethod.live,
                        calcParams,
                    )
                )?.attributes ?? null;
        }

        if (!droidAttribs || !osuAttribs) {
            return 0;
        }

        const scoreV2 =
            scoreOrReplay instanceof ReplayAnalyzer
                ? await this.calculateChallengeScoreV2(scoreOrReplay.data!)
                : await this.calculateChallengeScoreV2(scoreOrReplay);

        const hitErrorInformation = replay.calculateHitError();

        let level = 0;

        for (const bonus of this.bonus.values()) {
            let highestLevel = 0;

            for (const tier of bonus.list) {
                let bonusComplete = false;

                switch (bonus.id) {
                    case "score": {
                        let score: number;

                        if (scoreOrReplay instanceof ReplayAnalyzer) {
                            const data = scoreOrReplay.data!;

                            score = data.isReplayV3() ? data.score : 0;
                        } else {
                            score = scoreOrReplay.score;
                        }

                        bonusComplete = score >= +tier.value;
                        break;
                    }
                    case "acc": {
                        const accuracy =
                            scoreOrReplay instanceof Score
                                ? scoreOrReplay.accuracy
                                : scoreOrReplay instanceof ReplayAnalyzer
                                  ? scoreOrReplay.data!.accuracy
                                  : new Accuracy({
                                        n300: scoreOrReplay.perfect,
                                        n100: scoreOrReplay.good,
                                        n50: scoreOrReplay.bad,
                                        nmiss: scoreOrReplay.miss,
                                    });

                        bonusComplete = accuracy.value() * 100 >= +tier.value;
                        break;
                    }
                    case "miss": {
                        const miss =
                            scoreOrReplay instanceof Score
                                ? scoreOrReplay.accuracy.nmiss
                                : scoreOrReplay instanceof ReplayAnalyzer
                                  ? scoreOrReplay.data!.accuracy.nmiss
                                  : scoreOrReplay.miss;

                        bonusComplete = miss < +tier.value || !miss;
                        break;
                    }
                    case "combo": {
                        let combo: number;

                        if (scoreOrReplay instanceof ReplayAnalyzer) {
                            const data = scoreOrReplay.data!;

                            combo = data.isReplayV3() ? data.maxCombo : 0;
                        } else {
                            combo = scoreOrReplay.combo;
                        }

                        bonusComplete = combo >= +tier.value;
                        break;
                    }
                    case "scorev2": {
                        bonusComplete = scoreV2 >= +tier.value;
                        break;
                    }
                    case "mod": {
                        const mods = ModUtil.pcStringToMods(
                            droidAttribs.params.mods,
                        );

                        bonusComplete =
                            StringHelper.sortAlphabet(
                                mods.reduce((a, v) => a + v.acronym, ""),
                            ) ===
                            StringHelper.sortAlphabet(
                                (<string>tier.value).toUpperCase(),
                            );
                        break;
                    }
                    case "rank": {
                        const rank =
                            scoreOrReplay instanceof Score
                                ? scoreOrReplay.rank
                                : scoreOrReplay instanceof ReplayAnalyzer
                                  ? scoreOrReplay.data!.rank
                                  : scoreOrReplay.mark;

                        bonusComplete =
                            this.getRankTier(rank) >=
                            this.getRankTier(<string>tier.value);
                        break;
                    }
                    case "dpp":
                        bonusComplete =
                            droidAttribs.performance.total >= +tier.value;
                        break;
                    case "pp":
                        bonusComplete =
                            osuAttribs.performance.total >= +tier.value;
                        break;
                    case "m300": {
                        const n300 =
                            scoreOrReplay instanceof Score
                                ? scoreOrReplay.accuracy.n300
                                : scoreOrReplay instanceof ReplayAnalyzer
                                  ? scoreOrReplay.data!.accuracy.n300
                                  : scoreOrReplay.perfect;

                        bonusComplete = n300 >= +tier.value;
                        break;
                    }
                    case "m100": {
                        const n100 =
                            scoreOrReplay instanceof Score
                                ? scoreOrReplay.accuracy.n100
                                : scoreOrReplay instanceof ReplayAnalyzer
                                  ? scoreOrReplay.data!.accuracy.n100
                                  : scoreOrReplay.good;

                        bonusComplete = n100 <= +tier.value;
                        break;
                    }
                    case "m50": {
                        const n50 =
                            scoreOrReplay instanceof Score
                                ? scoreOrReplay.accuracy.n50
                                : scoreOrReplay instanceof ReplayAnalyzer
                                  ? scoreOrReplay.data!.accuracy.n50
                                  : scoreOrReplay.bad;

                        bonusComplete = n50 <= +tier.value;
                        break;
                    }
                    case "ur":
                        bonusComplete =
                            (hitErrorInformation?.unstableRate ??
                                Number.POSITIVE_INFINITY) <= +tier.value;
                        break;
                }

                if (bonusComplete) {
                    highestLevel = Math.max(highestLevel, tier.level);
                }
            }

            level += highestLevel;
        }

        return level;
    }

    /**
     * Gets the top 100 leaderboard of the challenge.
     *
     * @returns The scores that are in the leaderboard of the challenge, sorted by score.
     */
    getCurrentLeaderboard(): Promise<Score[]> {
        return DroidHelper.getBeatmapLeaderboard(this.hash);
    }

    /**
     * Gets the pass requirement information of the challenge.
     *
     * @param language The locale to get the information for. Defaults to English.
     */
    getPassInformation(language: Language = "en"): string {
        return this.getPassOrBonusDescription(
            this.pass.id,
            +this.pass.value,
            language,
        );
    }

    /**
     * Gets the bonus requirement information of the challenge.
     *
     * @param language The locale to get the information for. Defaults to English.
     */
    getBonusInformation(language: Language = "en"): BonusDescription[] {
        const localization = this.getLocalization(language);

        return this.bonus.map((v) => {
            return {
                id: localization.getTranslation(this.bonusIdToString(v.id)),
                description: v.list
                    .map(
                        (b) =>
                            `${bold(
                                `${localization.getTranslation("level")} ${
                                    b.level
                                }`,
                            )}: ${this.getPassOrBonusDescription(
                                v.id,
                                b.value,
                                language,
                            )}`,
                    )
                    .join("\n"),
            };
        });
    }

    /**
     * Gets the modified beatmap file of the challenge.
     *
     * If the challenge hasn't started, the challenge will be updated
     * with the new file hash if the current hash doesn't match.
     *
     * @returns The beatmap file, `null` if the beatmap could not be downloaded.
     */
    async getBeatmapFile(): Promise<string | null> {
        const beatmapFileReq = await RESTManager.request(
            `https://osu.ppy.sh/osu/${this.beatmapid}`,
        );

        if (beatmapFileReq.statusCode !== 200) {
            return null;
        }

        const lines = beatmapFileReq.data.toString().split("\n");

        for (let i = 0; i < lines.length; ++i) {
            let line = lines[i];

            if (line.startsWith(" ") || line.startsWith("_")) {
                continue;
            }

            line = line.trim();

            if (line.length === 0 || line.startsWith("//")) {
                continue;
            }

            const p = line.split(":").map((s) => s.trim());

            if (p.length < 2) {
                continue;
            }

            if (p[0] === "Version") {
                const matched = this.challengeid.match(/(\d+)$/)!;
                const id = parseInt(matched[0]);
                const actualVersion = p.slice(1).join(":");

                if (this.isWeekly) {
                    lines[i] =
                        `${p[0]}:(Weekly Challenge ${id}) ${actualVersion}`;
                } else {
                    lines[i] = `${p[0]}:(Challenge ${id}) ${actualVersion}`;
                }

                break;
            }

            if (line.startsWith("[Difficulty]")) {
                break;
            }
        }

        const finalFile = lines.join("\n");

        if (this.isScheduled) {
            const hash = createHash("md5").update(finalFile).digest("hex");

            if (this.hash !== hash) {
                await DatabaseManager.aliceDb.collections.challenge.updateOne(
                    { challengeid: this.challengeid },
                    {
                        $set: {
                            hash: hash,
                        },
                    },
                );
            }
        }

        return finalFile;
    }

    /**
     * Checks if a sequence of mods fulfills the challenge's constrain.
     *
     * @param mods The mods.
     */
    private isConstrainFulfilled(mods: Mod[]): boolean {
        return (
            !this.constrain ||
            StringHelper.sortAlphabet(
                mods.reduce((a, v) => a + v.acronym, ""),
            ) === StringHelper.sortAlphabet(this.constrain.toUpperCase())
        );
    }

    /**
     * Checks if a sequence of mods fulfills general challenge requirement.
     *
     * @param mods The mods.
     */
    private isModFulfilled(mods: Mod[]): boolean {
        return !mods.some(
            (m) =>
                m instanceof ModEasy ||
                m instanceof ModNoFail ||
                m instanceof ModHalfTime,
        );
    }

    /**
     * Verifies whether a score passes the challenge.
     *
     * @param score The score to verify.
     * @param droidAttribs The osu!droid complete attributes of the score.
     * @param osuAttribs The osu!standard complete attributes of the score.
     * @param hitErrorInformation The hit error information of the score.
     */
    private async verifyPassCompletion(
        score:
            | Pick<
                  OfficialDatabaseScore,
                  | "score"
                  | "combo"
                  | "perfect"
                  | "good"
                  | "bad"
                  | "miss"
                  | "mode"
                  | "mark"
              >
            | Score,
        droidAttribs: CompleteCalculationAttributes<
            DroidDifficultyAttributes,
            DroidPerformanceAttributes
        >,
        osuAttribs: CompleteCalculationAttributes<
            OsuDifficultyAttributes,
            OsuPerformanceAttributes
        >,
        hitErrorInformation: HitErrorInformation,
    ): Promise<boolean>;

    /**
     * Verifies whether a replay passes the challenge.
     *
     * @param replay The replay to verify.
     * @param calcResult The calculation result of the replay.
     * @param hitErrorInformation The hit error information of the replay.
     */
    private async verifyPassCompletion(
        replay: ReplayAnalyzer,
        droidAttribs: CompleteCalculationAttributes<
            DroidDifficultyAttributes,
            DroidPerformanceAttributes
        >,
        osuAttribs: CompleteCalculationAttributes<
            OsuDifficultyAttributes,
            OsuPerformanceAttributes
        >,
        hitErrorInformation: HitErrorInformation,
    ): Promise<boolean>;

    private async verifyPassCompletion(
        scoreOrReplay:
            | Pick<
                  OfficialDatabaseScore,
                  | "score"
                  | "combo"
                  | "perfect"
                  | "good"
                  | "bad"
                  | "miss"
                  | "mode"
                  | "mark"
              >
            | Score
            | ReplayAnalyzer,
        droidAttribs: CompleteCalculationAttributes<
            DroidDifficultyAttributes,
            DroidPerformanceAttributes
        >,
        osuAttribs: CompleteCalculationAttributes<
            OsuDifficultyAttributes,
            OsuPerformanceAttributes
        >,
        hitErrorInformation: HitErrorInformation,
    ): Promise<boolean> {
        switch (this.pass.id) {
            case "score": {
                let score: number;

                if (scoreOrReplay instanceof ReplayAnalyzer) {
                    const data = scoreOrReplay.data!;

                    score = data.isReplayV3() ? data.score : 0;
                } else {
                    score = scoreOrReplay.score;
                }

                return score >= +this.pass.value;
            }
            case "acc": {
                const accuracy =
                    scoreOrReplay instanceof Score
                        ? scoreOrReplay.accuracy
                        : scoreOrReplay instanceof ReplayAnalyzer
                          ? scoreOrReplay.data!.accuracy
                          : new Accuracy({
                                n300: scoreOrReplay.perfect,
                                n100: scoreOrReplay.good,
                                n50: scoreOrReplay.bad,
                                nmiss: scoreOrReplay.miss,
                            });

                return accuracy.value() * 100 >= +this.pass.value;
            }
            case "miss": {
                const miss =
                    scoreOrReplay instanceof Score
                        ? scoreOrReplay.accuracy.nmiss
                        : scoreOrReplay instanceof ReplayAnalyzer
                          ? scoreOrReplay.data!.accuracy.nmiss
                          : scoreOrReplay.miss;

                return miss < +this.pass.value || !miss;
            }
            case "combo": {
                let combo: number;

                if (scoreOrReplay instanceof ReplayAnalyzer) {
                    const data = scoreOrReplay.data!;

                    combo = data.isReplayV3() ? data.maxCombo : 0;
                } else {
                    combo = scoreOrReplay.combo;
                }

                return combo >= +this.pass.value;
            }
            case "scorev2": {
                const scoreV2 =
                    scoreOrReplay instanceof ReplayAnalyzer
                        ? await this.calculateChallengeScoreV2(
                              scoreOrReplay.data!,
                          )
                        : await this.calculateChallengeScoreV2(scoreOrReplay);

                return scoreV2 >= +this.pass.value;
            }
            case "rank": {
                const rank =
                    scoreOrReplay instanceof Score
                        ? scoreOrReplay.rank
                        : scoreOrReplay instanceof ReplayAnalyzer
                          ? scoreOrReplay.data!.rank
                          : scoreOrReplay.mark;

                return (
                    this.getRankTier(rank) >=
                    this.getRankTier(<string>this.pass.value)
                );
            }
            case "dpp":
                return droidAttribs.performance.total >= +this.pass.value;
            case "pp":
                return osuAttribs.performance.total >= +this.pass.value;
            case "m300": {
                const n300 =
                    scoreOrReplay instanceof Score
                        ? scoreOrReplay.accuracy.n300
                        : scoreOrReplay instanceof ReplayAnalyzer
                          ? scoreOrReplay.data!.accuracy.n300
                          : scoreOrReplay.perfect;

                return n300 >= +this.pass.value;
            }
            case "m100": {
                const n100 =
                    scoreOrReplay instanceof Score
                        ? scoreOrReplay.accuracy.n100
                        : scoreOrReplay instanceof ReplayAnalyzer
                          ? scoreOrReplay.data!.accuracy.n100
                          : scoreOrReplay.good;

                return n100 <= +this.pass.value;
            }
            case "m50": {
                const n50 =
                    scoreOrReplay instanceof Score
                        ? scoreOrReplay.accuracy.n50
                        : scoreOrReplay instanceof ReplayAnalyzer
                          ? scoreOrReplay.data!.accuracy.n50
                          : scoreOrReplay.bad;

                return n50 <= +this.pass.value;
            }
            case "ur":
                return hitErrorInformation.unstableRate <= +this.pass.value;
        }
    }

    /**
     * Converts a bonus ID into its string literal.
     *
     * @param id The bonus ID.
     * @returns The string literal of the corresponding ID.
     */
    private bonusIdToString(id: BonusID): keyof ChallengeStrings {
        switch (id) {
            case "score":
                return "scoreV1";
            case "acc":
                return "accuracy";
            case "scorev2":
                return "scoreV2";
            case "miss":
                return "missCount";
            case "combo":
                return "combo";
            case "rank":
                return "rank";
            case "mod":
                return "mods";
            case "dpp":
                return "droidPP";
            case "pp":
                return "pcPP";
            case "m300":
                return "min300";
            case "m100":
                return "max100";
            case "m50":
                return "max50";
            case "ur":
                return "maxUR";
        }
    }

    /**
     * Gets the description of a pass or bonus requirement.
     *
     * @param id The ID of the pass or bonus requirement.
     * @param value The value that must be fulfilled to pass the requirement.
     * @param language The locale to get the description for. Defaults to English.
     * @returns The description of the requirement.
     */
    private getPassOrBonusDescription(
        id: BonusID,
        value: string | number,
        language: Language = "en",
    ): string {
        const localization = this.getLocalization(language);
        const BCP47 = LocaleHelper.convertToBCP47(localization.language);

        switch (id) {
            case "score":
                return StringHelper.formatString(
                    localization.getTranslation("scoreV1Description"),
                    bold(value.toLocaleString(BCP47)),
                );
            case "acc":
                return StringHelper.formatString(
                    localization.getTranslation("accuracyDescription"),
                    bold(value.toString()),
                );
            case "scorev2":
                return StringHelper.formatString(
                    localization.getTranslation("scoreV2Description"),
                    bold(value.toLocaleString(BCP47)),
                );
            case "miss":
                return value === 0
                    ? localization.getTranslation("noMisses")
                    : StringHelper.formatString(
                          localization.getTranslation("missCountDescription"),
                          bold(value.toString()),
                      );
            case "mod":
                return StringHelper.formatString(
                    localization.getTranslation("modsDescription"),
                    bold((<string>value).toUpperCase()),
                );
            case "combo":
                return StringHelper.formatString(
                    localization.getTranslation("comboDescription"),
                    bold(value.toString()),
                );
            case "rank":
                return StringHelper.formatString(
                    localization.getTranslation("rankDescription"),
                    bold((<string>value).toUpperCase()),
                );
            case "dpp":
                return StringHelper.formatString(
                    localization.getTranslation("droidPPDescription"),
                    bold(value.toString()),
                );
            case "pp":
                return StringHelper.formatString(
                    localization.getTranslation("pcPPDescription"),
                    bold(value.toString()),
                );
            case "m300":
                return StringHelper.formatString(
                    localization.getTranslation("min300Description"),
                    bold(value.toString()),
                );
            case "m100":
                return StringHelper.formatString(
                    localization.getTranslation("max100Description"),
                    bold(value.toString()),
                );
            case "m50":
                return StringHelper.formatString(
                    localization.getTranslation("max50Description"),
                    bold(value.toString()),
                );
            case "ur":
                return StringHelper.formatString(
                    localization.getTranslation("maxURDescription"),
                    bold(value.toString()),
                );
        }
    }

    /**
     * Gets the tier of a rank.
     *
     * @param rank The rank.
     * @returns The tier of the rank.
     */
    private getRankTier(rank: string): number {
        switch (rank.toUpperCase()) {
            case "D":
                return 1;
            case "C":
                return 2;
            case "B":
                return 3;
            case "A":
                return 4;
            case "S":
                return 5;
            case "SH":
                return 6;
            case "X":
                return 7;
            case "XH":
                return 8;
            default:
                return 0;
        }
    }

    /**
     * Calculates a score or replay with respect to the challenge.
     *
     * @param scoreOrReplay The score or replay to calculate.
     * @returns The calculation result.
     */
    private async getReplayCalculationResult(
        scoreOrReplay: OfficialDatabaseScore | ReplayAnalyzer,
    ): Promise<
        | [
              CompleteCalculationAttributes<
                  DroidDifficultyAttributes,
                  DroidPerformanceAttributes
              >,
              CompleteCalculationAttributes<
                  OsuDifficultyAttributes,
                  OsuPerformanceAttributes
              >,
          ]
        | null
    > {
        let calcParams: PerformanceCalculationParameters;

        if (scoreOrReplay instanceof ReplayAnalyzer) {
            const { data } = scoreOrReplay;

            if (!data?.isReplayV3()) {
                return null;
            }

            calcParams = new PerformanceCalculationParameters({
                accuracy: data.accuracy,
                inputAccuracy: data.accuracy.value() * 100,
                combo: data.maxCombo,
                mods: data.convertedMods,
                forceCS: data.isReplayV5() ? data.forceCS : undefined,
                forceAR: data.isReplayV4() ? data.forceAR : undefined,
                forceOD: data.isReplayV5() ? data.forceOD : undefined,
                forceHP: data.isReplayV5() ? data.forceHP : undefined,
                customSpeedMultiplier: data.isReplayV4()
                    ? data.speedMultiplier
                    : undefined,
                oldStatistics: !data.isReplayV3(),
            });
        } else {
            calcParams =
                BeatmapDifficultyHelper.getCalculationParamsFromScore(
                    scoreOrReplay,
                );
        }

        const droidAttribs =
            await PPProcessorRESTManager.getPerformanceAttributes(
                this.beatmapid,
                Modes.droid,
                PPCalculationMethod.live,
                calcParams,
            );

        if (!droidAttribs) {
            return null;
        }

        const osuAttribs =
            await PPProcessorRESTManager.getPerformanceAttributes(
                this.beatmapid,
                Modes.osu,
                PPCalculationMethod.live,
                calcParams,
            );

        if (!osuAttribs) {
            return null;
        }

        return [droidAttribs.attributes, osuAttribs.attributes];
    }

    /**
     * Calculates the ScoreV2 of a replay.
     *
     * @param replay The data of the replay.
     */
    private async calculateChallengeScoreV2(
        replay: ReplayData,
    ): Promise<number>;

    /**
     * Calculates the ScoreV2 of a score.
     *
     * @param score The score.
     */
    private async calculateChallengeScoreV2(
        score:
            | Pick<
                  OfficialDatabaseScore,
                  "score" | "perfect" | "good" | "bad" | "miss" | "mode"
              >
            | Score,
    ): Promise<number>;

    private async calculateChallengeScoreV2(
        scoreOrReplay:
            | Pick<
                  OfficialDatabaseScore,
                  "score" | "perfect" | "good" | "bad" | "miss" | "mode"
              >
            | Score
            | ReplayData,
    ): Promise<number> {
        const beatmapInfo = (await BeatmapManager.getBeatmap(this.beatmapid))!;

        const speedMultiplier =
            scoreOrReplay instanceof Score
                ? scoreOrReplay.speedMultiplier
                : scoreOrReplay instanceof ReplayData
                  ? scoreOrReplay.isReplayV4()
                      ? scoreOrReplay.speedMultiplier
                      : 1
                  : DroidHelper.parseMods(scoreOrReplay.mode).speedMultiplier;

        const maximumScore = beatmapInfo.beatmap.maxDroidScore(
            ModUtil.pcStringToMods(this.constrain),
            speedMultiplier,
        );

        const accuracy =
            scoreOrReplay instanceof Score ||
            scoreOrReplay instanceof ReplayData
                ? scoreOrReplay.accuracy
                : new Accuracy({
                      n300: scoreOrReplay.perfect,
                      n100: scoreOrReplay.good,
                      n50: scoreOrReplay.bad,
                      nmiss: scoreOrReplay.miss,
                  });

        const scoreV1 =
            scoreOrReplay instanceof ReplayData
                ? scoreOrReplay.isReplayV3()
                    ? scoreOrReplay.score
                    : 0
                : scoreOrReplay.score;

        const tempScoreV2 =
            (scoreV1 / maximumScore) * 6e5 +
            Math.pow(accuracy.value(), 4) * 4e5;

        return tempScoreV2 - accuracy.nmiss * 0.003 * tempScoreV2;
    }

    /**
     * Gets the localization of this database utility.
     *
     * @param language The language to localize.
     */
    private getLocalization(language: Language): ChallengeLocalization {
        return new ChallengeLocalization(language);
    }
}
