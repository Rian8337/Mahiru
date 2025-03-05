import { DatabaseManager } from "@database/DatabaseManager";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { SettingsLocalization } from "@localization/interactions/commands/Staff/settings/SettingsLocalization";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    if (!interaction.inGuild()) {
        return;
    }

    await InteractionHelper.deferReply(interaction);
    await DatabaseManager.aliceDb.collections.guildPunishmentConfig.unsetGuildLogChannel(
        interaction.guildId
    );

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            new SettingsLocalization(
                CommandHelper.getLocale(interaction)
            ).getTranslation("unsetLogChannelSuccess")
        ),
    });
};

export const config: SlashSubcommand["config"] = {
    permissions: ["ManageGuild"],
};
