import { SettingsLocalization } from "@localization/interactions/commands/Staff/settings/SettingsLocalization";
import { SlashSubcommand } from "@structures/core/SlashSubcommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { CacheManager } from "@utils/managers/CacheManager";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    if (!interaction.inCachedGuild()) {
        return;
    }

    const localization = new SettingsLocalization(
        CommandHelper.getLocale(interaction)
    );

    const role = interaction.options.getRole("role", true);

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

    await InteractionHelper.deferReply(interaction);

    const result = await guildConfig.setPermanentTimeoutRole(role);

    if (result.failed()) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("setPermanentTimeoutRoleFailed"),
                result.reason
            ),
        });
    }

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("setPermanentTimeoutRoleSuccess"),
            role.name
        ),
    });
};
