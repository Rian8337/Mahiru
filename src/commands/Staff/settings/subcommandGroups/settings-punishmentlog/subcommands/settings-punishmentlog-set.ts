import { DatabaseManager } from "@alice-database/DatabaseManager";
import { SlashSubcommand } from "@alice-interfaces/core/SlashSubcommand";
import { SettingsLocalization } from "@alice-localization/commands/Staff/settings/SettingsLocalization";
import { MessageCreator } from "@alice-utils/creators/MessageCreator";
import { CommandHelper } from "@alice-utils/helpers/CommandHelper";
import { InteractionHelper } from "@alice-utils/helpers/InteractionHelper";
import { GuildChannel } from "discord.js";

export const run: SlashSubcommand["run"] = async (_, interaction) => {
    const localization: SettingsLocalization = new SettingsLocalization(
        await CommandHelper.getLocale(interaction)
    );

    const channel: GuildChannel = <GuildChannel>(
        interaction.options.getChannel("channel", true)
    );

    if (!channel.isText()) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("chosenChannelIsNotText")
            ),
        });
    }

    await DatabaseManager.aliceDb.collections.guildPunishmentConfig.setGuildLogChannel(
        interaction.guildId!,
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
    permissions: ["MANAGE_GUILD"],
};
