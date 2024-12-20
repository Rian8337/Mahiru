import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { ClanLocalization } from "@localization/interactions/commands/osu! and osu!droid/clan/ClanLocalization";
import { ModalCreator } from "@utils/creators/ModalCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { TextInputBuilder, TextInputStyle } from "discord.js";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization: ClanLocalization = new ClanLocalization(
        CommandHelper.getLocale(interaction),
    );

    ModalCreator.createModal(
        interaction,
        "clan-announce",
        localization.getTranslation("announceModalTitle"),
        new TextInputBuilder()
            .setCustomId("message")
            .setRequired(true)
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(1750)
            .setLabel(localization.getTranslation("announceModalMessageLabel"))
            .setPlaceholder(
                localization.getTranslation("announceModalMessagePlaceholder"),
            ),
    );
};

export const config: SlashSubcommand["config"] = {
    instantDeferInDebug: false,
};
