import { OnboardingBindAccountActionLocalization } from "@localization/interactions/buttons/Onboarding/onboardingBindAccountAction/OnboardingBindAccountActionLocalization";
import { ButtonCommand } from "@structures/core/ButtonCommand";
import { ModalCreator } from "@utils/creators/ModalCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { TextInputBuilder, TextInputStyle } from "discord.js";

export const run: ButtonCommand["run"] = async (_, interaction) => {
    const localization = new OnboardingBindAccountActionLocalization(
        CommandHelper.getLocale(interaction),
    );

    ModalCreator.createModal(
        interaction,
        "onboardingAccountBind",
        localization.getTranslation("bindModalTitle"),
        new TextInputBuilder()
            .setCustomId("email")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setLabel(localization.getTranslation("bindModalEmailLabel"))
            .setPlaceholder(
                localization.getTranslation("bindModalEmailPlaceholder"),
            ),
        new TextInputBuilder()
            .setCustomId("username")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setMinLength(2)
            .setMaxLength(20)
            .setLabel(localization.getTranslation("bindModalUsernameLabel"))
            .setPlaceholder(
                localization.getTranslation("bindModalUsernamePlaceholder"),
            ),
    );
};

export const config: ButtonCommand["config"] = {
    instantDeferInDebug: false,
};
