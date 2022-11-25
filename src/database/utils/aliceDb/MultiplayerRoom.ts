import { DatabaseManager } from "@alice-database/DatabaseManager";
import { MultiplayerTeam } from "@alice-enums/multiplayer/MultiplayerTeam";
import { MultiplayerTeamMode } from "@alice-enums/multiplayer/MultiplayerTeamMode";
import { MultiplayerWinCondition } from "@alice-enums/multiplayer/MultiplayerWinCondition";
import { Symbols } from "@alice-enums/utils/Symbols";
import { OperationResult } from "structures/core/OperationResult";
import { DatabaseMultiplayerRoom } from "structures/database/aliceDb/DatabaseMultiplayerRoom";
import { MultiplayerPlayer } from "@alice-structures/multiplayer/MultiplayerPlayer";
import { MultiplayerRoomSettings } from "@alice-structures/multiplayer/MultiplayerRoomSettings";
import { MultiplayerRoomStatus } from "@alice-structures/multiplayer/MultiplayerRoomStatus";
import { MultiplayerScore } from "@alice-structures/multiplayer/MultiplayerScore";
import { MultiplayerScoreFinalResult } from "@alice-structures/multiplayer/MultiplayerScoreFinalResult";
import { Language } from "@alice-localization/base/Language";
import {
    MultiplayerRoomLocalization,
    MultiplayerRoomStrings,
} from "@alice-localization/database/utils/aliceDb/MultiplayerRoom/MultiplayerRoomLocalization";
import { ScoreRank } from "structures/utils/ScoreRank";
import { Manager } from "@alice-utils/base/Manager";
import { EmbedCreator } from "@alice-utils/creators/EmbedCreator";
import { PerformanceCalculationParameters } from "@alice-utils/dpp/PerformanceCalculationParameters";
import { PerformanceCalculationResult } from "@alice-utils/dpp/PerformanceCalculationResult";
import { DifficultyCalculationParameters } from "@alice-utils/dpp/DifficultyCalculationParameters";
import { DifficultyCalculationResult } from "@alice-utils/dpp/DifficultyCalculationResult";
import { DateTimeFormatHelper } from "@alice-utils/helpers/DateTimeFormatHelper";
import { DroidBeatmapDifficultyHelper } from "@alice-utils/helpers/DroidBeatmapDifficultyHelper";
import { LocaleHelper } from "@alice-utils/helpers/LocaleHelper";
import { OsuBeatmapDifficultyHelper } from "@alice-utils/helpers/OsuBeatmapDifficultyHelper";
import { ScoreHelper } from "@alice-utils/helpers/ScoreHelper";
import { StringHelper } from "@alice-utils/helpers/StringHelper";
import { BeatmapManager } from "@alice-utils/managers/BeatmapManager";
import {
    MathUtils,
    Accuracy,
    ModUtil,
    MapStats,
    Mod,
    MapInfo,
    Precision,
    IModApplicableToDroid,
} from "@rian8337/osu-base";
import {
    DroidDifficultyCalculator,
    DroidPerformanceCalculator,
    OsuDifficultyCalculator,
    OsuPerformanceCalculator,
} from "@rian8337/osu-difficulty-calculator";
import {
    APIEmbedField,
    EmbedBuilder,
    Snowflake,
    TextChannel,
    ThreadChannel,
} from "discord.js";
import { ObjectId } from "mongodb";
import { MultiplayerRESTManager } from "@alice-utils/managers/MultiplayerRESTManager";

/**
 * Represents a multiplayer room.
 */
