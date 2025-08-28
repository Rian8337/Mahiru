import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { DanCourseLocalization } from "@localization/interactions/commands/osu! and osu!droid/dancourse/DanCourseLocalization";
import { SlashSubcommand } from "@structures/core/SlashSubcommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    if (!interaction.inCachedGuild()) {
        return;
    }

    const language = CommandHelper.getLocale(interaction);

    if (interaction.channelId !== "1054373588871958558") {
        interaction.ephemeral = true;

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                new ConstantsLocalization(language).getTranslation(
                    Constants.notAvailableInChannelReject
                )
            ),
        });
    }

    const localization = new DanCourseLocalization(language);

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

    const bindInfo =
        await DatabaseManager.elainaDb.collections.userBind.getFromUser(
            interaction.user,
            { projection: { _id: 0, uid: 1 } }
        );

    if (!bindInfo) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                new ConstantsLocalization(localization.language).getTranslation(
                    Constants.selfNotBindedReject
                )
            ),
        });
    }

    const score =
        await DatabaseManager.aliceDb.collections.danCourseLeaderboardScores.getScore(
            bindInfo.uid,
            course.hash
        );

    if (!score) {
        // Check for existing scores.
        const existingScore =
            await DatabaseManager.aliceDb.collections.danCourseScores.checkExistingScore(
                bindInfo.uid,
                course.hash
            );

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation(
                    existingScore
                        ? "threeFingerOrNonPassScoresSubmitted"
                        : "noScoresSubmitted"
                )
            ),
        });
    }

    const passStatus = course.isScorePassed(score);

    if (!passStatus.success) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("userPassedDanCourseFailed"),
                course.courseName,
                passStatus.reason!
            ),
        });
    }

    const role = await interaction.guild.roles.fetch(course.roleId);

    if (role && !interaction.member.roles.cache.has(role.id)) {
        await interaction.member.roles.add(role);
    }

    await InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("userPassedDanCourseSuccess"),
            course.courseName
        ),
    });
};
