import { OfficialDatabaseScore } from "@database/official/schema/OfficialDatabaseScore";
import { RecentPlay } from "@database/utils/aliceDb/RecentPlay";
import { BeatmapLeaderboardSortMode } from "@enums/interactions/BeatmapLeaderboardSortMode";
import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { Symbols } from "@enums/utils/Symbols";
import { Language } from "@localization/base/Language";
import { ScoreDisplayHelperLocalization } from "@localization/utils/helpers/ScoreDisplayHelper/ScoreDisplayHelperLocalization";
import {
    Accuracy,
    Modes,
    ModUtil,
    ScoreRank,
    SerializedMod,
} from "@rian8337/osu-base";
import {
    DroidDifficultyAttributes,
    OsuDifficultyAttributes,
} from "@rian8337/osu-difficulty-calculator";
import { Score } from "@rian8337/osu-droid-utilities";
import { CompleteCalculationAttributes } from "@structures/difficultyattributes/CompleteCalculationAttributes";
import { DroidPerformanceAttributes } from "@structures/difficultyattributes/DroidPerformanceAttributes";
import { OsuPerformanceAttributes } from "@structures/difficultyattributes/OsuPerformanceAttributes";
import { OnButtonPageChange } from "@structures/utils/OnButtonPageChange";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { EmoteManager } from "@utils/managers/EmoteManager";
import { PPProcessorRESTManager } from "@utils/managers/PPProcessorRESTManager";
import {
    ActionRowBuilder,
    BaseMessageOptions,
    bold,
    ButtonBuilder,
    Collection,
    ContainerBuilder,
    GuildMember,
    heading,
    HeadingLevel,
    Message,
    MessageFlags,
    RepliableInteraction,
    SectionBuilder,
    SeparatorBuilder,
    Snowflake,
    TextDisplayBuilder,
} from "discord.js";
import { CommandHelper } from "./CommandHelper";
import { DateTimeFormatHelper } from "./DateTimeFormatHelper";
import { DroidHelper } from "./DroidHelper";
import { InteractionHelper } from "./InteractionHelper";
import { LocaleHelper } from "./LocaleHelper";
import { NumberHelper } from "./NumberHelper";
import { StringHelper } from "./StringHelper";

/**
 * A helper for displaying scores to a user.
 */
export abstract class ScoreDisplayHelper {
    /**
     * Shows a player's recent plays.
     *
     * @param interaction The interaction that triggered the command.
     * @param username The name of the player.
     * @param scores The recent scores of the player.
     * @returns A message showing the player's recent plays.
     */
    static async showRecentPlays(
        interaction: RepliableInteraction,
        username: string,
        scores: (
            | Pick<
                  OfficialDatabaseScore,
                  | "filename"
                  | "mark"
                  | "mods"
                  | "score"
                  | "combo"
                  | "date"
                  | "perfect"
                  | "good"
                  | "bad"
                  | "miss"
                  | "pp"
              >
            | Score
            | RecentPlay
        )[],
        page = 1
    ): Promise<Message> {
        const localization = this.getLocalization(
            CommandHelper.getLocale(interaction)
        );

        const embed = EmbedCreator.createNormalEmbed({
            author: interaction.user,
            color: (interaction.member as GuildMember | null)?.displayColor,
        });

        page = NumberHelper.clamp(page, 1, Math.ceil(scores.length / 5));

        embed.setDescription(
            StringHelper.formatString(
                localization.getTranslation("recentPlays"),
                bold(username)
            )
        );

        const onPageChange: OnButtonPageChange = async (_, page) => {
            for (
                let i = 5 * (page - 1);
                i < Math.min(scores.length, 5 + 5 * (page - 1));
                ++i
            ) {
                const score = scores[i];
                const accuracy =
                    score instanceof Score || score instanceof RecentPlay
                        ? score.accuracy
                        : new Accuracy({
                              n300: score.perfect,
                              n100: score.good,
                              n50: score.bad,
                              nmiss: score.miss,
                          });

                let fieldName = `${i + 1}. ${EmoteManager.getRankEmote(
                    score instanceof Score || score instanceof RecentPlay
                        ? score.rank
                        : score.mark
                )} | `;

                if (score instanceof Score || score instanceof RecentPlay) {
                    fieldName += `${score.title} ${score.completeModString}`;
                } else {
                    const mods = ModUtil.modsToOrderedString(
                        ModUtil.deserializeMods(
                            JSON.parse(score.mods) as SerializedMod[]
                        )
                    );

                    fieldName += `${DroidHelper.cleanupFilename(score.filename)} ${mods ? `+${mods}` : ""}`;
                }

                let fieldValue =
                    `${score.score.toLocaleString(
                        LocaleHelper.convertToBCP47(localization.language)
                    )} / ${score.combo}x / ${(accuracy.value() * 100).toFixed(
                        2
                    )}% / [${accuracy.n300}/${
                        accuracy.n100
                    }/${accuracy.n50}/${accuracy.nmiss}]\n` +
                    `\`${DateTimeFormatHelper.dateToLocaleString(
                        score.date,
                        localization.language
                    )}\``;

                if (score instanceof RecentPlay) {
                    fieldValue += "\n";

                    if (score.droidAttribs) {
                        fieldValue += `${bold(score.droidAttribs.performance.total.toFixed(2))}dpp`;
                    }

                    if (score.osuAttribs) {
                        if (score.droidAttribs) {
                            fieldValue += " - ";
                        }

                        fieldValue += `${bold(score.osuAttribs.performance.total.toFixed(2))}pp`;
                    }
                } else if (score.pp !== null) {
                    fieldValue += `\n${bold(score.pp.toFixed(2))}dpp`;
                }

                embed.addFields({
                    name: fieldName,
                    value: fieldValue,
                });
            }
        };

        return MessageButtonCreator.createLimitedButtonBasedPaging(
            interaction,
            { embeds: [embed] },
            [interaction.user.id],
            page,
            Math.ceil(scores.length / 5),
            120,
            onPageChange
        );
    }

