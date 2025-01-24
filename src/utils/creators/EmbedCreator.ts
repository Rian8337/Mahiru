import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ColorResolvable,
    EmbedBuilder,
    Guild,
    GuildEmoji,
    GuildMember,
    BaseMessageOptions,
    RepliableInteraction,
    bold,
    userMention,
    underscore,
    channelMention,
    hyperlink,
} from "discord.js";
import { Config } from "@core/Config";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { Symbols } from "@enums/utils/Symbols";
import { Challenge } from "@database/utils/aliceDb/Challenge";
import { ArrayHelper } from "@utils/helpers/ArrayHelper";
import { StringHelper } from "@utils/helpers/StringHelper";
import { ClanAuction } from "@database/utils/aliceDb/ClanAuction";
import { TournamentMatch } from "@database/utils/elainaDb/TournamentMatch";
import { DifficultyCalculationParameters } from "@utils/pp/DifficultyCalculationParameters";
import { PerformanceCalculationParameters } from "@utils/pp/PerformanceCalculationParameters";
import { MapShare } from "@database/utils/aliceDb/MapShare";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { MusicQueue } from "@utils/music/MusicQueue";
import { BeatmapDifficultyHelper } from "@utils/helpers/BeatmapDifficultyHelper";
import {
    MapInfo,
    Accuracy,
    Precision,
    Slider,
    SliderTick,
    SliderTail,
    ModUtil,
    Modes,
} from "@rian8337/osu-base";
import {
    CacheableDifficultyAttributes,
    DroidDifficultyAttributes,
    OsuDifficultyAttributes,
} from "@rian8337/osu-difficulty-calculator";
import {
    DroidDifficultyAttributes as RebalanceDroidDifficultyAttributes,
    OsuDifficultyAttributes as RebalanceOsuDifficultyAttributes,
} from "@rian8337/osu-rebalance-difficulty-calculator";
import {
    HitResult,
    HitErrorInformation,
} from "@rian8337/osu-droid-replay-analyzer";
import { Player, Score } from "@rian8337/osu-droid-utilities";
import { Language } from "@localization/base/Language";
import {
    EmbedCreatorLocalization,
    EmbedCreatorStrings,
} from "@localization/utils/creators/EmbedCreator/EmbedCreatorLocalization";
import { Warning } from "@database/utils/aliceDb/Warning";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { ReplayHelper } from "@utils/helpers/ReplayHelper";
import { DroidPerformanceAttributes } from "@structures/difficultyattributes/DroidPerformanceAttributes";
import { OsuPerformanceAttributes } from "@structures/difficultyattributes/OsuPerformanceAttributes";
import { CompleteCalculationAttributes } from "@structures/difficultyattributes/CompleteCalculationAttributes";
import { PPProcessorRESTManager } from "@utils/managers/PPProcessorRESTManager";
import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { RecentPlay } from "@database/utils/aliceDb/RecentPlay";
import { NormalEmbedOptions } from "@structures/utils/NormalEmbedOptions";
import { OfficialDatabaseScore } from "@database/official/schema/OfficialDatabaseScore";
import { DroidHelper } from "@utils/helpers/DroidHelper";
import { OfficialDatabaseUser } from "@database/official/schema/OfficialDatabaseUser";
import { ProfileManager } from "@utils/managers/ProfileManager";

/**
 * Utility to create message embeds.
 */
export abstract class EmbedCreator {
    private static readonly botSign = "Mahiru Shiina";

    /**
     * Creates a normal embed.
     *
     * @param embedOptions Options to override default message embed behavior.
     */
    static createNormalEmbed(
        embedOptions?: Partial<NormalEmbedOptions>,
    ): EmbedBuilder {
        const iconURL = ArrayHelper.getRandomArrayElement(Config.avatarList);

        const embed = new EmbedBuilder().setFooter({
            text: this.botSign,
            iconURL: iconURL,
        });

        if (embedOptions?.author) {
            embed.setAuthor({
                name: embedOptions.author.tag,
                iconURL: embedOptions.author.avatarURL()!,
            });
        }

        if (embedOptions?.color) {
            embed.setColor(embedOptions.color);
        }

        if (embedOptions?.footerText) {
            embed.setFooter({
                text: `${embedOptions.footerText} | ${this.botSign}`,
                iconURL: iconURL,
            });
        }

        if (embedOptions?.timestamp) {
            embed.setTimestamp(new Date());
        }

        return embed;
    }

