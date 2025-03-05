import { DatabaseManager } from "@database/DatabaseManager";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { OnButtonPageChange } from "@structures/utils/OnButtonPageChange";
import { WarningLocalization } from "@localization/interactions/commands/Staff/warning/WarningLocalization";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { StringHelper } from "@utils/helpers/StringHelper";
import { WarningManager } from "@utils/managers/WarningManager";
import { GuildMember, bold, userMention, channelMention } from "discord.js";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization = new WarningLocalization(
        CommandHelper.getLocale(interaction)
    );

    const user = interaction.options.getUser("user") ?? interaction.user;

    if (
        user.id !== interaction.user.id &&
        interaction.inCachedGuild() &&
        !WarningManager.userCanWarn(interaction.member)
    ) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noPermissionToViewWarning")
            ),
        });
    }

    const warnings =
        await DatabaseManager.aliceDb.collections.userWarning.getUserWarningsInGuild(
            interaction.guildId!,
            user.id
        );

    if (warnings.size === 0) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation(
                    user.id === interaction.user.id
                        ? "selfDontHaveWarnings"
                        : "userDontHaveWarnings"
                )
            ),
        });
    }

    const embed = EmbedCreator.createNormalEmbed({
        author: interaction.user,
        color: (<GuildMember>interaction.member).displayColor,
    });

    embed
        .setTitle(
            StringHelper.formatString(
                localization.getTranslation("warningInfoForUser"),
                user.tag
            )
        )
        .setThumbnail(user.avatarURL()!)
        .setDescription(
            `${bold(
                localization.getTranslation("totalActivePoints")
            )}: ${warnings
                .filter((v) => v.isActive)
                .reduce((a, v) => a + v.points, 0)}\n` +
                `${bold(localization.getTranslation("totalWarnings"))}: ${
                    warnings.size
                }\n` +
                `${bold(
                    localization.getTranslation("lastWarning")
                )}: ${DateTimeFormatHelper.dateToLocaleString(
                    new Date(warnings.at(0)!.creationDate * 1000),
                    localization.language
                )}`
        );

    const onPageChange: OnButtonPageChange = async (_, page) => {
        for (
            let i = 5 * (page - 1);
            i < Math.min(warnings.size, 5 + 5 * (page - 1));
            ++i
        ) {
            const warning = warnings.at(i)!;

            embed.addFields({
                name: `${i + 1}. ID ${warning.guildSpecificId}`,
                value:
                    `${bold(
                        localization.getTranslation("warningIssuer")
                    )}: ${userMention(warning.issuerId)} (${
                        warning.issuerId
                    })\n` +
                    `${bold(
                        localization.getTranslation("channel")
                    )}: ${channelMention(warning.channelId)} (${
                        warning.channelId
                    })\n` +
                    `${bold(
                        localization.getTranslation("creationDate")
                    )}: ${DateTimeFormatHelper.dateToLocaleString(
                        new Date(warning.creationDate * 1000),
                        localization.language
                    )}\n` +
                    `${bold(
                        localization.getTranslation("expirationDate")
                    )}: ${DateTimeFormatHelper.dateToLocaleString(
                        new Date(warning.expirationDate * 1000),
                        localization.language
                    )}`,
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
        Math.ceil(warnings.size / 5),
        120,
        onPageChange
    );
};