    /**
     * Gets the emote ID of a rank.
     *
     * @param rank The rank.
     * @returns The emote ID.
     */
    static getRankEmoteID(rank: ScoreRank): Snowflake {
        switch (rank) {
            case "A":
                return "611559473236148265";
            case "B":
                return "611559473169039413";
            case "C":
                return "611559473328422942";
            case "D":
                return "611559473122639884";
            case "S":
                return "611559473294606336";
            case "X":
                return "611559473492000769";
            case "SH":
                return "611559473361846274";
            case "XH":
                return "611559473479155713";
        }
    }

    /**
     * Displays a beatmap's leaderboard.
     *
     * @param interaction The interaction to display the leaderboard to.
     * @param hash The MD5 hash of the beatmap.
     * @param page The page to view. Defaults to 1.
     * @param cacheBeatmapToChannel Whether to cache the beatmap as the channel's latest beatmap. Defaults to `true`.
     */
    static async showBeatmapLeaderboard(
        interaction: RepliableInteraction,
        hash: string,
        page = 1,
        order = BeatmapLeaderboardSortMode.score,
        cacheBeatmapToChannel = true
    ): Promise<void> {
        await InteractionHelper.deferReply(interaction);

        const localization = this.getLocalization(
            CommandHelper.getLocale(interaction)
        );

        const beatmapInfo = await BeatmapManager.getBeatmap(hash, {
            checkFile: false,
        });

        if (beatmapInfo && cacheBeatmapToChannel) {
            BeatmapManager.setChannelLatestBeatmap(
                interaction.channelId!,
                beatmapInfo.hash
            );
        }

        // Leaderboard cache, mapped by page number
        const leaderboardCache = new Collection<number, Score[]>();

        // Calculation cache, mapped by score ID
        const droidAttribsCache = new Collection<
            number,
            CompleteCalculationAttributes<
                DroidDifficultyAttributes,
                DroidPerformanceAttributes
            > | null
        >();
        const osuAttribsCache = new Collection<
            number,
            CompleteCalculationAttributes<
                OsuDifficultyAttributes,
                OsuPerformanceAttributes
            > | null
        >();

        // Check first page first for score availability
        const firstPageScores = await DroidHelper.getBeatmapLeaderboard(
            beatmapInfo?.hash ?? hash,
            order
        );

        if (!firstPageScores[0]) {
            InteractionHelper.reply(interaction, {
                content: MessageCreator.createReject(
                    localization.getTranslation("beatmapHasNoScores")
                ),
            });

            return;
        }

        leaderboardCache.set(1, firstPageScores);

        const arrow = Symbols.rightArrowSmall;

        const getCalculationResult = async (
            score: Score | OfficialDatabaseScore
        ): Promise<
            [
                CompleteCalculationAttributes<
                    DroidDifficultyAttributes,
                    DroidPerformanceAttributes
                > | null,
                CompleteCalculationAttributes<
                    OsuDifficultyAttributes,
                    OsuPerformanceAttributes
                > | null,
            ]
        > => {
            const droidAttribs = beatmapInfo
                ? (droidAttribsCache.get(score.id) ??
                  (
                      await PPProcessorRESTManager.getOnlineScoreAttributes(
                          score.uid,
                          score.hash,
                          Modes.droid,
                          PPCalculationMethod.live
                      )
                  )?.attributes ??
                  null)
                : null;

            const osuAttribs = beatmapInfo
                ? (osuAttribsCache.get(score.id) ??
                  (
                      await PPProcessorRESTManager.getOnlineScoreAttributes(
                          score.uid,
                          score.hash,
                          Modes.osu,
                          PPCalculationMethod.live
                      )
                  )?.attributes ??
                  null)
                : null;

            if (!droidAttribsCache.has(score.id)) {
                droidAttribsCache.set(score.id, droidAttribs);
            }

            if (!osuAttribsCache.has(score.id)) {
                osuAttribsCache.set(score.id, osuAttribs);
            }

            return [droidAttribs, osuAttribs];
        };

        const getScoreDescription = async (score: Score): Promise<string> => {
            const attribs = await getCalculationResult(score);

            return (
                `${arrow} ${EmoteManager.getRankEmote(score.rank)} ${
                    attribs[0] && attribs[1]
                        ? `${arrow} ${bold(
                              `${attribs[0].performance.total.toFixed(
                                  2
                              )}DPP | ${attribs[1].performance.total.toFixed(
                                  2
                              )}PP`
                          )} `
                        : " "
                }${arrow} ${(score.accuracy.value() * 100).toFixed(2)}%\n` +
                `${arrow} ${score.score.toLocaleString(
                    LocaleHelper.convertToBCP47(localization.language)
                )} ${arrow} ${score.combo}x ${arrow} [${score.accuracy.n300}/${
                    score.accuracy.n100
                }/${score.accuracy.n50}/${score.accuracy.nmiss}]\n` +
                `\`${DateTimeFormatHelper.dateToLocaleString(
                    score.date,
                    localization.language
                )}\``
            );
        };

        const noModDroidAttribs = beatmapInfo
            ? await PPProcessorRESTManager.getDifficultyAttributes(
                  beatmapInfo.beatmapId,
                  Modes.droid,
                  PPCalculationMethod.live
              )
            : null;

        const noModOsuAttribs = beatmapInfo
            ? await PPProcessorRESTManager.getDifficultyAttributes(
                  beatmapInfo.beatmapId,
                  Modes.osu,
                  PPCalculationMethod.live
              )
            : null;

        const onPageChange: OnButtonPageChange = async (options, page) => {
            const actualPage = Math.floor((page - 1) / 20);
            const pageRemainder = (page - 1) % 20;

            const scores =
                leaderboardCache.get(actualPage) ??
                (await DroidHelper.getBeatmapLeaderboard(
                    beatmapInfo?.hash ?? hash,
                    order,
                    page
                ));

            if (!leaderboardCache.has(actualPage)) {
                leaderboardCache.set(actualPage, scores);
            }

            const newOptions: BaseMessageOptions = beatmapInfo
                ? EmbedCreator.createBeatmapEmbed(
                      beatmapInfo,
                      undefined,
                      localization.language
                  )
                : { components: [new ContainerBuilder()] };

            const newComponents = newOptions.components!.slice();
            newOptions.components = newComponents;

            const containerBuilder = newComponents[0] as ContainerBuilder;

            containerBuilder.spliceComponents(
                containerBuilder.components.length - 1,
                1
            );

            const topScore = leaderboardCache.get(1)![0];

            if (
                containerBuilder.components.length > 0 &&
                noModDroidAttribs &&
                noModOsuAttribs
            ) {
                const sectionBuilder = containerBuilder
                    .components[0] as SectionBuilder;
                const titleBuilder = sectionBuilder
                    .components[0] as TextDisplayBuilder;

                titleBuilder.setContent(
                    titleBuilder.data.content! +
                        ` [${noModDroidAttribs.attributes.starRating.toFixed(2)}${
                            Symbols.star
                        } | ${noModOsuAttribs.attributes.starRating.toFixed(2)}${
                            Symbols.star
                        }]`
                );
            } else {
                containerBuilder
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            heading(topScore.title, HeadingLevel.Two)
                        )
                    )
                    .addSeparatorComponents(new SeparatorBuilder());
            }