    /**
     * Creates a beatmap embed.
     *
     * @param beatmapInfo The beatmap to create the beatmap embed from.
     * @param calculationParams The calculation parameters to be applied towards beatmap statistics.
     * @param language The locale of the user who attempted to create the beatmap embed. Defaults to English.
     */
    static createBeatmapEmbed(
        beatmapInfo: MapInfo,
        calculationParams?: DifficultyCalculationParameters,
        language: Language = "en",
    ): BaseMessageOptions {
        const localization = new EmbedCreatorLocalization(language);

        const embed = this.createNormalEmbed({
            color: <ColorResolvable>(
                BeatmapManager.getBeatmapDifficultyColor(
                    parseFloat((beatmapInfo.totalDifficulty ?? 0).toFixed(2)),
                )
            ),
        });

        const totalDifficulty = beatmapInfo.totalDifficulty ?? 0;
        const mods = calculationParams?.toDifficultyCalculationOptions().mods;

        embed
            .setAuthor({
                name: localization.getTranslation("beatmapInfo"),
                iconURL: `attachment://osu-${totalDifficulty.toFixed(2)}.png`,
            })
            .setTitle(
                BeatmapManager.showStatistics(
                    beatmapInfo,
                    0,
                    mods,
                    calculationParams?.customSpeedMultiplier,
                ),
            )
            .setDescription(
                BeatmapManager.showStatistics(
                    beatmapInfo,
                    1,
                    mods,
                    calculationParams?.customSpeedMultiplier,
                ) +
                    "\n" +
                    BeatmapManager.showStatistics(
                        beatmapInfo,
                        2,
                        mods,
                        calculationParams?.customSpeedMultiplier,
                    ),
            )
            .setURL(beatmapInfo.beatmapLink)
            .addFields(
                {
                    name: bold(
                        localization.getTranslation("beatmapDroidStatistics"),
                    ),
                    value: BeatmapManager.showStatistics(
                        beatmapInfo,
                        3,
                        mods,
                        calculationParams?.customSpeedMultiplier,
                    ),
                },
                {
                    name: bold(
                        localization.getTranslation("beatmapOsuStatistics"),
                    ),
                    value: BeatmapManager.showStatistics(
                        beatmapInfo,
                        4,
                        mods,
                        calculationParams?.customSpeedMultiplier,
                    ),
                },
                {
                    name: bold(
                        localization.getTranslation("beatmapGeneralStatistics"),
                    ),
                    value: BeatmapManager.showStatistics(
                        beatmapInfo,
                        5,
                        mods,
                        calculationParams?.customSpeedMultiplier,
                    ),
                },
                {
                    name: BeatmapManager.showStatistics(
                        beatmapInfo,
                        6,
                        mods,
                        calculationParams?.customSpeedMultiplier,
                    ),
                    value: BeatmapManager.showStatistics(
                        beatmapInfo,
                        7,
                        mods,
                        calculationParams?.customSpeedMultiplier,
                    ),
                },
                {
                    name: localization.getTranslation("starRating"),
                    value: `${Symbols.star.repeat(
                        Math.floor(totalDifficulty),
                    )} ${bold(
                        `${totalDifficulty.toFixed(
                            2,
                        )} ${localization.getTranslation("pcStars")}`,
                    )}`,
                },
            );

        return {
            embeds: [embed],
            files: [
                BeatmapManager.getBeatmapDifficultyIconAttachment(
                    parseFloat(totalDifficulty.toFixed(2)),
                ),
            ],
        };
    }

    /**
     * Creates an embed for displaying a player's top plays.
     *
     * @param interaction The interaction that triggered the embed creation.
     * @param player The player to create the embed for.
     * @param topScores The top scores of the player.
     * @param ppRank The rank of the player in the DPP leaderboard.
     * @param language The locale of the user who attempted to create the embed. Defaults to English.
     * @returns The embed.
     */
    static async createPPListEmbed(
        interaction: RepliableInteraction,
        player: Pick<OfficialDatabaseUser, "id" | "username" | "pp"> | Player,
        ppRank?: number | null,
        language: Language = "en",
    ): Promise<EmbedBuilder> {
        const localization = new EmbedCreatorLocalization(language);

        const embed = this.createNormalEmbed({
            author: interaction.user,
            color: (<GuildMember | null>interaction.member)?.displayColor,
        });

        ppRank ??= await DroidHelper.getPlayerPPRank(player.id);

        embed.setDescription(
            `${bold(
                `${StringHelper.formatString(
                    localization.getTranslation("ppProfileTitle"),
                    hyperlink(
                        player.username,
                        ProfileManager.getProfileLink(player.id),
                    ),
                )}`,
            )}\n` +
                `${localization.getTranslation("totalPP")}: ${bold(
                    `${player.pp.toFixed(2)} pp (${typeof ppRank === "number" ? `#${ppRank.toLocaleString(LocaleHelper.convertToBCP47(language))}` : "Unknown"})`,
                )}\n` +
                `${localization.getTranslation(
                    "recommendedStarRating",
                )}: ${bold(
                    `${(Math.pow(player.pp, 0.4) * 0.225).toFixed(2)}${
                        Symbols.star
                    }`,
                )}`,
        );

        return embed;
    }

    /**
     * Creates an embed for input detector.
     *
     * @param interaction The interaction that triggered the input detector.
     * @param title The title of the embed.
     * @param description The description of the embed.
     * @returns The embed.
     */
    static createInputEmbed(
        interaction: RepliableInteraction,
        title: string,
        description: string,
        language: Language = "en",
    ): EmbedBuilder {
        const embed = this.createNormalEmbed({
            author: interaction.user,
            color: (<GuildMember | null>interaction.member)?.displayColor,
            footerText:
                this.getLocalization(language).getTranslation("exitMenu"),
        });

        embed.setTitle(title).setDescription(description);

        return embed;
    }

