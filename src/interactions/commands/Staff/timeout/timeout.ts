import {
    ApplicationCommandOptionType,
    InteractionContextType,
} from "discord.js";
import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { CommandHelper } from "@utils/helpers/CommandHelper";

export const run: SlashCommand["run"] = async (_, interaction) => {
    CommandHelper.runSlashSubcommandFromInteraction(
        interaction,
        CommandHelper.getLocale(interaction)
    );
};

export const category: SlashCommand["category"] = CommandCategory.staff;

export const config: SlashCommand["config"] = {
    name: "timeout",
    description:
        "Main command for timeouts. This command's permission can be configured using the /settings command.",
    options: [
        {
            name: "issue",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Issues a timeout to a user.",
            options: [
                {
                    name: "user",
                    required: true,
                    type: ApplicationCommandOptionType.User,
                    description: "The user to timeout.",
                },
                {
                    name: "duration",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The timeout duration (e.g. 6:01:24:33 or 2d14h55m34s). Minimum is 30 seconds. -1 for indefinite.",
                },
                {
                    name: "reason",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description: "The reason for timeouting the user.",
                    maxLength: 1500,
                },
            ],
        },
        {
            name: "remove",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Removes a timeout from a user.",
            options: [
                {
                    name: "user",
                    required: true,
                    type: ApplicationCommandOptionType.User,
                    description: "The user whose timeout is to be removed.",
                },
                {
                    name: "reason",
                    type: ApplicationCommandOptionType.String,
                    description: "The reason for removing the timeout.",
                    maxLength: 1500,
                },
            ],
        },
    ],
    example: [
        {
            command: "timeout issue",
            arguments: [
                {
                    name: "user",
                    value: "132783516176875520",
                },
                {
                    name: "duration",
                    value: "2h",
                },
                {
                    name: "reason",
                    value: "bad",
                },
            ],
            description:
                'will timeout the user with that Discord ID for 2 hours with reason "bad".',
        },
        {
            command: "timeout remove",
            arguments: [
                {
                    name: "user",
                    value: "@Rian8337#0001",
                },
                {
                    name: "reason",
                    value: "boo",
                },
            ],
            description: 'will untimeout Rian8337 for "boo".',
        },
    ],
    permissions: ["Special"],
    contexts: [InteractionContextType.Guild],
    replyEphemeral: true,
};
