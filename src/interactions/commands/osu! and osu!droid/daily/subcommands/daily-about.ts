import { Constants } from "@alice-core/Constants";
import { SlashSubcommand } from "@alice-interfaces/core/SlashSubcommand";
import { DailyLocalization } from "@alice-localization/interactions/commands/osu! and osu!droid/daily/DailyLocalization";
import { EmbedCreator } from "@alice-utils/creators/EmbedCreator";
import { CommandHelper } from "@alice-utils/helpers/CommandHelper";
import { InteractionHelper } from "@alice-utils/helpers/InteractionHelper";
import { StringHelper } from "@alice-utils/helpers/StringHelper";
import { GuildEmoji, GuildMember, MessageEmbed } from "discord.js";

export const run: SlashSubcommand["run"] = async (client, interaction) => {
    const localization: DailyLocalization = new DailyLocalization(
        await CommandHelper.getLocale(interaction)
    );

    const embed: MessageEmbed = EmbedCreator.createNormalEmbed({
        author: interaction.user,
        color: (<GuildMember>interaction.member).displayColor,
    });

    const coin: GuildEmoji = client.emojis.resolve(Constants.aliceCoinEmote)!;

    embed
        .setTitle(localization.getTranslation("aboutTitle"))
        .setThumbnail("https://image.frl/p/beyefgeq5m7tobjg.jpg")
        .setDescription(
            StringHelper.formatString(
                localization.getTranslation("aboutDescription"),
                coin.toString()
            )
        )
        .addField(
            localization.getTranslation("aboutQuestion1"),
            StringHelper.formatString(
                localization.getTranslation("aboutAnswer1"),
                coin.toString(),
                coin.toString(),
                coin.toString(),
                coin.toString()
            )
        )
        .addField(
            localization.getTranslation("aboutQuestion2"),
            localization.getTranslation("aboutAnswer2")
        )
        .addField(
            localization.getTranslation("aboutQuestion3"),
            StringHelper.formatString(
                localization.getTranslation("aboutAnswer3"),
                coin.toString()
            )
        )
        .addField(
            localization.getTranslation("aboutQuestion4"),
            StringHelper.formatString(
                localization.getTranslation("aboutAnswer4"),
                coin.toString()
            )
        )
        .addField(
            localization.getTranslation("aboutQuestion5"),
            localization.getTranslation("aboutAnswer5")
        );

    InteractionHelper.reply(interaction, {
        embeds: [embed],
    });
};

export const config: SlashSubcommand["config"] = {
    permissions: [],
};