    /**
     * Creates an embed with beatmap calculation result.
     *
     * @param beatmap The beatmap being calculated.
     * @param calculationParams The parameters of the calculation. If `PerformanceCalculationParameters` is specified and `droidPerfCalcResult` and `osuPerfCalcResult` are specified, the beatmap's performance values will be shown.
     * @param droidDiffAttribs The osu!droid difficulty attributes.
     * @param osuDiffAttribs The osu!standard difficulty attributes.
     * @param droidPerfAttribs The osu!droid performance attributes.
     * @param osuPerfAttribs The osu!standard performance attributes.
     * @param language The locale of the user who attempted to create the embed. Defaults to English.
     * @param strainChart The strain chart of the beatmap, if any.
     * @returns The message options that contains the embed.
     */
    static createCalculationEmbed(
        beatmap: MapInfo,
        calculationParams: DifficultyCalculationParameters,
        droidDiffAttribs: CacheableDifficultyAttributes<
            DroidDifficultyAttributes | RebalanceDroidDifficultyAttributes
        >,
        osuDiffAttribs: CacheableDifficultyAttributes<
            OsuDifficultyAttributes | RebalanceOsuDifficultyAttributes
        >,
        droidPerfAttribs?: DroidPerformanceAttributes,
        osuPerfAttribs?: OsuPerformanceAttributes,
        language: Language = "en",
        strainChart?: Buffer,
    ): BaseMessageOptions {
        const localization = this.getLocalization(language);

        const embedOptions = this.createBeatmapEmbed(
            beatmap,
            calculationParams,
            language,
        );

        const embed = EmbedBuilder.from(embedOptions.embeds![0]);
        const files = embedOptions.files?.slice() ?? [];

        if (
            calculationParams instanceof PerformanceCalculationParameters &&
            droidPerfAttribs &&
            osuPerfAttribs
        ) {
            const combo = calculationParams.combo ?? droidDiffAttribs.maxCombo;
            // Recompute accuracy to consider amount of objects.
            calculationParams.accuracy = new Accuracy({
                ...calculationParams.accuracy,
                nobjects: beatmap.objects,
            });
            const { accuracy, customSpeedMultiplier } = calculationParams;

            // Use mods from `DifficultyCalculationOptions` to have forced difficulty statistics converted.
            const mods =
                calculationParams.toDifficultyCalculationOptions().mods ??
                calculationParams.mods;

            embed
                .setColor(
                    <ColorResolvable>(
                        BeatmapManager.getBeatmapDifficultyColor(
                            osuDiffAttribs.starRating,
                        )
                    ),
                )
                .spliceFields(embed.data.fields!.length - 2, 2)
                .addFields(
                    {
                        name: BeatmapManager.showStatistics(
                            beatmap,
                            6,
                            mods,
                            customSpeedMultiplier,
                        ),
                        value: `${BeatmapManager.showStatistics(
                            beatmap,
                            7,
                            mods,
                            customSpeedMultiplier,
                        )}\n${bold(
                            `${localization.getTranslation("result")}`,
                        )}: ${combo}/${droidDiffAttribs.maxCombo}x | ${(
                            accuracy.value() * 100
                        ).toFixed(2)}% | [${accuracy.n300}/${accuracy.n100}/${
                            accuracy.n50
                        }/${accuracy.nmiss}]`,
                    },
                    {
                        name: `${bold(
                            localization.getTranslation("droidPP"),
                        )}: ${underscore(
                            `${droidPerfAttribs.total.toFixed(2)} pp`,
                        )} - ${droidDiffAttribs.starRating.toFixed(2)}${
                            Symbols.star
                        }`,
                        value: `${bold(
                            localization.getTranslation("pcPP"),
                        )}: ${osuPerfAttribs.total.toFixed(2)} pp - ${osuDiffAttribs.starRating.toFixed(2)}${
                            Symbols.star
                        }`,
                    },
                );
        } else {
            embed
                .setColor(
                    <ColorResolvable>(
                        BeatmapManager.getBeatmapDifficultyColor(
                            osuDiffAttribs.starRating,
                        )
                    ),
                )
                .spliceFields(embed.data.fields!.length - 1, 1)
                .addFields({
                    name: bold(localization.getTranslation("starRating")),
                    value:
                        `${Symbols.star.repeat(
                            Math.min(
                                10,
                                Math.floor(droidDiffAttribs.starRating),
                            ),
                        )} ${droidDiffAttribs.starRating.toFixed(
                            2,
                        )} ${localization.getTranslation("droidStars")}\n` +
                        `${Symbols.star.repeat(
                            Math.min(10, Math.floor(osuDiffAttribs.starRating)),
                        )} ${osuDiffAttribs.starRating.toFixed(
                            2,
                        )} ${localization.getTranslation("pcStars")}`,
                });
        }

        if (
            beatmap.totalDifficulty !== null &&
            !Precision.almostEqualsNumber(
                osuDiffAttribs.starRating,
                beatmap.totalDifficulty,
            )
        ) {
            // Recreate difficulty icon if difficulty is different.
            files.length = 0;

            files.push(
                BeatmapManager.getBeatmapDifficultyIconAttachment(
                    osuDiffAttribs.starRating,
                ),
            );

            embed.setAuthor({
                name: localization.getTranslation("beatmapInfo"),
                iconURL: `attachment://osu-${osuDiffAttribs.starRating.toFixed(
                    2,
                )}.png`,
            });
        }

        if (strainChart) {
            embed.setImage("attachment://strain-chart.png");

            files.push({
                name: "strain-chart.png",
                attachment: strainChart,
            });
        }

        return {
            embeds: [embed],
            files: files,
        };
    }

