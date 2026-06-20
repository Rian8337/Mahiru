import { CommandCategory } from "@enums/core/CommandCategory";
import { RoleColorType } from "@enums/interactions/RoleColorType";
import { SlashCommand } from "@structures/core/SlashCommand";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import {
    ApplicationCommandOptionType,
    ApplicationIntegrationType,
} from "discord.js";

export const run: SlashCommand["run"] = async (client, interaction) => {
    CommandHelper.runSlashSubcommandFromInteraction(interaction);
};

export const category: SlashCommand["category"] = CommandCategory.tools;

export const config: SlashCommand["config"] = {
    name: "booster",
    description: "Manages booster roles.",
    options: [
        {
            name: "claim",
            description:
                "Claim your booster role. As of now, only 20 boosters can claim their booster role.",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "color",
            description: "Change your booster role's color.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "type",
                    description: "The type of color to set.",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        {
                            name: "Solid",
                            value: RoleColorType.Solid,
                        },
                        {
                            name: "Gradient",
                            value: RoleColorType.Gradient,
                        },
                        {
                            name: "Holographic",
                            value: RoleColorType.Holographic,
                        },
                    ],
                },
                {
                    name: "primarycolor",
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The primary color to set. Required for solid and gradient types.",
                },
                {
                    name: "secondarycolor",
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The secondary color to set. Required for gradient type.",
                },
            ],
        },
        {
            name: "icon",
            description: "Change your booster role's icon to a server emoji.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "emoji",
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The name of the server emoji to set as the icon.",
                    autocomplete: true,
                },
            ],
        },
        {
            name: "name",
            description: "Change your booster role's name.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "name",
                    type: ApplicationCommandOptionType.String,
                    description: "The new name for your booster role.",
                    required: true,
                    maxLength: 100,
                },
            ],
        },
        {
            name: "remove",
            description: "Remove your booster role.",
            type: ApplicationCommandOptionType.Subcommand,
        },
    ],
    example: [],
    integrationTypes: [ApplicationIntegrationType.GuildInstall],
    replyEphemeral: true,
};
