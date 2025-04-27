import { DatabaseManager } from "@database/DatabaseManager";
import { Symbols } from "@enums/utils/Symbols";
import { PoolLocalization } from "@localization/interactions/commands/Tournament/pool/PoolLocalization";
import { TournamentScore } from "@structures/tournament/TournamentScore";
import { OnButtonPageChange } from "@structures/utils/OnButtonPageChange";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { EmoteManager } from "@utils/managers/EmoteManager";
import { GuildMember, bold } from "discord.js";
import { SlashSubcommand } from "structures/core/SlashSubcommand";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization = new PoolLocalization(
        CommandHelper.getLocale(interaction)
    );

    const id = interaction.options.getString("id", true);
    const pick = interaction.options.getString("pick", true);

    const pool =
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

    const map = pool.getBeatmapFromPick(pick);

    if (!map) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("mapNotFound")
            ),
        });
    }

    await InteractionHelper.deferReply(interaction);

    const scores = await pool.getBeatmapLeaderboard(pick);

    if (scores.length === 0) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("beatmapHasNoScores")
            ),
        });
    }

    const embed = EmbedCreator.createNormalEmbed({
        author: interaction.user,
        color: (<GuildMember>interaction.member).displayColor,
    }).setTitle(map.name);

    const topScore = scores[0];
    const BCP47 = LocaleHelper.convertToBCP47(localization.language);

    const getScoreDescription = (score: TournamentScore): string => {
        const arrow = Symbols.rightArrowSmall;

        return (
            `${arrow} ${EmoteManager.getRankEmote(
                score.score.rank
            )} ${arrow} ${(score.score.accuracy.value() * 100).toFixed(2)}%\n` +
            `${arrow} ${bold(
                score.scoreV2.toLocaleString(BCP47)
            )} ScoreV2 (${bold(
                pool
                    .calculateScorePortionScoreV2(
                        pick,
                        score.score.score,
                        score.score.accuracy.nmiss,
                        score.score.mods
                    )
                    .toLocaleString(BCP47)
            )} score, ${bold(
                pool
                    .calculateAccuracyPortionScoreV2(
                        pick,
                        score.score.accuracy.value(),
                        score.score.accuracy.nmiss,
                        score.score.mods
                    )
                    .toLocaleString(BCP47)
            )} accuracy)\n` +
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
        embed.addFields({
            name: bold(localization.getTranslation("topScore")),
            value:
                `${bold(
                    `${topScore.score.username} ${topScore.score.completeModString}`
                )}\n` + getScoreDescription(topScore),
        });

        const actualPage = Math.floor((page - 1) / 20);
        const pageRemainder = (page - 1) % 20;

        const displayedScores = scores.slice(
            5 * pageRemainder,
            5 + 5 * pageRemainder
        );

        let i = 20 * actualPage + 5 * pageRemainder;

        for (const score of displayedScores) {
            embed.addFields({
                name: `**#${++i} ${score.score.username} ${
                    score.score.completeModString
                }**`,
                value: getScoreDescription(score),
            });
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