    /**
     * Creates a recent play embed.
     *
     * @param score The score to create recent play from.
     * @param embedColor The color of the embed.
     * @param droidAttribs The osu!droid complete attributes of the score. If unspecified, the score will be computed on fly.
     * @param osuAttribs The osu!standard complete attributes of the score. If unspecified, the score will be computed on fly.
     * @param language The locale of the user who requested the recent play embed. Defaults to English.
     * @returns The embed.
     */
    static async createRecentPlayEmbed(
        score:
            | Pick<
                  OfficialDatabaseScore,
                  | "id"
                  | "uid"
                  | "hash"
                  | "score"
                  | "combo"
                  | "mark"
                  | "mode"
                  | "date"
                  | "filename"
                  | "hash"
                  | "perfect"
                  | "good"
                  | "bad"
                  | "miss"
              >
            | Score
            | RecentPlay,
        embedColor?: ColorResolvable,
        droidAttribs?: CompleteCalculationAttributes<
            DroidDifficultyAttributes,
            DroidPerformanceAttributes
        > | null,
        osuAttribs?: CompleteCalculationAttributes<
            OsuDifficultyAttributes,
            OsuPerformanceAttributes
        > | null,
        language: Language = "en",
    ): Promise<EmbedBuilder> {
        const localization = this.getLocalization(language);
        const BCP47 = LocaleHelper.convertToBCP47(language);
        const arrow = Symbols.rightArrowSmall;

        const embed = this.createNormalEmbed({
            color: embedColor,
            footerText: StringHelper.formatString(
                localization.getTranslation("dateAchieved"),
                DateTimeFormatHelper.dateToLocaleString(score.date, language),
            ),
        });

        const modString =
            score instanceof Score || score instanceof RecentPlay
                ? score.completeModString
                : DroidHelper.getCompleteModString(score.mode);

        const avatarURL = DroidHelper.getAvatarURL(score.uid);

        embed.setAuthor({
            name: `${score instanceof Score || score instanceof RecentPlay ? score.title : DroidHelper.cleanupFilename(score.filename)} ${modString}`,
            iconURL: avatarURL,
        });

        if (droidAttribs === undefined && osuAttribs !== null) {
            droidAttribs =
                score instanceof RecentPlay
                    ? score.droidAttribs
                    : (
                          await PPProcessorRESTManager.getOnlineScoreAttributes(
                              score.uid,
                              score.hash,
                              Modes.droid,
                              PPCalculationMethod.live,
                          )
                      )?.attributes;
        }

        if (osuAttribs === undefined && droidAttribs !== null) {
            osuAttribs =
                score instanceof RecentPlay
                    ? score.osuAttribs
                    : (
                          await PPProcessorRESTManager.getOnlineScoreAttributes(
                              score.uid,
                              score.hash,
                              Modes.osu,
                              PPCalculationMethod.live,
                          )
                      )?.attributes;
        }

        let beatmapInformation = `${arrow} ${BeatmapManager.getRankEmote(
            score instanceof Score || score instanceof RecentPlay
                ? score.rank
                : score.mark,
        )} ${arrow} `;

        const accuracy =
            score instanceof Score || score instanceof RecentPlay
                ? score.accuracy
                : new Accuracy({
                      n300: score.perfect,
                      n100: score.good,
                      n50: score.bad,
                      nmiss: score.miss,
                  });

        if (!droidAttribs || !osuAttribs) {
            beatmapInformation +=
                `${(accuracy.value() * 100).toFixed(2)}%\n` +
                `${arrow} ${score.score.toLocaleString(BCP47)} ${arrow} ${
                    score.combo
                }x ${arrow} [${accuracy.n300}/${accuracy.n100}/${
                    accuracy.n50
                }/${accuracy.nmiss}]`;

            embed.setDescription(beatmapInformation);
            return embed;
        }

        const beatmap: MapInfo = (await BeatmapManager.getBeatmap(score.hash, {
            checkFile: false,
        }))!;

        embed
            .setAuthor({
                name: `${beatmap.fullTitle} ${modString} [${droidAttribs.difficulty.starRating.toFixed(2)}${
                    Symbols.star
                } | ${osuAttribs.difficulty.starRating.toFixed(2)}${
                    Symbols.star
                }]`,
                iconURL: avatarURL,
                url: beatmap.beatmapLink,
            })
            .setThumbnail(
                `https://b.ppy.sh/thumb/${beatmap.beatmapSetId}l.jpg`,
            );

        beatmapInformation += `${bold(
            `${droidAttribs.performance.total.toFixed(2)}DPP`,
        )} | ${bold(`${osuAttribs.performance.total.toFixed(2)}PP`)} `;

        // Some beatmaps return `null` max combo from osu! API, i.e. /b/1462961.
        const { maxCombo } = droidAttribs.difficulty;

        if (accuracy.nmiss > 0 || score.combo < maxCombo) {
            const calcParams =
                BeatmapDifficultyHelper.getCalculationParamsFromScore(score);

            calcParams.combo = maxCombo;
            calcParams.accuracy = new Accuracy({
                n300: accuracy.n300 + accuracy.nmiss,
                n100: accuracy.n100,
                n50: accuracy.n50,
                nmiss: 0,
            });

            const droidFcAttribs =
                await PPProcessorRESTManager.getPerformanceAttributes(
                    score.hash,
                    Modes.droid,
                    PPCalculationMethod.live,
                    calcParams,
                );

            const osuFcAttribs =
                await PPProcessorRESTManager.getPerformanceAttributes(
                    score.hash,
                    Modes.osu,
                    PPCalculationMethod.live,
                    calcParams,
                );

            if (droidFcAttribs && osuFcAttribs) {
                beatmapInformation += `(${droidFcAttribs.attributes.performance.total.toFixed(
                    2,
                )}DPP, ${osuFcAttribs.attributes.performance.total.toFixed(
                    2,
                )}PP ${StringHelper.formatString(
                    localization.getTranslation("forFC"),
                    (calcParams.accuracy.value() * 100).toFixed(2) + "%",
                )}) `;
            }
        }

        beatmapInformation +=
            `${arrow} ${(accuracy.value() * 100).toFixed(2)}%\n` +
            `${arrow} ${score.score.toLocaleString(BCP47)} ${arrow} ${
                score.combo
            }x/${maxCombo}x ${arrow} [${accuracy.n300}/${
                accuracy.n100
            }/${accuracy.n50}/${accuracy.nmiss}]`;
        let hitError: HitErrorInformation | null | undefined;

        if (score instanceof RecentPlay) {
            hitError = score.hitError;

            if (score.sliderTickInformation || score.sliderEndInformation) {
                beatmapInformation += `\n`;

                if (score.sliderTickInformation) {
                    beatmapInformation += ` ${arrow} ${
                        score.sliderTickInformation.obtained
                    }/${
                        score.sliderTickInformation.total
                    } ${localization.getTranslation("sliderTicks")}`;
                }

                if (score.sliderEndInformation) {
                    beatmapInformation += ` ${arrow} ${
                        score.sliderEndInformation.obtained
                    }/${
                        score.sliderEndInformation.total
                    } ${localization.getTranslation("sliderEnds")}`;
                }
            }
        } else {
            const replay = await ReplayHelper.analyzeReplay(score);
            const { data } = replay;

            await BeatmapManager.downloadBeatmap(beatmap);

            if (data && beatmap.hasDownloadedBeatmap()) {
                replay.beatmap ??= beatmap.beatmap!;

                // Get amount of slider ticks and ends hit
                let collectedSliderTicks = 0;
                let collectedSliderEnds = 0;

                for (let i = 0; i < data.hitObjectData.length; ++i) {
                    // Using droid star rating as legacy slider tail doesn't exist.
                    const object = beatmap.beatmap!.hitObjects.objects[i];
                    const objectData = data.hitObjectData[i];

                    if (
                        objectData.result === HitResult.miss ||
                        !(object instanceof Slider)
                    ) {
                        continue;
                    }

                    // Exclude the head circle.
                    for (let j = 1; j < object.nestedHitObjects.length; ++j) {
                        const nested = object.nestedHitObjects[j];

                        if (!objectData.tickset[j - 1]) {
                            continue;
                        }

                        if (nested instanceof SliderTick) {
                            ++collectedSliderTicks;
                        } else if (nested instanceof SliderTail) {
                            ++collectedSliderEnds;
                        }
                    }
                }

                beatmapInformation += `\n${arrow} ${collectedSliderTicks}/${
                    beatmap.beatmap!.hitObjects.sliderTicks
                } ${localization.getTranslation(
                    "sliderTicks",
                )} ${arrow} ${collectedSliderEnds}/${
                    beatmap.beatmap!.hitObjects.sliderEnds
                } ${localization.getTranslation("sliderEnds")}`;

                // Get hit error average and UR
                hitError = replay.calculateHitError()!;
            }
        }

        if (hitError) {
            beatmapInformation += `\n${arrow} ${hitError.negativeAvg.toFixed(
                2,
            )}ms - ${hitError.positiveAvg.toFixed(
                2,
            )}ms ${localization.getTranslation(
                "hitErrorAvg",
            )} ${arrow} ${hitError.unstableRate.toFixed(2)} UR`;
        }

        const {
            tapPenalty,
            aimSliderCheesePenalty,
            flashlightSliderCheesePenalty,
            visualSliderCheesePenalty,
        } = droidAttribs.performance;

        const isThreeFinger = tapPenalty !== 1;
        const isSliderCheese = [
            aimSliderCheesePenalty,
            flashlightSliderCheesePenalty,
            visualSliderCheesePenalty,
        ].some((v) => v !== 1);

        if (isThreeFinger || isSliderCheese) {
            const str: string[] = [];

            if (isThreeFinger) {
                str.push(localization.getTranslation("threeFinger"));
            }
            if (isSliderCheese) {
                str.push(localization.getTranslation("sliderCheese"));
            }

            beatmapInformation += `\n${arrow} ${localization.getTranslation(
                "penalties",
            )}: ${str.join(", ")}`;
        }

        embed.setDescription(beatmapInformation);

        return embed;
    }

