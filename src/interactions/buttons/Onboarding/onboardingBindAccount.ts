import { Symbols } from "@alice-enums/utils/Symbols";
import { OnboardingBindAccountLocalization } from "@alice-localization/interactions/buttons/Onboarding/onboardingBindAccount/OnboardingBindAccountLocalization";
import { ButtonCommand } from "@alice-structures/core/ButtonCommand";
import { EmbedCreator } from "@alice-utils/creators/EmbedCreator";
import { CommandHelper } from "@alice-utils/helpers/CommandHelper";
import { InteractionHelper } from "@alice-utils/helpers/InteractionHelper";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    quote,
} from "discord.js";

export const run: ButtonCommand["run"] = async (_, interaction) => {
    const localization: OnboardingBindAccountLocalization =
        new OnboardingBindAccountLocalization(
            await CommandHelper.getLocale(interaction)
        );

    const embed: EmbedBuilder = EmbedCreator.createNormalEmbed({
        author: interaction.user,
        color: "Blurple",
    });

    embed
        .setTitle(localization.getTranslation("bindAccountEmbedTitle"))
        .setDescription(
            localization.getTranslation("bindingDefinition") +
                "\n\n" +
                localization.getTranslation("bindingRequirement") +
                "\n\n" +
                quote(localization.getTranslation("accountRegistrationQuote")) +
                "\n\n" +
                localization.getTranslation("bindingConstraints") +
                "\n\n" +
                localization.getTranslation("bindingProcedure") +
                "\n\n" +
                localization.getTranslation("furtherBindQuote")
        );

    const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder();

    row.addComponents(
        new ButtonBuilder()
            .setCustomId("onboardingBindAccountAction")
            .setEmoji(Symbols.lockWithKey)
            .setStyle(ButtonStyle.Primary)
            .setLabel(localization.getTranslation("bindAccountEmbedTitle"))
    );

    InteractionHelper.reply(interaction, {
        embeds: [embed],
        components: [row],
    });
};

export const config: ButtonCommand["config"] = {
    replyEphemeral: true,
};