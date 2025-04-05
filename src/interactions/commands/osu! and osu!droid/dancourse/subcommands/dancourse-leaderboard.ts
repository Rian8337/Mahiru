import { DatabaseManager } from "@database/DatabaseManager";
import { DanCourseLeaderboardScore } from "@database/utils/aliceDb/DanCourseLeaderboardScore";
import { Symbols } from "@enums/utils/Symbols";
import { DanCourseLocalization } from "@localization/interactions/commands/osu! and osu!droid/dancourse/DanCourseLocalization";
import { Accuracy } from "@rian8337/osu-base";
import { SlashSubcommand } from "@structures/core/SlashSubcommand";
import { OnButtonPageChange } from "@structures/utils/OnButtonPageChange";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { DroidHelper } from "@utils/helpers/DroidHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { NumberHelper } from "@utils/helpers/NumberHelper";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { BaseMessageOptions, bold, Collection, EmbedBuilder } from "discord.js";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization = new DanCourseLocalization(
        CommandHelper.getLocale(interaction)
    );

    const course =
        await DatabaseManager.aliceDb.collections.danCourses.getCourse(
            interaction.options.getString("name", true)
        );

    if (!course) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("courseNotFound")
            ),
        });
    }

    const arrow = Symbols.rightArrowSmall;
    const scoreCache = new Collection<number, DanCourseLeaderboardScore[]>();

    // Check first page first for score availability
    const firstPageScores =
        await DatabaseManager.aliceDb.collections.danCourseLeaderboardScores.getLeaderboard(
            course.hash,
            1
        );

    if (firstPageScores.length === 0) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("courseHasNoScores")
            ),
        });
    }

    scoreCache.set(1, firstPageScores);

    const getScoreDescription = (score: DanCourseLeaderboardScore): string => {
        return (
            `${arrow} ${BeatmapManager.getRankEmote(
                score.rank
            )} ${arrow} ${NumberHelper.round(
                new Accuracy({
                    n300: score.perfect,
                    n100: score.good,
                    n50: score.bad,
                    nmiss: score.miss,
                }).value() * 100,
                2
            )}%\n` +
            `${arrow} ${bold(
                NumberHelper.round(score.grade, 2).toString()
            )} ${arrow} ${score.score.toLocaleString(
                LocaleHelper.convertToBCP47(localization.language)
            )} ${arrow} ${score.maxCombo}x ${arrow} [${score.perfect}/${
                score.good
            }/${score.bad}/${score.miss}]\n` +
            `\`${DateTimeFormatHelper.dateToLocaleString(
                new Date(score.date),
                localization.language
            )}\``
        );
    };

    const onPageChange: OnButtonPageChange = async (options, page) => {
        const actualPage = Math.floor((page - 1) / 10);
        const pageRemainder = (page - 1) % 20;

        const scores =
            scoreCache.get(actualPage) ??
            (await DatabaseManager.aliceDb.collections.danCourseLeaderboardScores.getLeaderboard(
                course.hash,
                page
            ));

        if (!scoreCache.has(actualPage)) {
            scoreCache.set(actualPage, scores);
        }

        const embedOptions: BaseMessageOptions = {
            embeds: [EmbedCreator.createNormalEmbed()],
        };
        const embed = <EmbedBuilder>embedOptions.embeds![0];
        const topScore = scoreCache.get(1)![0];
        const modString = DroidHelper.getCompleteModString(topScore.modstring);

        embed.setTitle(course.courseName).addFields({
            name: `${bold(localization.getTranslation("topScore"))}`,
            value: `${bold(
                `${topScore.username} ${modString}`
            )}\n${getScoreDescription(topScore)}`,
        });

        const displayedScores = scores.slice(
            5 * pageRemainder,
            5 + 5 * pageRemainder
        );
        let i = 10 * actualPage + 5 * pageRemainder;

        for (const score of displayedScores) {
            embed.addFields({
                name: `${++i} ${score.username} ${modString}`,
                value: getScoreDescription(score),
            });
        }

        Object.assign(options, embedOptions);
    };

    MessageButtonCreator.createLimitlessButtonBasedPaging(
        interaction,
        {},
        [interaction.user.id],
        1,
        120,
        onPageChange
    );
};