    /**
     * Creates a challenge embed.
     *
     * @param challenge The challenge to create the challenge embed for.
     * @param language The locale to create the embed for. Defaults to English.
     * @param graphColor The color of the strain graph in the embed.
     * @returns The options for the embed.
     */
    static async createChallengeEmbed(
        challenge: Challenge,
        graphColor?: string,
        language: Language = "en",
    ): Promise<BaseMessageOptions | null> {
        const localization = this.getLocalization(language);

        const beatmapInfo: MapInfo | null = await BeatmapManager.getBeatmap(
            challenge.beatmapid,
            { checkFile: false },
        );

        if (!beatmapInfo) {
            return null;
        }

        const calcParams = new DifficultyCalculationParameters({
            mods: ModUtil.pcStringToMods(challenge.constrain),
        });

        const droidDiffAttribs =
            await PPProcessorRESTManager.getDifficultyAttributes(
                challenge.beatmapid,
                Modes.droid,
                PPCalculationMethod.live,
                calcParams,
            );

        if (!droidDiffAttribs) {
            return null;
        }

        const osuDiffAttribs =
            await PPProcessorRESTManager.getDifficultyAttributes(
                challenge.beatmapid,
                Modes.osu,
                PPCalculationMethod.live,
                calcParams,
            );

        if (!osuDiffAttribs) {
            return null;
        }

        const embedOptions = this.createCalculationEmbed(
            beatmapInfo,
            calcParams,
            droidDiffAttribs.attributes,
            osuDiffAttribs.attributes,
            undefined,
            undefined,
            language,
        );

        const embed = EmbedBuilder.from(embedOptions.embeds![0]);

        embed
            .spliceFields(embed.data.fields!.length - 2, 2)
            .setFooter({
                text:
                    embed.data.footer!.text! +
                    ` | ${localization.getTranslation("challengeId")}: ${
                        challenge.challengeid
                    } | ${localization.getTranslation(
                        "timeLeft",
                    )}: ${DateTimeFormatHelper.secondsToDHMS(
                        Math.max(
                            0,
                            DateTimeFormatHelper.getTimeDifference(
                                challenge.timelimit * 1000,
                            ) / 1000,
                        ),
                    )}`,
                iconURL: embed.data.footer!.icon_url,
            })
            .setAuthor({
                name: localization.getTranslation(
                    challenge.type === "weekly"
                        ? "weeklyChallengeTitle"
                        : "dailyChallengeTitle",
                ),
                iconURL: `attachment://osu-${osuDiffAttribs.attributes.starRating.toFixed(
                    2,
                )}.png`,
            })
            .setDescription(
                StringHelper.formatString(
                    localization.getTranslation("featuredPerson"),
                    userMention(challenge.featured),
                ),
            )
            .addFields({
                name:
                    `${bold(localization.getTranslation("starRating"))}\n` +
                    `${Symbols.star.repeat(
                        Math.min(
                            10,
                            Math.floor(droidDiffAttribs.attributes.starRating),
                        ),
                    )} ${droidDiffAttribs.attributes.starRating.toFixed(
                        2,
                    )} ${localization.getTranslation("droidStars")}\n` +
                    `${Symbols.star.repeat(
                        Math.min(
                            10,
                            Math.floor(osuDiffAttribs.attributes.starRating),
                        ),
                    )} ${osuDiffAttribs.attributes.starRating.toFixed(
                        2,
                    )} ${localization.getTranslation("pcStars")}`,
                value:
                    `${bold(localization.getTranslation("points"))}: ${
                        challenge.points
                    } ${localization.getTranslation("points")}\n` +
                    `${bold(
                        localization.getTranslation("passCondition"),
                    )}: ${challenge.getPassInformation()}\n` +
                    `${bold(localization.getTranslation("constrain"))}: ${
                        challenge.constrain
                            ? StringHelper.formatString(
                                  localization.getTranslation("modOnly"),
                                  challenge.constrain.toUpperCase(),
                              )
                            : localization.getTranslation("rankableMods")
                    }\n\n` +
                    localization.getTranslation("challengeBonuses"),
            });

        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setURL(challenge.link[0])
                .setEmoji(Symbols.inboxTray)
                .setStyle(ButtonStyle.Link)
                .setLabel("Download"),
        );

