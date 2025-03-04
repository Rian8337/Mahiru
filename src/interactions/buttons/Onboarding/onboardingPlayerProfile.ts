import { Symbols } from "@enums/utils/Symbols";
import { OnboardingPlayerProfileLocalization } from "@localization/interactions/buttons/Onboarding/onboardingPlayerProfile/OnboardingPlayerProfileLocalization";
import { ButtonCommand } from "@structures/core/ButtonCommand";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { createOnboardingNavigationRows } from "@utils/creators/OnboardingNavigationRowCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    quote,
} from "discord.js";

export const run: ButtonCommand["run"] = async (_, interaction) => {
    const language = CommandHelper.getLocale(interaction);
    const localization = new OnboardingPlayerProfileLocalization(language);

    const embed = EmbedCreator.createNormalEmbed({
        author: interaction.user,
        color: "Gold",
    });

    embed
        .setTitle(localization.getTranslation("embedTitle"))
        .setDescription(
            localization.getTranslation("playerProfileIntroduction") +
                "\n\n" +
                localization.getTranslation("playerProfileConstraint") +
                "\n\n" +
                quote(localization.getTranslation("accountRegistrationQuote")) +
                "\n\n" +
                localization.getTranslation("profileCommandExplanation") +
                "\n\n" +
                quote(localization.getTranslation("commandInBotGroundQuote")) +
                "\n\n" +
                quote(
                    localization.getTranslation("accountBindConvenienceQuote"),
                ) +
                "\n\n" +
                localization.getTranslation("tryCommandForBindedAccount"),
        );

    const row = new ActionRowBuilder<ButtonBuilder>();

    row.addComponents(
        new ButtonBuilder()
            .setCustomId("onboardingPlayerProfileAction")
            .setEmoji(Symbols.framedPicture)
            .setStyle(ButtonStyle.Primary)
            .setLabel(localization.getTranslation("showOwnProfile")),
    );

    InteractionHelper.update(interaction, {
        embeds: [embed],
        components: [
            ...createOnboardingNavigationRows(interaction.customId, language),
            row,
        ],
    });
};

export const config: ButtonCommand["config"] = {
    replyEphemeral: true,
    instantDeferInDebug: false,
};
