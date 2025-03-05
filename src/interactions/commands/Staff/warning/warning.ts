import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import {
    ApplicationCommandOptionType,
    InteractionContextType,
} from "discord.js";

export const run: SlashCommand["run"] = async (_, interaction) => {
    CommandHelper.runSlashSubcommandFromInteraction(interaction);
};

export const category: CommandCategory = CommandCategory.staff;

export const config: SlashCommand["config"] = {
    name: "warning",
    description:
        "A warning system. Anyone with timeout permission can use this system.",
    options: [
        {
            name: "issue",
            description: "Issues a warning to a user.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "user",
                    required: true,
                    type: ApplicationCommandOptionType.User,
                    description: "The user to give the warning to.",
                },
                {
                    name: "validduration",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The duration this warning will stay valid, in time format (e.g. 6:01:24:33 or 2d14h55m34s). Min 3h.",
                },
                {
                    name: "points",
                    required: true,
                    type: ApplicationCommandOptionType.Integer,
                    description:
                        "The amount of warning points to be issued to the user, from 1 to 10.",
                    minValue: 1,
                    maxValue: 10,
                },
                {
                    name: "reason",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The reason for warning the user. Maximum length is 1500 characters.",
                    maxLength: 1500,
                },
            ],
        },
        {
            name: "list",
            description: "Lists the warning of a user in the current server.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "user",
                    type: ApplicationCommandOptionType.User,
                    description:
                        "The user to list the warning. Defaults to yourself.",
                },
            ],
        },
        {
            name: "transfer",
            description:
                "Transfers a user's warnings into another user in the current server.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "from",
                    required: true,
                    type: ApplicationCommandOptionType.User,
                    description: "The user to transfer warnings from.",
                },
                {
                    name: "to",
                    required: true,
                    type: ApplicationCommandOptionType.User,
                    description: "The user to transfer warnings to.",
                },
                {
                    name: "reason",
                    type: ApplicationCommandOptionType.String,
                    description: "The reason for transferring warnings.",
                },
            ],
        },
        {
            name: "unissue",
            description:
                "Unissues a warning from a user in the current server.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "id",
                    required: true,
                    type: ApplicationCommandOptionType.Integer,
                    description: "The ID of the warning.",
                    minValue: 1,
                },
                {
                    name: "reason",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The reason for unissuing the warning. Maximum length is 1500 characters.",
                    maxLength: 1500,
                },
            ],
        },
        {
            name: "view",
            description: "Views a warning in the current server.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "id",
                    required: true,
                    type: ApplicationCommandOptionType.Integer,
                    description: "The ID of the warning.",
                    minValue: 1,
                },
            ],
        },
    ],
    example: [],
    permissions: ["Special"],
    contexts: [InteractionContextType.Guild],
    replyEphemeral: true,
};