        if (challenge.link[1]) {
            actionRow.addComponents(
                new ButtonBuilder()
                    .setURL(challenge.link[1])
                    .setEmoji(Symbols.inboxTray)
                    .setStyle(ButtonStyle.Link)
                    .setLabel("Download (alternative)"),
            );
        }

        return {
            embeds: [embed],
            components: [actionRow],
        };
    }

    /**
     * Creates a clan auction embed.
     *
     * @param auction The auction to create the embed for.
     * @param coinEmoji Mahiru coin emoji.
     * @param language The locale of the user who attempted to create the embed. Defaults to English.
     * @returns The embed.
     */
    static createClanAuctionEmbed(
        auction: ClanAuction,
        coinEmoji: GuildEmoji,
        language: Language = "en",
    ): EmbedBuilder {
        const localization = this.getLocalization(language);

        const embed = this.createNormalEmbed({
            color: "#cb9000",
        });

        const BCP47 = LocaleHelper.convertToBCP47(language);

        embed
            .setTitle(localization.getTranslation("auctionInfo"))
            .setDescription(
                `${bold(localization.getTranslation("auctionName"))}: ${
                    auction.name
                }\n` +
                    `${bold(
                        localization.getTranslation("auctionAuctioneer"),
                    )}: ${auction.auctioneer}\n` +
                    `${bold(
                        localization.getTranslation("creationDate"),
                    )}: ${DateTimeFormatHelper.dateToLocaleString(
                        new Date(auction.creationdate * 1000),
                        language,
                    )}\n` +
                    `${bold(
                        localization.getTranslation("auctionMinimumBid"),
                    )}: ${coinEmoji}${auction.min_price} Mahiru coins`,
            )
            .addFields(
                {
                    name: localization.getTranslation("auctionItemInfo"),
                    value:
                        `${bold(
                            localization.getTranslation("auctionPowerup"),
                        )}: ${StringHelper.capitalizeString(
                            auction.powerup,
                        )}\n` +
                        `${bold(
                            localization.getTranslation("auctionItemAmount"),
                        )}: ${auction.amount.toLocaleString(BCP47)}`,
                },
                {
                    name: localization.getTranslation("auctionBidInfo"),
                    value:
                        `${bold(
                            localization.getTranslation("auctionBidders"),
                        )}: ${auction.bids.size.toLocaleString(BCP47)}\n` +
                        `${bold(
                            localization.getTranslation("auctionTopBidders"),
                        )}:\n` +
                        auction.bids
                            .first(5)
                            .map(
                                (v, i) =>
                                    `#${i + 1}: ${v.clan} - ${coinEmoji}\`${
                                        v.amount
                                    }\` Mahiru coins`,
                            ),
                },
            );

        return embed;
    }

    /**
     * Creates an embed for report broadcast in a guild.
     *
     * @param guild The guild.
     * @param language The locale of the guild. Defaults to English.
     * @returns The embed.
     */
    static createReportBroadcastEmbed(
        guild: Guild,
        language: Language = "en",
    ): EmbedBuilder {
        const localization = this.getLocalization(language);

        const embed = this.createNormalEmbed({
            color: "#b566ff",
        });

        embed
            .setAuthor({
                name: localization.getTranslation("reportBroadcast"),
                iconURL: guild.iconURL()!,
            })
            .setDescription(
                `${localization.getTranslation(
                    "reportBroadcast1",
                )}\n\n${localization.getTranslation("reportBroadcast2")}`,
            );

        return embed;
    }

    /**
     * Creates an embed summarizing a tournament match.
     *
     * @param match The match.
     * @returns The embed.
     */
    static createMatchSummaryEmbed(match: TournamentMatch): EmbedBuilder {
        const embed = this.createNormalEmbed({
            color: match.matchColorCode,
        });

        embed.setTitle(match.name).addFields(
            {
                name: match.team[0][0],
                value: bold(match.team[0][1].toString()),
                inline: true,
            },
            {
                name: match.team[1][0],
                value: bold(match.team[1][1].toString()),
                inline: true,
            },
        );

        return embed;
    }

    /**
     * Creates an embed for a map share submission.
     *
     * @param submission The submission.
     * @returns The options for the embed.
     */
    static async createMapShareEmbed(
        submission: MapShare,
        language: Language = "en",
    ): Promise<BaseMessageOptions | null> {
        const localization = this.getLocalization(language);

        const beatmapInfo = await BeatmapManager.getBeatmap(
            submission.beatmap_id,
            { checkFile: false },
        );

        if (!beatmapInfo) {
            return null;
        }

        const calcParams = new DifficultyCalculationParameters();

        const droidDiffAttribs =
            await PPProcessorRESTManager.getDifficultyAttributes(
                submission.beatmap_id,
                Modes.droid,
                PPCalculationMethod.live,
                calcParams,
            );

        const osuDiffAttribs =
            await PPProcessorRESTManager.getDifficultyAttributes(
                submission.beatmap_id,
                Modes.osu,
                PPCalculationMethod.live,
                calcParams,
            );

        if (!droidDiffAttribs || !osuDiffAttribs) {
            return null;
        }

        const embedOptions = this.createCalculationEmbed(
            beatmapInfo,
            calcParams,
            droidDiffAttribs.attributes,
            osuDiffAttribs.attributes,
            undefined,
            undefined,
            language,
        );

        const embed = EmbedBuilder.from(embedOptions.embeds![0]);

        embed
            .setImage("attachment://chart.png")
            .setAuthor({
                name: StringHelper.formatString(
                    localization.getTranslation("mapShareSubmission"),
                    submission.submitter,
                ),
                iconURL: `attachment://osu-${osuDiffAttribs.attributes.starRating.toFixed(
                    2,
                )}.png`,
            })
            .addFields(
                {
                    name: bold(localization.getTranslation("starRating")),
                    value:
                        `${Symbols.star.repeat(
                            Math.min(
                                10,
                                Math.floor(
                                    droidDiffAttribs.attributes.starRating,
                                ),
                            ),
                        )} ${droidDiffAttribs.attributes.starRating.toFixed(
                            2,
                        )} ${localization.getTranslation("droidStars")}\n` +
                        `${Symbols.star.repeat(
                            Math.min(
                                10,
                                Math.floor(
                                    osuDiffAttribs.attributes.starRating,
                                ),
                            ),
                        )} ${osuDiffAttribs.attributes.starRating.toFixed(
                            2,
                        )} ${localization.getTranslation("pcStars")}`,
                },
                {
                    name: bold(
                        localization.getTranslation("mapShareStatusAndSummary"),
                    ),
                    value:
                        `${bold(
                            localization.getTranslation("mapShareStatus"),
                        )}: ${StringHelper.capitalizeString(
                            localization.getTranslation(
                                <keyof EmbedCreatorStrings>(
                                    `mapShareStatus${StringHelper.capitalizeString(
                                        submission.status,
                                    )}`
                                ),
                            ),
                        )}\n\n` +
                        `${bold(
                            localization.getTranslation("mapShareSummary"),
                        )}:\n${submission.summary}`,
                },
            );

        return embedOptions;
    }

    /**
     * Gets an embed representing a music queue.
     *
     * @param queue The music queue.
     * @param language The locale of the user who attempted to create this embed. Defaults to English.
     * @returns The embed.
     */
    static createMusicQueueEmbed(
        queue: MusicQueue,
        language: Language = "en",
    ): EmbedBuilder {
        const localization = this.getLocalization(language);
        const embed = this.createNormalEmbed();

        embed
            .setTitle(queue.information.title)
            .setThumbnail(queue.information.thumbnail ?? null)
            .setDescription(
                `${localization.getTranslation("musicYoutubeChannel")}: ${
                    queue.information.author.name
                }\n\n${localization.getTranslation(
                    "musicDuration",
                )}: ${queue.information.duration.toString()}\n\n${StringHelper.formatString(
                    localization.getTranslation("musicQueuer"),
                    userMention(queue.queuer),
                )}`,
            )
            .setURL(queue.information.url);

        return embed;
    }

    /**
     * Gets an embed representing a user's warning.
     *
     * @param warning The warning.
     * @param language The locale of the user who attempted to create this embed. Defaults to English.
     */
    static createWarningEmbed(
        warning: Warning,
        language: Language = "en",
    ): EmbedBuilder {
        const localization = this.getLocalization(language);

        const embed = this.createNormalEmbed({
            color: "Blurple",
            footerText: `${localization.getTranslation("warningId")}: ${
                warning.guildSpecificId
            }`,
        });

        embed
            .setTitle(localization.getTranslation("warningInfo"))
            .setDescription(
                `${bold(
                    StringHelper.formatString(
                        localization.getTranslation("warningIssuedBy"),
                        warning.issuerId,
                        warning.issuerId,
                    ),
                )}\n\n` +
                    `${bold(
                        localization.getTranslation("warnedUser"),
                    )}: ${userMention(warning.discordId)} (${
                        warning.discordId
                    })\n` +
                    `${bold(
                        localization.getTranslation("channel"),
                    )}: ${channelMention(warning.channelId)} (${
                        warning.channelId
                    })\n` +
                    `${bold(
                        localization.getTranslation("creationDate"),
                    )}: ${DateTimeFormatHelper.dateToLocaleString(
                        new Date(warning.creationDate * 1000),
                        language,
                    )}\n` +
                    `${bold(
                        localization.getTranslation("expirationDate"),
                    )}: ${DateTimeFormatHelper.dateToLocaleString(
                        new Date(warning.expirationDate * 1000),
                        language,
                    )}\n\n` +
                    `${bold(localization.getTranslation("reason"))}:\n${
                        warning.reason
                    }`,
            );

        return embed;
    }

    /**
     * Gets the localization for this creator utility.
     *
     * @param language The language to localize.
     */
    private static getLocalization(
        language: Language,
    ): EmbedCreatorLocalization {
        return new EmbedCreatorLocalization(language);
    }
}
