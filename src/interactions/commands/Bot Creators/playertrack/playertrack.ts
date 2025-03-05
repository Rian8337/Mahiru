import { Constants } from "@core/Constants";
import {
    ApplicationCommandOptionType,
    ApplicationIntegrationType,
    InteractionContextType,
} from "discord.js";
import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { NumberHelper } from "@utils/helpers/NumberHelper";
import { PlayertrackLocalization } from "@localization/interactions/commands/Bot Creators/playertrack/PlayertrackLocalization";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashCommand["run"] = async (_, interaction) => {
    const localization = new PlayertrackLocalization(
        CommandHelper.getLocale(interaction)
    );

    const uid = interaction.options.getInteger("uid", true);

    if (
        !NumberHelper.isNumberInRange(
            uid,
            Constants.uidMinLimit,
            Constants.uidMaxLimit,
            true
        )
    ) {
        return InteractionHelper.reply(interaction, {
            content: localization.getTranslation("incorrectUid"),
        });
    }

    CommandHelper.runSlashSubcommandFromInteraction(interaction);
};

export const category: SlashCommand["category"] = CommandCategory.botCreators;

export const config: SlashCommand["config"] = {
    name: "playertrack",
    description: "Manages the player tracking function.",
    options: [
        {
            name: "add",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Adds a player into the tracking list.",
            options: [
                {
                    name: "uid",
                    required: true,
                    type: ApplicationCommandOptionType.Integer,
                    description: "The uid of the player.",
                    minValue: Constants.uidMinLimit,
                },
            ],
        },
        {
            name: "delete",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Deletes a player from the tracking list.",
            options: [
                {
                    name: "uid",
                    required: true,
                    type: ApplicationCommandOptionType.Integer,
                    description: "The uid of the player.",
                    minValue: Constants.uidMinLimit,
                },
            ],
        },
    ],
    example: [
        {
            command: "playertrack add uid:51076",
            description: "will add uid 51076 into player tracking list.",
        },
    ],
    permissions: ["BotOwner"],
    contexts: [InteractionContextType.Guild],
    integrationTypes: [ApplicationIntegrationType.UserInstall],
};
