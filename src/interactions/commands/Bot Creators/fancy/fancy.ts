import { ApplicationCommandOptionType } from "discord.js";
import { CommandCategory } from "@alice-enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { CommandHelper } from "@alice-utils/helpers/CommandHelper";

export const run: SlashCommand["run"] = async (_, interaction) => {
    CommandHelper.runSlashSubcommandOrGroup(
        interaction,
        CommandHelper.getLocale(interaction),
    );
};

export const category: SlashCommand["category"] = CommandCategory.tools;

export const config: SlashCommand["config"] = {
    name: "fancy",
    description: "Allows managing the lounge channel.",
    options: [
        {
            name: "application",
            type: ApplicationCommandOptionType.SubcommandGroup,
            description: "Commands for fancy application.",
            options: [
                {
                    name: "apply",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Applies for fancy role.",
                },
                {
                    name: "cancel",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Cancels your fancy role application.",
                },
                {
                    name: "view",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Views your fancy role application status.",
                },
            ],
        },
        {
            name: "lock",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Locks a user from the lounge channel.",
            options: [
                {
                    name: "user",
                    required: true,
                    type: ApplicationCommandOptionType.User,
                    description: "The Discord user to lock.",
                },
                {
                    name: "duration",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The duration to lock for, in time format (e.g. 6:01:24:33 or 2d14h55m34s). Use -1 to permanent lock.",
                },
                {
                    name: "reason",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description: "The reason for unlocking the user.",
                },
            ],
        },
        {
            name: "unlock",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Unlocks a user from the lounge channel.",
            options: [
                {
                    name: "user",
                    required: true,
                    type: ApplicationCommandOptionType.User,
                    description: "The Discord user to unlock.",
                },
                {
                    name: "reason",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description: "The reason for unlocking the user.",
                },
            ],
        },
    ],
    example: [
        {
            command: "fancy lock user:@Rian8337#0001",
            arguments: [
                {
                    name: "user",
                    value: "@Rian8337#0001",
                },
            ],
            description: "will lock Rian8337 from the lounge channel.",
        },
    ],
    permissions: [],
    replyEphemeral: true,
    scope: "GUILD_CHANNEL",
};
