import { DatabaseManager } from "@database/DatabaseManager";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { SettingsLocalization } from "@localization/interactions/commands/Staff/settings/SettingsLocalization";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { GuildChannel } from "discord.js";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    if (!interaction.inGuild()) {
        return;
    }

    const localization = new SettingsLocalization(
        CommandHelper.getLocale(interaction)
    );

    const channel = <GuildChannel>(
        interaction.options.getChannel("channel", true)
    );

    if (!channel.isTextBased()) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("chosenChannelIsNotText")
            ),
        });
    }

    await InteractionHelper.deferReply(interaction);
    await DatabaseManager.aliceDb.collections.guildPunishmentConfig.setGuildLogChannel(
        interaction.guildId,
        channel.id
    );

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("setLogChannelSuccess"),
            channel.toString()
        ),
    });
};

export const config: SlashSubcommand["config"] = {
    permissions: ["ManageGuild"],
};
