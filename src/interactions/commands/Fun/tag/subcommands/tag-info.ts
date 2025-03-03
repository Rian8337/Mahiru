import { DatabaseManager } from "@database/DatabaseManager";
import { GuildTag } from "@database/utils/aliceDb/GuildTag";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { TagLocalization } from "@localization/interactions/commands/Fun/tag/TagLocalization";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { bold, EmbedBuilder, userMention } from "discord.js";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    if (!interaction.inCachedGuild()) {
        return;
    }

    const localization: TagLocalization = new TagLocalization(
        CommandHelper.getLocale(interaction),
    );

    const name: string = interaction.options.getString("name", true);

    const tag: GuildTag | null =
        await DatabaseManager.aliceDb.collections.guildTags.getByName(
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

    const embed: EmbedBuilder = EmbedCreator.createNormalEmbed({
        author: interaction.user,
        color: interaction.member.displayColor,
    });

    embed
        .setTitle(localization.getTranslation("tagInfo"))
        .setDescription(
            `${bold(localization.getTranslation("tagName"))}: ${tag.name}\n` +
                `${bold(localization.getTranslation("tagName"))}: ${userMention(
                    tag.author,
                )}\n` +
                `${bold(
                    localization.getTranslation("tagCreationDate"),
                )}: ${DateTimeFormatHelper.dateToLocaleString(
                    new Date(tag.date),
                    localization.language,
                )}\n` +
                `${bold(localization.getTranslation("tagAttachmentAmount"))}: ${
                    tag.attachments.length
                }`,
        );

    InteractionHelper.reply(interaction, {
        embeds: [embed],
    });
};
