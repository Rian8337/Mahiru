import {
    ApplicationCommandOptionType,
    InteractionContextType,
} from "discord.js";
import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { CommandHelper } from "@utils/helpers/CommandHelper";

export const run: SlashCommand["run"] = async (_, interaction) => {
    CommandHelper.runSlashSubcommandGroup(
        interaction,
        CommandHelper.getLocale(interaction),
    );
};

export const category: SlashCommand["category"] = CommandCategory.staff;

export const config: SlashCommand["config"] = {
    name: "settings",
    description: "Customizes my behavior in a server or channel.",
    options: [
        {
            name: "command",
            type: ApplicationCommandOptionType.SubcommandGroup,
            description: "Customizes settings for commands.",
            options: [
                {
                    name: "cooldown",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Sets the cooldown of a command.",
                    options: [
                        {
                            name: "command",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The command to set the cooldown for.",
                            maxLength: 32,
                        },
                        {
                            name: "duration",
                            required: true,
                            type: ApplicationCommandOptionType.Number,
                            description:
                                "The duration of the cooldown in seconds, ranging from 5 to 3600.",
                            minValue: 5,
                            maxValue: 3600,
                        },
                        {
                            name: "scope",
                            type: ApplicationCommandOptionType.String,
                            description:
                                "The scope at which to disable the command. Defaults to channel.",
                            choices: [
                                {
                                    name: "Channel",
                                    value: "channel",
                                },
                                {
                                    name: "Guild",
                                    value: "guild",
                                },
                                {
                                    name: "Global",
                                    value: "global",
                                },
                            ],
                        },
                    ],
                },
                {
                    name: "disable",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Disables a command.",
                    options: [
                        {
                            name: "command",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The command to disable.",
                            maxLength: 32,
                        },
                        {
                            name: "scope",
                            type: ApplicationCommandOptionType.String,
                            description:
                                "The scope at which to disable the command. Defaults to channel.",
                            choices: [
                                {
                                    name: "Channel",
                                    value: "channel",
                                },
                                {
                                    name: "Guild",
                                    value: "guild",
                                },
                                {
                                    name: "Global",
                                    value: "global",
                                },
                            ],
                        },
                    ],
                },
                {
                    name: "enable",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Enables a command.",
                    options: [
                        {
                            name: "command",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The command to enable.",
                            maxLength: 32,
                        },
                        {
                            name: "scope",
                            type: ApplicationCommandOptionType.String,
                            description:
                                "The scope at which to disable the command. Defaults to channel.",
                            choices: [
                                {
                                    name: "Channel",
                                    value: "channel",
                                },
                                {
                                    name: "Guild",
                                    value: "guild",
                                },
                                {
                                    name: "Global",
                                    value: "global",
                                },
                            ],
                        },
                    ],
                },
                {
                    name: "globalcooldown",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Sets a cooldown for all available commands.",
                    options: [
                        {
                            name: "duration",
                            required: true,
                            type: ApplicationCommandOptionType.Number,
                            description:
                                "The duration of the cooldown, ranging from 5 to 3600.",
                            minValue: 5,
                            maxValue: 3600,
                        },
                    ],
                },
            ],
        },
        {
            name: "utility",
            type: ApplicationCommandOptionType.SubcommandGroup,
            description: "Customizes settings for event utilities.",
            options: [
                {
                    name: "disable",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Disables an event utility.",
                    options: [
                        {
                            name: "event",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The name of the event.",
                        },
                        {
                            name: "utility",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The name of the utility.",
                        },
                        {
                            name: "scope",
                            type: ApplicationCommandOptionType.String,
                            description:
                                "The scope at which to disable the command. Defaults to channel.",
                            choices: [
                                {
                                    name: "Channel",
                                    value: "channel",
                                },
                                {
                                    name: "Guild",
                                    value: "guild",
                                },
                                {
                                    name: "Global",
                                    value: "global",
                                },
                            ],
                        },
                    ],
                },
                {
                    name: "enable",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Enables an event utility.",
                    options: [
                        {
                            name: "event",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The name of the event.",
                        },
                        {
                            name: "utility",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The name of the utility.",
                        },
                        {
                            name: "scope",
                            type: ApplicationCommandOptionType.String,
                            description:
                                "The scope at which to disable the command. Defaults to channel.",
                            choices: [
                                {
                                    name: "Channel",
                                    value: "channel",
                                },
                                {
                                    name: "Guild",
                                    value: "guild",
                                },
                                {
                                    name: "Global",
                                    value: "global",
                                },
                            ],
                        },
                    ],
                },
                {
                    name: "list",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Lists all utilities that the bot has.",
                },
            ],
        },
        {
            name: "timeoutpermission",
            type: ApplicationCommandOptionType.SubcommandGroup,
            description: "Customizes timeout permissions in a server.",
            options: [
                {
                    name: "grant",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Grants timeout permission to a role.",
                    options: [
                        {
                            name: "role",
                            required: true,
                            type: ApplicationCommandOptionType.Role,
                            description:
                                "The role to grant timeout permission to.",
                        },
                        {
                            name: "duration",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description:
                                "Maximum timeout time, in time format (e.g. 6:01:24:33 or 2d14h55m34s). Use -1 for indefinite time.",
                        },
                    ],
                },
                {
                    name: "revoke",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Revokes timeout permission from a role.",
                    options: [
                        {
                            name: "role",
                            required: true,
                            type: ApplicationCommandOptionType.Role,
                            description:
                                "The role to revoke timeout permission from.",
                        },
                    ],
                },
                {
                    name: "list",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Lists roles that have timeout permission.",
                },
            ],
        },
        {
            name: "timeoutimmunity",
            type: ApplicationCommandOptionType.SubcommandGroup,
            description: "Customizes timeout immunity settings in a server.",
            options: [
                {
                    name: "grant",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Grants timeout immunity to a role.",
                    options: [
                        {
                            name: "role",
                            required: true,
                            type: ApplicationCommandOptionType.Role,
                            description:
                                "The role to grant timeout immunity to.",
                        },
                    ],
                },
                {
                    name: "revoke",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Revokes timeout immunity from a role.",
                    options: [
                        {
                            name: "role",
                            required: true,
                            type: ApplicationCommandOptionType.Role,
                            description:
                                "The role to revoke timeout immunity from.",
                        },
                    ],
                },
                {
                    name: "list",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Lists roles that have timeout immunity.",
                },
            ],
        },
        {
            name: "punishmentlog",
            type: ApplicationCommandOptionType.SubcommandGroup,
            description: "Customizes punishment log channel in a guild.",
            options: [
                {
                    name: "set",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Sets the guild's punishment log channel.",
                    options: [
                        {
                            name: "channel",
                            required: true,
                            type: ApplicationCommandOptionType.Channel,
                            description:
                                "The text channel to set as the guild's punishment log channel.",
                        },
                    ],
                },
                {
                    name: "unset",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Unsets the guild's punishment log channel.",
                },
            ],
        },
        {
            name: "timeoutrole",
            type: ApplicationCommandOptionType.SubcommandGroup,
            description:
                "Customizes the permanent timeout role settings in a server.",
            options: [
                {
                    name: "set",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Sets the permanent timeout role.",
                    options: [
                        {
                            name: "role",
                            required: true,
                            type: ApplicationCommandOptionType.Role,
                            description:
                                "The role to set as the permanent timeout role.",
                        },
                    ],
                },
                {
                    name: "unset",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Unsets the permanent timeout role.",
                },
            ],
        },
    ],
    example: [
        {
            command: "settings punishmentlog set",
            arguments: [
                {
                    name: "channel",
                    value: "#channel",
                },
            ],
            description:
                "will set the current guild's punishment log channel to #channel.",
        },
        {
            command: "settings timeoutimmunity grant",
            arguments: [
                {
                    name: "role",
                    value: "@Moderator",
                },
            ],
            description: "will grant timeout immunity for the Moderator role.",
        },
        {
            command: "settings command cooldown",
            arguments: [
                {
                    name: "command",
                    value: "recent",
                },
                {
                    name: "duration",
                    value: "60s",
                },
            ],
            description:
                'will set the cooldown for "recent" command to 60 seconds.',
        },
    ],
    contexts: [InteractionContextType.Guild],
};
