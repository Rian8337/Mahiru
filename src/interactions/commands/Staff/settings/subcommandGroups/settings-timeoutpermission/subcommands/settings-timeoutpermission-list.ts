import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { OnButtonPageChange } from "@structures/utils/OnButtonPageChange";
import { SettingsLocalization } from "@localization/interactions/commands/Staff/settings/SettingsLocalization";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { roleMention } from "discord.js";
import { CacheManager } from "@utils/managers/CacheManager";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    if (!interaction.inCachedGuild()) {
        return;
    }

    const localization = new SettingsLocalization(
        CommandHelper.getLocale(interaction)
    );

    const guildConfig = CacheManager.guildPunishmentConfigs.get(
        interaction.guildId
    );

    if (!guildConfig) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noLogChannelConfigured")
            ),
        });
    }

    const { allowedTimeoutRoles } = guildConfig;

    const embed = EmbedCreator.createNormalEmbed({
        author: interaction.user,
        color: interaction.member.displayColor,
    });

    embed.setTitle(localization.getTranslation("rolesWithTimeoutPermission"));

    const onPageChange: OnButtonPageChange = async (_, page) => {
        const list: string[] = [];

        for (
            let i = 10 * (page - 1);
            i < Math.min(allowedTimeoutRoles.size, 10 + 10 * (page - 1));
            ++i
        ) {
            const timeoutRole = allowedTimeoutRoles.at(i)!;

            list.push(
                `- ${roleMention(timeoutRole.id)} (${
                    timeoutRole.maxTime === -1
                        ? localization.getTranslation("indefinite")
                        : DateTimeFormatHelper.secondsToDHMS(
                              timeoutRole.maxTime,
                              localization.language
                          )
                })`
            );
        }

        embed.setDescription(list.join("\n"));
    };

    MessageButtonCreator.createLimitedButtonBasedPaging(
        interaction,
        { embeds: [embed] },
        [interaction.user.id],
        1,
        Math.ceil(allowedTimeoutRoles.size / 10),
        120,
        onPageChange
    );
};

export const config: SlashSubcommand["config"] = {
    permissions: ["Administrator"],
};
