import { AccountTransferLocalization } from "@localization/interactions/commands/osu! and osu!droid/accounttransfer/AccountTransferLocalization";
import { SlashSubcommand } from "@structures/core/SlashSubcommand";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { GuildMember } from "discord.js";

export const run: SlashSubcommand["run"] = async (_, interaction) => {
    const localization = new AccountTransferLocalization(
        CommandHelper.getLocale(interaction),
    );

    InteractionHelper.reply(interaction, {
        embeds: [
            EmbedCreator.createNormalEmbed({
                author: interaction.user,
                color: (<GuildMember | null>interaction.member)?.displayColor,
            })
                .setTitle(localization.getTranslation("aboutEmbedTitle"))
                .setDescription(
                    [
                        localization.getTranslation("aboutEmbedDescription1"),
                        localization.getTranslation("aboutEmbedDescription2"),
                        localization.getTranslation("aboutEmbedDescription3"),
                        localization.getTranslation("aboutEmbedDescription4"),
                    ].join("\n\n"),
                ),
        ],
    });
};

export const config: SlashSubcommand["config"] = {
    permissions: [],
};
