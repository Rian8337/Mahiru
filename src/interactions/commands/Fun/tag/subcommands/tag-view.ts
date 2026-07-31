import { DatabaseManager } from "@database/DatabaseManager";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { TagLocalization } from "@localization/interactions/commands/Fun/tag/TagLocalization";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { BaseMessageOptions } from "discord.js";
import { Constants } from "@core/Constants";

export const run: SlashSubcommand<true>["run"] = async (
    client,
    interaction,
) => {
    if (!interaction.inGuild()) {
        return;
    }

    const localization = new TagLocalization(
        CommandHelper.getLocale(interaction),
    );

    const name = interaction.options.getString("name", true);

    const tag = await DatabaseManager.aliceDb.collections.guildTags.getByName(
        interaction.guildId,
        name,
    );

    if (!tag) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("tagDoesntExist"),
            ),
        });
    }

    if (!tag.content && tag.attachments.length === 0) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation(
                    "tagDoesntHaveContentAndAttachments",
                ),
            ),
        });
    }

    // Discord implemented a time gate for attachments. Fetch the message to get a fresh link.
    const testingServer = await client.guilds.fetch(Constants.testingServer);

    const tagChannel = await testingServer.channels.fetch(
        Constants.tagAttachmentChannel,
    );

    if (!tagChannel?.isTextBased()) {
        return;
    }

    const tagMessage = await tagChannel.messages.fetch(tag.attachment_message);

    const options: BaseMessageOptions = {
        allowedMentions: {
            parse: [],
        },
    };

    if (tag.content) {
        options.content = tag.content;
    }

    if (tagMessage.attachments.size > 0) {
        options.files = [...tagMessage.attachments.values()];
    }

    InteractionHelper.reply(interaction, options);
};
