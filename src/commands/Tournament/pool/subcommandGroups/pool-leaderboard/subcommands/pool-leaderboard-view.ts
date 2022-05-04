import { DatabaseManager } from "@alice-database/DatabaseManager";
import { TournamentMappool } from "@alice-database/utils/elainaDb/TournamentMappool";
import { Symbols } from "@alice-enums/utils/Symbols";
import { Subcommand } from "@alice-interfaces/core/Subcommand";
import { TournamentBeatmap } from "@alice-interfaces/tournament/TournamentBeatmap";
import { TournamentScore } from "@alice-interfaces/tournament/TournamentScore";
import { OnButtonPageChange } from "@alice-interfaces/utils/OnButtonPageChange";
import { PoolLocalization } from "@alice-localization/commands/Tournament/pool/PoolLocalization";
import { ScoreRank } from "@alice-types/utils/ScoreRank";
import { EmbedCreator } from "@alice-utils/creators/EmbedCreator";
import { MessageButtonCreator } from "@alice-utils/creators/MessageButtonCreator";
import { MessageCreator } from "@alice-utils/creators/MessageCreator";
import { CommandHelper } from "@alice-utils/helpers/CommandHelper";
import { DateTimeFormatHelper } from "@alice-utils/helpers/DateTimeFormatHelper";
import { InteractionHelper } from "@alice-utils/helpers/InteractionHelper";
import { LocaleHelper } from "@alice-utils/helpers/LocaleHelper";
import { BeatmapManager } from "@alice-utils/managers/BeatmapManager";
import { GuildMember, MessageEmbed } from "discord.js";

export const run: Subcommand["run"] = async (_, interaction) => {
    const localization: PoolLocalization = new PoolLocalization(
        await CommandHelper.getLocale(interaction)
    );

    const id: string = interaction.options.getString("id", true);

    const pick: string = interaction.options.getString("pick", true);

    const pool: TournamentMappool | null =
        await DatabaseManager.elainaDb.collections.tournamentMappool.getFromId(
            id
        );

    if (!pool) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("poolNotFound")
            ),
        });
    }

    const map: TournamentBeatmap | null = pool.getBeatmapFromPick(pick);

    if (!map) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("mapNotFound")
            ),
        });
    }

    await InteractionHelper.defer(interaction);

    const scores: TournamentScore[] = await pool.getBeatmapLeaderboard(pick);

    if (scores.length === 0) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("beatmapHasNoScores")
            ),
        });
    }

    const embed: MessageEmbed = EmbedCreator.createNormalEmbed({
        author: interaction.user,
        color: (<GuildMember>interaction.member).displayColor,
    }).setTitle(map.name);

    const topScore: TournamentScore = scores[0];

    const BCP47: string = LocaleHelper.convertToBCP47(localization.language);

    const getScoreDescription = (score: TournamentScore): string => {
        const arrow: Symbols = Symbols.rightArrowSmall;

        return (
            `${arrow} **${BeatmapManager.getRankEmote(
                <ScoreRank>score.score.rank
            )}** ${arrow} ${(score.score.accuracy.value() * 100).toFixed(
                2
            )}%\n` +
            `${arrow} **${score.scoreV2.toLocaleString(
                BCP47
            )}** ScoreV2 (**${pool
                .calculateScorePortionScoreV2(
                    pick,
                    score.score.score,
                    score.score.accuracy.nmiss,
                    score.score.mods
                )
                .toLocaleString(BCP47)}** score, **${pool
                .calculateAccuracyPortionScoreV2(
                    pick,
                    score.score.accuracy.value(),
                    score.score.accuracy.nmiss
                )
                .toLocaleString(BCP47)}** accuracy)\n` +
            `${arrow} ${score.score.score.toLocaleString(
                BCP47
            )} ScoreV1 ${arrow} ${score.score.combo}x ${arrow} [${
                score.score.accuracy.n300
            }/${score.score.accuracy.n100}/${score.score.accuracy.n50}/${
                score.score.accuracy.nmiss
            }]\n` +
            `\`${DateTimeFormatHelper.dateToLocaleString(
                score.score.date,
                localization.language
            )}\``
        );
    };

    const onPageChange: OnButtonPageChange = async (_, page) => {
        embed.addField(
            `**${localization.getTranslation("topScore")}**`,
            `**${topScore.score.username}${
                topScore.score.mods.length > 0
                    ? ` (${topScore.score.getCompleteModString()})`
                    : ""
            }**\n` + getScoreDescription(topScore)
        );

        const actualPage: number = Math.floor((page - 1) / 20);

        const pageRemainder: number = (page - 1) % 20;

        const displayedScores: TournamentScore[] = scores.slice(
            5 * pageRemainder,
            5 + 5 * pageRemainder
        );

        let i = 20 * actualPage + 5 * pageRemainder;

        for (const score of displayedScores) {
            embed.addField(
                `**#${++i} ${score.score.username}${
                    score.score.mods.length > 0
                        ? ` (${score.score.getCompleteModString()})`
                        : ""
                }**`,
                getScoreDescription(score)
            );
        }
    };

    MessageButtonCreator.createLimitedButtonBasedPaging(
        interaction,
        {
            embeds: [embed],
        },
        [interaction.user.id],
        1,
        Math.ceil(scores.length / 5),
        120,
        onPageChange
    );
};

export const config: Subcommand["config"] = {
    permissions: [],
};