            const displayedScores = scores.slice(
                5 * pageRemainder,
                5 + 5 * pageRemainder
            );

            if (options.components) {
                const pagingRow = options.components.at(
                    -1
                ) as ActionRowBuilder<ButtonBuilder>;

                const buttons = pagingRow.components;

                buttons[buttons.length - 2].setDisabled(
                    displayedScores.length < 5
                );

                buttons[buttons.length - 1].setDisabled(
                    displayedScores.length < 5
                );

                // Preserve paging action row buttons
                newComponents.push(pagingRow);
            }

            let i = 20 * actualPage + 5 * pageRemainder;

            for (const score of displayedScores) {
                containerBuilder.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        bold(
                            `#${++i} ${score.username}${
                                !score.mods.isEmpty
                                    ? ` (${score.completeModString})`
                                    : ""
                            }`
                        ) +
                            "\n" +
                            (await getScoreDescription(score))
                    )
                );
            }

            Object.assign(options, {
                ...newOptions,
                flags: MessageFlags.IsComponentsV2,
            });
        };

        MessageButtonCreator.createLimitlessButtonBasedPaging(
            interaction,
            {},
            [interaction.user.id],
            page,
            120,
            onPageChange
        );
    }

    /**
     * Gets the localization of this helper utility.
     *
     * @param language The language to localize.
     */
    private static getLocalization(
        language: Language
    ): ScoreDisplayHelperLocalization {
        return new ScoreDisplayHelperLocalization(language);
    }
}
