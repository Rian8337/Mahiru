import { DatabaseManager } from "@database/DatabaseManager";
import { SettingsLocalization } from "@localization/interactions/commands/Staff/settings/SettingsLocalization";
import { SlashSubcommand } from "@structures/core/SlashSubcommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    if (!interaction.inCachedGuild()) {
        return;
    }

    const localization = new SettingsLocalization(
        CommandHelper.getLocale(interaction)
    );

    await InteractionHelper.deferReply(interaction);

    const guildConfig =
        await DatabaseManager.aliceDb.collections.guildPunishmentConfig.getGuildConfig(
            interaction.guild,
            { projection: { _id: 0, permanentTimeoutRole: 1 } }
        );

    if (!guildConfig) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noLogChannelConfigured")
            ),
        });
    }

    const result = await guildConfig.removePermanentTimeoutRole(
        interaction.guild
    );

    if (result.failed()) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("unsetPermanentTimeoutRoleFailed"),
                result.reason
            ),
        });
    }

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("unsetPermanentTimeoutRoleSuccess")
        ),
    });
};