export class MultiplayerRoom
    extends Manager
    implements DatabaseMultiplayerRoom
{
    readonly roomId: string;
    textChannelId: Snowflake;
    threadChannelId: Snowflake;
    players: MultiplayerPlayer[];
    status: MultiplayerRoomStatus;
    currentScores: MultiplayerScore[];
    settings: MultiplayerRoomSettings;
    _id?: ObjectId;

    private readonly droidStarRatingCalculationCache: Record<
        string,
        DifficultyCalculationResult<DroidDifficultyCalculator>
    > = {};
    private readonly pcStarRatingCalculationCache: Record<
        string,
        DifficultyCalculationResult<OsuDifficultyCalculator>
    > = {};

    private currentBeatmapMaxScore?: number;

    private get speedScoreMultiplier(): number {
        let speedScoreMultiplier: number = 1;

        if (this.settings.speedMultiplier >= 1) {
            speedScoreMultiplier *=
                1 + (this.settings.speedMultiplier - 1) * 0.24;
        } else {
            speedScoreMultiplier *= Math.pow(
                0.3,
                (1 - this.settings.speedMultiplier) * 4
            );
        }

        return speedScoreMultiplier;
    }

    constructor(
        data: DatabaseMultiplayerRoom = DatabaseManager.aliceDb?.collections
            .multiplayerRoom.defaultDocument ?? {}
    ) {
        super();

        this.roomId = data.roomId;
        this.textChannelId = data.textChannelId;
        this.threadChannelId = data.threadChannelId;
        this.players = data.players;
        this.status = data.status;
        this.currentScores = data.currentScores;
        this.settings = data.settings;
        this._id = data._id;
    }

    /**
     * Finishes the current beatmap by updating the database.
     */
    finishRound(): Promise<OperationResult> {
        this.status.isPlaying = false;
        this.status.playingSince = Date.now();

        return DatabaseManager.aliceDb.collections.multiplayerRoom.updateOne(
            { roomId: this.roomId },
            {
                $set: {
                    "players.$[].isReady": false,
                    status: this.status,
                },
            }
        );
    }

    /**
     * Deletes this room from the database.
     */
    async deleteRoom(): Promise<OperationResult> {
        const text: TextChannel | null = <TextChannel | null>(
            await this.client.channels
                .fetch(this.textChannelId)
                .catch(() => null)
        );

        const thread: ThreadChannel | null =
            (await text?.threads
                .fetch(this.threadChannelId)
                .catch(() => null)) ?? null;

        await thread?.setLocked(true, "Multiplayer room closed");

        MultiplayerRESTManager.broadcastRoomClosed(this.roomId);

        return DatabaseManager.aliceDb.collections.multiplayerRoom.deleteOne({
            roomId: this.roomId,
        });
    }

    /**
     * Gets an embed representing this multiplayer room.
     *
     * @param language The language to localize. Defaults to English.
     */
    getStatsEmbed(language: Language = "en"): EmbedBuilder {
        const localization: MultiplayerRoomLocalization =
            this.getLocalization(language);

        const embed: EmbedBuilder = EmbedCreator.createNormalEmbed({
            color: "Blurple",
        });

        const BCP47: string = LocaleHelper.convertToBCP47(language);

        embed
            .setAuthor({
                name: this.settings.roomName,
            })
            .setDescription(
                `**${localization.getTranslation("roomId")}**: ${
                    this.roomId
                }\n` +
                    `**${localization.getTranslation(
                        "creationDate"
                    )}**: ${DateTimeFormatHelper.dateToLocaleString(
                        this._id!.getTimestamp(),
                        localization.language
                    )}\n` +
                    `**${localization.getTranslation("host")}**: <@${
                        this.settings.roomHost
                    }> (${this.settings.roomHost})\n` +
                    `**${localization.getTranslation("password")}**: ${
                        this.settings.password
                            ? Symbols.checkmark
                            : Symbols.cross
                    }\n` +
                    `**${localization.getTranslation(
                        "playerCount"
                    )}**: ${this.players.length.toLocaleString(
                        BCP47
                    )}/${this.settings.maxPlayers.toLocaleString(BCP47)}`
            )
            .addFields(
                {
                    name: localization.getTranslation("currentBeatmap"),
                    value: this.settings.beatmap
                        ? `[${this.settings.beatmap.name}](https://osu.ppy.sh/b/${this.settings.beatmap.id})`
                        : localization.getTranslation("none"),
                },
                {
                    name: localization.getTranslation("settings"),
                    value:
                        `**${localization.getTranslation(
                            "teamMode"
                        )}**: ${this.teamModeToString(language)}\n` +
                        `**${localization.getTranslation(
                            "winCondition"
                        )}**: ${this.winConditionToString(language)}\n` +
                        `**${localization.getTranslation("scorePortion")}**: ${(
                            this.settings.scorePortion * 100
                        )
                            .toFixed(2)
                            .toLocaleUpperCase(BCP47)}%\n` +
                        `**${localization.getTranslation("forceAR")}**: ${
                            this.settings.forcedAR.allowed
                                ? Symbols.checkmark
                                : Symbols.cross
                        } (${this.settings.forcedAR.minValue.toLocaleString(
                            BCP47
                        )} min, ${this.settings.forcedAR.maxValue.toLocaleString(
                            BCP47
                        )} max)\n` +
                        `**${localization.getTranslation(
                            "speedMultiplier"
                        )}**: ${this.settings.speedMultiplier.toLocaleString(
                            BCP47
                        )}\n` +
                        `**${localization.getTranslation(
                            "allowSliderLock"
                        )}**: ${
                            this.settings.allowSliderLock
                                ? Symbols.checkmark
                                : Symbols.cross
                        }\n` +
                        `**${localization.getTranslation(
                            "useSliderAccuracy"
                        )}**: ${
                            this.settings.useSliderAccuracy
                                ? Symbols.checkmark
                                : Symbols.cross
                        }\n` +
                        `**${localization.getTranslation("requiredMods")}**: ${
                            this.settings.requiredMods ||
                            localization.getTranslation("none")
                        }\n` +
                        `**${localization.getTranslation("allowedMods")}**: ${
                            this.settings.allowedMods ||
                            localization.getTranslation("none")
                        }\n` +
                        `**${localization.getTranslation(
                            "customModMultipliers"
                        )}**: ${this.getCustomModMultipliersDescription(
                            language
                        )}`,
                }
            );

        return embed;
    }

    /**
     * Gets an embed representing this multiplayer room's result.
     *
     * @param language The language to localize.
     */

    async getResultEmbed(language: Language = "en"): Promise<EmbedBuilder> {
        switch (this.settings.teamMode) {
            case MultiplayerTeamMode.headToHead:
                return this.getHeadToHeadResultEmbed(language);
            case MultiplayerTeamMode.teamVS:
                return this.getTeamVSResultEmbed(language);
        }
    }

    /**
     * Gets the string representation of the current win condition.
     *
     * @param language The language to localize. Defaults to English.
     */
    winConditionToString(language: Language = "en"): string {
        const localization: MultiplayerRoomLocalization =
            this.getLocalization(language);

        let key: keyof MultiplayerRoomStrings;

        switch (this.settings.winCondition) {
            case MultiplayerWinCondition.scoreV1:
                key = "scoreV1";
                break;
            case MultiplayerWinCondition.accuracy:
                key = "accuracy";
                break;
            case MultiplayerWinCondition.maxCombo:
                key = "maxCombo";
                break;
            case MultiplayerWinCondition.scoreV2:
                key = "scoreV2";
                break;
            case MultiplayerWinCondition.most300:
                key = "most300s";
                break;
            case MultiplayerWinCondition.least100:
                key = "least100s";
                break;
            case MultiplayerWinCondition.least50:
                key = "least50s";
                break;
            case MultiplayerWinCondition.leastMisses:
                key = "leastMisses";
                break;
            case MultiplayerWinCondition.leastUnstableRate:
                key = "leastUnstableRate";
                break;
            case MultiplayerWinCondition.mostDroidPp:
                key = "mostDroidPp";
                break;
            case MultiplayerWinCondition.mostPcPp:
                key = "mostPcPp";
                break;
        }

        return localization.getTranslation(key);
    }

    /**
     * Gets the string representation of the current team mode.
     *
     * @param language The language to localize. Defaults to English.
     */
    teamModeToString(language: Language = "en"): string {
        const localization: MultiplayerRoomLocalization =
            this.getLocalization(language);

        switch (this.settings.teamMode) {
            case MultiplayerTeamMode.headToHead:
                return localization.getTranslation("headToHead");
            case MultiplayerTeamMode.teamVS:
                return localization.getTranslation("teamVS");
        }
    }

    /**
     * Gets the string representation of a team.
     *
     * @param team The team.
     * @param language The language to localize. Defaults to English.
     */
    teamToString(team: MultiplayerTeam, language: Language = "en"): string {
        const localization: MultiplayerRoomLocalization =
            this.getLocalization(language);

        switch (team) {
            case MultiplayerTeam.red:
                return localization.getTranslation("redTeam");
            case MultiplayerTeam.blue:
                return localization.getTranslation("blueTeam");
        }
    }

    /**
     * Applies custom mod multipliers to a score.
     *
     * @param score The score.
     * @param mods The mods that were used to obtain the score value.
     * @returns The score with custom mod multipliers applied.
     */
    applyCustomModMultiplier(score: number, mods: Mod[]): number {
        if (Object.keys(this.settings.modMultipliers).length === 0) {
            return Math.round(score);
        }

        for (const mod of mods) {
            if (
                mod.isApplicableToDroid() &&
                this.settings.modMultipliers[mod.acronym]
            ) {
                score *=
                    this.settings.modMultipliers[mod.acronym] /
                    mod.droidScoreMultiplier;
            }
        }

        return Math.round(score);
    }

    /**
     * Removes speed multiplier score bonus from a score value, making it equal to NoMod in-game.
     *
     * @param score The score value.
     * @returns The NoMod score.
     */
    applySpeedMulBonus(score: number): number {
        return Math.round(score * this.speedScoreMultiplier);
    }

    /**
     * Removes speed multiplier score bonus from a score value, making it equal to NoMod in-game.
     *
     * @param score The score value.
     * @returns The NoMod score.
     */
    removeSpeedMulBonus(score: number): number {
        return Math.round(score / this.speedScoreMultiplier);
    }

    /**
     * Gets an embed representing this multiplayer room's head-to-head result.
     *
     * @param language The language to localize.
     */
    private async getHeadToHeadResultEmbed(
        language: Language
    ): Promise<EmbedBuilder> {
        const localization: MultiplayerRoomLocalization =
            this.getLocalization(language);

        const embed: EmbedBuilder = await this.getInitialResultEmbed(language);

        const validScores: MultiplayerScoreFinalResult[] = [];
        const invalidScores: MultiplayerScoreFinalResult[] = [];

        for (const player of this.players) {
            if (player.isSpectating) {
                continue;
            }

            const score: MultiplayerScore | undefined = this.currentScores.find(
                (v) => v.uid === player.uid
            );

            if (!score) {
                invalidScores.push({
                    grade: 0,
                    reason: localization.getTranslation("scoreNotFound"),
                    uid: player.uid,
                    username: player.username,
                    hash: "",
                    modstring: "",
                    score: 0,
                    maxCombo: 0,
                    rank: "D",
                    geki: 0,
                    perfect: 0,
                    katu: 0,
                    good: 0,
                    bad: 0,
                    miss: 0,
                    date: 0,
                    unstableRate: 0,
                    isSliderLock: false,
                    useSliderAccuracy: false,
                    skippedTime: 0,
                });

                continue;
            }

            const scoreValidation: OperationResult = this.verifyScore(
                score,
                language
            );

            if (scoreValidation.success) {
                validScores.push({
                    ...score,
                    grade: await this.getScoreGrade(score),
                });
            } else {
                invalidScores.push({
                    ...score,
                    grade: 0,
                    reason: scoreValidation.reason!,
                });
            }
        }

        this.sortFinalScores(validScores);

        const topScore: MultiplayerScoreFinalResult = validScores.at(0)!;

        const winners: string[] = [];

        for (const score of validScores) {
            if (!Precision.almostEqualsNumber(score.grade, topScore.grade)) {
                break;
            }

            winners.push(score.username);
        }

        embed
            .addFields(
                validScores.map((v, i, a) =>
                    this.getScoreEmbedDescription(v, i + 1, language, a[i + 1])
                )
            )
            .addFields(
                invalidScores.map((v, i) => {
                    const field = this.getScoreEmbedDescription(
                        v,
                        validScores.length + i + 1,
                        language
                    );

                    field.value += ` - **${v.reason}**`;

                    return field;
                })
            )
            .addFields({
                name: "=================================",
                value: `**${
                    winners.length === this.players.length
                        ? localization.getTranslation("draw")
                        : StringHelper.formatString(
                              localization.getTranslation("won"),
                              winners.join(", ") ||
                                  localization.getTranslation("none")
                          )
                }**`,
            });

        return embed;
    }

    /**
     * Gets an embed representing this multiplayer room's Team VS result.
     *
     * @param language The language to localize.
     */
    private async getTeamVSResultEmbed(
        language: Language
    ): Promise<EmbedBuilder> {
        const localization: MultiplayerRoomLocalization =
            this.getLocalization(language);

        const embed: EmbedBuilder = await this.getInitialResultEmbed(language);

        const validRedTeamScores: MultiplayerScoreFinalResult[] = [];
        const validBlueTeamScores: MultiplayerScoreFinalResult[] = [];
        const invalidRedTeamScores: MultiplayerScoreFinalResult[] = [];
        const invalidBlueTeamScores: MultiplayerScoreFinalResult[] = [];

        for (const player of this.players) {
            if (player.isSpectating) {
                continue;
            }

            const score: MultiplayerScore | undefined = this.currentScores.find(
                (v) => v.uid === player.uid
            );

            const invalidScores: MultiplayerScoreFinalResult[] =
                player.team === MultiplayerTeam.red
                    ? invalidRedTeamScores
                    : invalidBlueTeamScores;

            if (!score) {
                invalidScores.push({
                    grade: 0,
                    reason: localization.getTranslation("scoreNotFound"),
                    uid: player.uid,
                    username: player.username,
                    hash: "",
                    modstring: "",
                    score: 0,
                    maxCombo: 0,
                    rank: "D",
                    geki: 0,
                    perfect: 0,
                    katu: 0,
                    good: 0,
                    bad: 0,
                    miss: 0,
                    date: 0,
                    unstableRate: 0,
                    isSliderLock: false,
                    useSliderAccuracy: false,
                    skippedTime: 0,
                });

                continue;
            }

            const validScores: MultiplayerScoreFinalResult[] =
                player.team === MultiplayerTeam.red
                    ? validRedTeamScores
                    : validBlueTeamScores;

            const scoreValidation: OperationResult = this.verifyScore(
                score,
                language
            );

            if (scoreValidation.success) {
                validScores.push({
                    ...score,
                    grade: await this.getScoreGrade(score),
                });
            } else {
                invalidScores.push({
                    ...score,
                    grade: 0,
                    reason: scoreValidation.reason!,
                });
            }
        }

        this.sortFinalScores(validRedTeamScores);
        this.sortFinalScores(validBlueTeamScores);

        const redTotalScore: number = validRedTeamScores.reduce(
            (acc, value) => acc + value.grade,
            0
        );
        const blueTotalScore: number = validBlueTeamScores.reduce(
            (acc, value) => acc + value.grade,
            0
        );

        // TODO: this is wrong if the lower value is used (i.e. UR win condition)
        const diff: number = Math.abs(redTotalScore - blueTotalScore);
        const BCP47: string = LocaleHelper.convertToBCP47(language);

        embed
            .setColor(
                Precision.almostEqualsNumber(redTotalScore, blueTotalScore)
                    ? "Default"
                    : redTotalScore > blueTotalScore
                    ? 16711680
                    : 262399
            )
            .addFields({
                name: localization.getTranslation("redTeam"),
                value: `**${localization.getTranslation(
                    "totalScore"
                )}: ${redTotalScore.toLocaleString(BCP47)}**${
                    redTotalScore > blueTotalScore
                        ? ` (+${diff.toLocaleString(BCP47)})`
                        : ""
                }`,
            })
            .addFields(
                validRedTeamScores.map((v, i, a) =>
                    this.getScoreEmbedDescription(v, i + 1, language, a[i + 1])
                )
            )
            .addFields(
                invalidRedTeamScores.map((v, i) => {
                    const field = this.getScoreEmbedDescription(
                        v,
                        validRedTeamScores.length + i + 1,
                        language
                    );

                    field.value += ` - **${v.reason}**`;

                    return field;
                })
            )
            .addFields({
                name: "=================================",
                value: "=================================",
            })
            .addFields({
                name: localization.getTranslation("blueTeam"),
                value: `**${localization.getTranslation(
                    "totalScore"
                )}: ${blueTotalScore.toLocaleString(BCP47)}**${
                    blueTotalScore > redTotalScore
                        ? ` (+${diff.toLocaleString(BCP47)})`
                        : ""
                }`,
            })
            .addFields(
                validBlueTeamScores.map((v, i, a) =>
                    this.getScoreEmbedDescription(v, i + 1, language, a[i + 1])
                )
            )
            .addFields(
                invalidBlueTeamScores.map((v, i) => {
                    const field = this.getScoreEmbedDescription(
                        v,
                        validBlueTeamScores.length + i + 1,
                        language
                    );

                    field.value += ` - **${v.reason}**`;

                    return field;
                })
            )
            .addFields({
                name: "=================================",
                value: `**${
                    redTotalScore === blueTotalScore
                        ? localization.getTranslation("draw")
                        : StringHelper.formatString(
                              localization.getTranslation("won"),
                              localization.getTranslation(
                                  redTotalScore > blueTotalScore
                                      ? "redTeam"
                                      : "blueTeam"
                              )
                          )
                }**`,
            });

        return embed;
    }

    /**
     * Gets the grade of a score with respect to the room's win condition.
     *
     * @param score The score to grade.
     * @returns The score's grade.
     */
    private async getScoreGrade(score: MultiplayerScore): Promise<number> {
        switch (this.settings.winCondition) {
            case MultiplayerWinCondition.scoreV1: {
                const { mods } = this.convertModString(score.modstring);

                return this.applyCustomModMultiplier(score.score, mods);
            }
            case MultiplayerWinCondition.accuracy:
                return MathUtils.round(
                    new Accuracy({
                        n300: score.perfect,
                        n100: score.good,
                        n50: score.bad,
                        nmiss: score.miss,
                    }).value() * 100,
                    2
                );
            case MultiplayerWinCondition.maxCombo:
                return score.maxCombo;
            case MultiplayerWinCondition.scoreV2: {
                const beatmapInfo: MapInfo<true> =
                    (await BeatmapManager.getBeatmap(
                        this.settings.beatmap!.hash
                    ))!;

                this.currentBeatmapMaxScore ??=
                    beatmapInfo.beatmap.maxDroidScore(new MapStats());

                return this.applySpeedMulBonus(
                    ScoreHelper.calculateScoreV2(
                        this.removeSpeedMulBonus(score.score),
                        new Accuracy({
                            n300: score.perfect,
                            n100: score.good,
                            n50: score.bad,
                            nmiss: score.miss,
                        }).value(),
                        score.miss,
                        this.currentBeatmapMaxScore,
                        this.convertModString(score.modstring).mods,
                        this.settings.scorePortion
                    )
                );
            }
            case MultiplayerWinCondition.most300:
                return score.perfect;
            case MultiplayerWinCondition.least100:
                return score.good;
            case MultiplayerWinCondition.least50:
                return score.bad;
            case MultiplayerWinCondition.leastMisses:
                return score.miss;
            case MultiplayerWinCondition.leastUnstableRate:
                return MathUtils.round(score.unstableRate, 2);
            case MultiplayerWinCondition.mostDroidPp: {
                const { mods, forcedAR, speedMultiplier } =
                    this.convertModString(score.modstring);

                const sortedMod: string = StringHelper.sortAlphabet(
                    mods.reduce((a, m) => a + m.acronym, "")
                );

                const customStats: MapStats = new MapStats({
                    ar: forcedAR,
                    mods: mods,
                    speedMultiplier: speedMultiplier,
                    isForceAR: forcedAR !== undefined,
                });

                const beatmapInfo: MapInfo = (await BeatmapManager.getBeatmap(
                    this.settings.beatmap!.hash
                ))!;

                const starRating: DifficultyCalculationResult<DroidDifficultyCalculator> =
                    this.droidStarRatingCalculationCache[sortedMod] ??
                    (await new DroidBeatmapDifficultyHelper().calculateBeatmapDifficulty(
                        beatmapInfo,
                        new DifficultyCalculationParameters(customStats)
                    ))!;

                this.droidStarRatingCalculationCache[sortedMod] ??= starRating;

                const performance: PerformanceCalculationResult<
                    DroidDifficultyCalculator,
                    DroidPerformanceCalculator
                > =
                    (await new DroidBeatmapDifficultyHelper().calculateBeatmapPerformance(
                        starRating,
                        new PerformanceCalculationParameters(
                            new Accuracy({
                                n300: score.perfect,
                                n100: score.good,
                                n50: score.bad,
                                nmiss: score.miss,
                            }),
                            undefined,
                            score.maxCombo,
                            1
                        )
                    ))!;

                return MathUtils.round(performance.result.total, 2);
            }
            case MultiplayerWinCondition.mostPcPp: {
                const { mods, forcedAR, speedMultiplier } =
                    this.convertModString(score.modstring);

                const sortedMod: string = StringHelper.sortAlphabet(
                    mods.reduce((a, m) => a + m.acronym, "")
                );

                const customStats: MapStats = new MapStats({
                    ar: forcedAR,
                    mods: mods,
                    speedMultiplier: speedMultiplier,
                    isForceAR: forcedAR !== undefined,
                });

                const beatmapInfo: MapInfo = (await BeatmapManager.getBeatmap(
                    this.settings.beatmap!.hash
                ))!;

                const starRating: DifficultyCalculationResult<OsuDifficultyCalculator> =
                    this.pcStarRatingCalculationCache[sortedMod] ??
                    (await new OsuBeatmapDifficultyHelper().calculateBeatmapDifficulty(
                        beatmapInfo,
                        new DifficultyCalculationParameters(customStats)
                    ))!;

                this.pcStarRatingCalculationCache[sortedMod] ??= starRating;

                const performance: PerformanceCalculationResult<
                    OsuDifficultyCalculator,
                    OsuPerformanceCalculator
                > =
                    (await new OsuBeatmapDifficultyHelper().calculateBeatmapPerformance(
                        starRating,
                        new PerformanceCalculationParameters(
                            new Accuracy({
                                n300: score.perfect,
                                n100: score.good,
                                n50: score.bad,
                                nmiss: score.miss,
                            }),
                            undefined,
                            score.maxCombo,
                            1
                        )
                    ))!;

                return MathUtils.round(performance.result.total, 2);
            }
        }
    }

    /**
     * Validates a score.
     *
     * @param score The score to validate.
     * @param language The language to localize.
     */
    private verifyScore(
        score: MultiplayerScore,
        language: Language
    ): OperationResult {
        const localization: MultiplayerRoomLocalization =
            this.getLocalization(language);

        if (this.settings.beatmap!.hash !== score.hash) {
            return this.createOperationResult(
                false,
                localization.getTranslation("incorrectBeatmapPlayed")
            );
        }

        if (score.isSliderLock && !this.settings.allowSliderLock) {
            return this.createOperationResult(
                false,
                localization.getTranslation("sliderLockEnabled")
            );
        }

        if (score.useSliderAccuracy !== this.settings.useSliderAccuracy) {
            return this.createOperationResult(
                false,
                localization.getTranslation(
                    "useSliderAccuracySettingDoesntMatch"
                )
            );
        }

        const stats: MapStats = new MapStats({
            mods: ModUtil.pcStringToMods(this.settings.requiredMods),
            speedMultiplier: this.settings.speedMultiplier,
        }).calculate();

        const beatmapDuration: number =
            (this.settings.beatmap!.duration * 1000) / stats.speedMultiplier;

        const beatmapFinishTime: number =
            this.status.playingSince + beatmapDuration;

        const submissionTimeDifference: number =
            score.date +
            (score.skippedTime * 1000) / stats.speedMultiplier -
            beatmapFinishTime;

        const BCP47: string = LocaleHelper.convertToBCP47(language);

        // Give 30 seconds leniency for score submission.
        if (submissionTimeDifference > 30 * 1000) {
            return this.createOperationResult(
                false,
                StringHelper.formatString(
                    localization.getTranslation("submissionTooLate"),
                    MathUtils.round(
                        submissionTimeDifference / 1000 - 30,
                        1
                    ).toLocaleString(BCP47)
                )
            );
        }

        // Give 10 seconds constraint for early submission.
        if (submissionTimeDifference < -10 * 1000) {
            return this.createOperationResult(
                false,
                StringHelper.formatString(
                    localization.getTranslation("submissionTooEarly"),
                    MathUtils.round(
                        Math.abs(submissionTimeDifference / 1000 + 10),
                        1
                    ).toLocaleString(BCP47)
                )
            );
        }

        const {
            mods: usedMods,
            forcedAR,
            speedMultiplier,
        } = this.convertModString(score.modstring);

        const requiredMods: Mod[] = ModUtil.pcStringToMods(
            this.settings.requiredMods
        );
        const incorrectMods: Mod[] = [];

        // Consider required mods first, then we can check for invalid mods.
        for (const mod of usedMods) {
            if (requiredMods.length === 0) {
                break;
            }

            const index = requiredMods.findIndex(
                (m) => m.acronym === mod.acronym
            );

            if (index !== -1) {
                requiredMods.splice(index, 1);
            }
        }

        for (const mod of usedMods) {
            if (
                !this.settings.requiredMods.includes(mod.acronym) &&
                !this.settings.allowedMods.includes(mod.acronym)
            ) {
                incorrectMods.push(mod);
            }
        }

        if (requiredMods.length > 0 && incorrectMods.length === 0) {
            return this.createOperationResult(
                false,
                StringHelper.formatString(
                    localization.getTranslation("requiredModsMissing"),
                    requiredMods.reduce((a, m) => a + m.acronym, "")
                )
            );
        }

        if (incorrectMods.length > 0) {
            return this.createOperationResult(
                false,
                StringHelper.formatString(
                    localization.getTranslation("restrictedModsUsed"),
                    incorrectMods.reduce((a, m) => a + m.acronym, "")
                )
            );
        }

        if (speedMultiplier !== this.settings.speedMultiplier) {
            return this.createOperationResult(
                false,
                localization.getTranslation("incorrectSpeedMultiplier")
            );
        }

        if (forcedAR !== undefined) {
            if (!this.settings.forcedAR.allowed) {
                return this.createOperationResult(
                    false,
                    localization.getTranslation("forceARUsed")
                );
            }

            if (
                forcedAR < this.settings.forcedAR.minValue ||
                forcedAR > this.settings.forcedAR.maxValue
            ) {
                return this.createOperationResult(
                    false,
                    localization.getTranslation("forceAROutOfRange")
                );
            }
        }

        return this.createOperationResult(true);
    }

    /**
     * Gets the description of a score.
     *
     * @param score The score.
     * @param index The index of the score.
     * @param language The language to localize.
     * @param afterScore The score that comes after the passed score, if any.
     * @returns The score's description.
     */
    private getScoreEmbedDescription(
        score: MultiplayerScoreFinalResult,
        index: number,
        language: Language,
        afterScore?: MultiplayerScoreFinalResult
    ): APIEmbedField {
        const { mods, forcedAR, speedMultiplier } = this.convertModString(
            score.modstring
        );

        const BCP47: string = LocaleHelper.convertToBCP47(language);

        const customMods: string[] = [];

        if (speedMultiplier !== 1) {
            customMods.push(`${speedMultiplier.toLocaleString(BCP47)}x`);
        }

        if (forcedAR !== undefined) {
            customMods.push(`AR${forcedAR.toLocaleString(BCP47)}`);
        }

        let modstring: string = mods.map((v) => v.name).join(", ") || "NoMod";

        if (customMods.length > 0) {
            modstring += ` (${customMods.join(", ")})`;
        }

        const accuracy: number =
            new Accuracy({
                n300: score.perfect,
                n100: score.good,
                n50: score.bad,
                nmiss: score.miss,
            }).value() * 100 || 0;

        const diff: number = afterScore ? score.grade - afterScore.grade : 0;

        return {
            name: `**#${index} ${
                score.username
            } - ${modstring}: __${score.grade.toLocaleString(BCP47)}__**${
                afterScore
                    ? ` (${diff >= 0 ? `+` : ""}${diff.toLocaleString(BCP47)})`
                    : ""
            }`,
            value: `${score.score.toLocaleString(
                BCP47
            )} - ${BeatmapManager.getRankEmote(<ScoreRank>score.rank)} - ${
                score.maxCombo
            }x - ${accuracy.toFixed(2)}% - ${score.miss} ${
                Symbols.missIcon
            } - ${score.unstableRate.toFixed(2)} UR`,
        };
    }

    /**
     * Sorts final scores with respect to the win condition.
     *
     * @param scores The scores to sort.
     */
    private sortFinalScores(scores: MultiplayerScoreFinalResult[]): void {
        switch (this.settings.winCondition) {
            case MultiplayerWinCondition.scoreV1:
            case MultiplayerWinCondition.accuracy:
            case MultiplayerWinCondition.maxCombo:
            case MultiplayerWinCondition.scoreV2:
            case MultiplayerWinCondition.most300:
            case MultiplayerWinCondition.mostDroidPp:
            case MultiplayerWinCondition.mostPcPp:
                scores.sort((a, b) => b.grade - a.grade);
                break;
            default:
                scores.sort((a, b) => a.grade - b.grade);
        }
    }

    /**
     * Converts the mod string received from client.
     *
     * @param modstring The mod string.
     */
    private convertModString(modstring: string): {
        mods: (Mod & IModApplicableToDroid)[];
        speedMultiplier: number;
        forcedAR?: number;
    } {
        const mode = modstring.split("|");

        let speedMultiplier = 1;

        let forcedAR: number | undefined;

        let actualMods = "";

        for (let i = 0; i < mode.length; ++i) {
            if (!mode[i]) {
                continue;
            }

            if (mode[i].startsWith("AR")) {
                forcedAR = parseFloat(mode[i].replace("AR", ""));
            } else if (mode[i].startsWith("x")) {
                speedMultiplier = parseFloat(mode[i].replace("x", ""));
            } else {
                actualMods += mode[i];
            }
        }

        return {
            mods: ModUtil.droidStringToMods(actualMods),
            speedMultiplier: speedMultiplier,
            forcedAR: forcedAR,
        };
    }

    /**
     * Gets the initial embed for a multiplayer room result embed.
     *
     * @param language The language to localize.
     */
    private async getInitialResultEmbed(
        language: Language
    ): Promise<EmbedBuilder> {
        const localization: MultiplayerRoomLocalization =
            this.getLocalization(language);

        const embed: EmbedBuilder = EmbedCreator.createNormalEmbed({
            color: "Fuchsia",
        });

        const beatmapInfo: MapInfo = (await BeatmapManager.getBeatmap(
            this.settings.beatmap!.hash
        ))!;

        const customModMultipliersDescription: string[] = [];

        const BCP47: string = LocaleHelper.convertToBCP47(language);

        for (const mod in this.settings.modMultipliers) {
            customModMultipliersDescription.push(
                `${mod} (${this.settings.modMultipliers[mod].toLocaleString(
                    BCP47
                )}x)`
            );
        }

        embed
            .setAuthor({
                name: this.settings.roomName,
            })
            .setTitle(beatmapInfo.fullTitle)
            .setThumbnail(
                `https://b.ppy.sh/thumb/${beatmapInfo.beatmapsetID}l.jpg`
            )
            .setURL(`https://osu.ppy.sh/b/${beatmapInfo.beatmapID}`)
            .setDescription(
                `**${localization.getTranslation(
                    "teamMode"
                )}**: ${this.teamModeToString(language)}\n` +
                    `**${localization.getTranslation(
                        "winCondition"
                    )}**: ${this.winConditionToString(language)}\n` +
                    `**${localization.getTranslation(
                        "customModMultipliers"
                    )}**: ${this.getCustomModMultipliersDescription(language)}`
            );

        return embed;
    }

    /**
     * Gets the description of custom mod multipliers.
     *
     * @param language The language to localize.
     */
    private getCustomModMultipliersDescription(language: Language): string {
        const customModMultipliersDescription: string[] = [];

        const BCP47: string = LocaleHelper.convertToBCP47(language);

        for (const mod in this.settings.modMultipliers) {
            customModMultipliersDescription.push(
                `${mod} (${this.settings.modMultipliers[mod].toLocaleString(
                    BCP47
                )}x)`
            );
        }

        return (
            customModMultipliersDescription.join(", ") ||
            this.getLocalization(language).getTranslation("none")
        );
    }

    /**
     * Gets the localization of this database utility.
     *
     * @param language The language to localize.
     */
    private getLocalization(language: Language): MultiplayerRoomLocalization {
        return new MultiplayerRoomLocalization(language);
    }
}
