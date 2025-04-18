import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { ProfileLocalization } from "@localization/interactions/commands/osu! and osu!droid/profile/ProfileLocalization";
import { CommandHelper } from "@utils/helpers/CommandHelper";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization: ProfileLocalization = new ProfileLocalization(
        CommandHelper.getLocale(interaction),
    );

    CommandHelper.runSlashSubcommandNotFromInteraction(
        interaction,
        __dirname,
        [
            {
                label: localization.getTranslation("showBadgeTemplateLabel"),
                value: "showBadgeTemplate",
                description: localization.getTranslation(
                    "showBadgeTemplateDescription",
                ),
            },
            {
                label: localization.getTranslation("claimBadgeLabel"),
                value: "claimBadge",
                description: localization.getTranslation(
                    "claimBadgeDescription",
                ),
            },
            {
                label: localization.getTranslation("equipBadgeLabel"),
                value: "equipBadge",
                description: localization.getTranslation(
                    "equipBadgeDescription",
                ),
            },
            {
                label: localization.getTranslation("unequipBadgeLabel"),
                value: "unequipBadge",
                description: localization.getTranslation(
                    "unequipBadgeDescription",
                ),
            },
            {
                label: localization.getTranslation("listBadgeLabel"),
                value: "listBadges",
                description: localization.getTranslation(
                    "listBadgeDescription",
                ),
            },
        ],
        localization.getTranslation("customizationPlaceholder"),
    );
};
