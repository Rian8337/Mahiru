import { ApplicationCommandOptionType } from "discord.js";
import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { Constants } from "@core/Constants";

export const run: SlashCommand["run"] = async (_, interaction) => {
    CommandHelper.runSlashSubcommandFromInteraction(interaction);
};

export const category: SlashCommand["category"] = CommandCategory.osu;

export const config: SlashCommand["config"] = {
    name: "recalc",
    description:
        "The main command for prototype droid performance points (dpp) recalculation system.",
    options: [
        {
            name: "calculate",
            type: ApplicationCommandOptionType.Subcommand,
            description:
                "Recalculates a user as prototype droid performance points (dpp).",
            options: [
                {
                    name: "reworktype",
                    type: ApplicationCommandOptionType.String,
                    description: "The rework type of the prototype.",
                    required: true,
                    autocomplete: true,
                },
                {
                    name: "user",
                    type: ApplicationCommandOptionType.User,
                    description: "The user to recalculate.",
                },
                {
                    name: "uid",
                    type: ApplicationCommandOptionType.Integer,
                    description: "The uid of the user.",
                    minValue: Constants.uidMinLimit,
                },
                {
                    name: "username",
                    type: ApplicationCommandOptionType.String,
                    description: "The username of the user.",
                    minLength: 2,
                    maxLength: 20,
                    autocomplete: true,
                },
            ],
        },
        {
            name: "calculateall",
            type: ApplicationCommandOptionType.Subcommand,
            description:
                "Recalculates all players in the current prototype droid performance points (dpp) system.",
            options: [
                {
                    name: "reworktype",
                    type: ApplicationCommandOptionType.String,
                    description: "The rework type of the prototype.",
                    required: true,
                    autocomplete: true,
                },
                {
                    name: "reworkname",
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The name of the rework. Required for new reworks.",
                },
                {
                    name: "resetprogress",
                    type: ApplicationCommandOptionType.Boolean,
                    description:
                        "Whether to reset the progress of the previous recalculation.",
                },
            ],
        },
        {
            name: "queue",
            description: "Displays the current recalculation queue.",
            type: ApplicationCommandOptionType.Subcommand,
        },
    ],
    example: [
        {
            command: "recalc calculateall",
            arguments: [],
            description:
                "will recalculate all scores of all users in the prototype droid performance points (dpp) system.",
        },
        {
            command: "recalc calculate",
            arguments: [
                {
                    name: "user",
                    value: "@Rian8337#0001",
                },
            ],
            description: "will recalculate Rian8337's scores.",
        },
        {
            command: "recalc queue",
            arguments: [],
            description: "will display the current recalculation queue.",
        },
    ],
    permissions: ["Special"],
};
