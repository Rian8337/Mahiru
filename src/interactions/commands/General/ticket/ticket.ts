import { CommandCategory } from "@enums/core/CommandCategory";
import { SupportTicketStatus } from "@enums/ticket/SupportTicketStatus";
import { SlashCommand } from "@structures/core/SlashCommand";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import {
    ApplicationCommandOptionType,
    ChannelType,
    InteractionContextType,
} from "discord.js";

export const run: SlashCommand["run"] = async (_, interaction) => {
    CommandHelper.runSlashSubcommandFromInteraction(interaction);
};

export const category: SlashCommand["category"] = CommandCategory.general;

export const config: SlashCommand["config"] = {
    name: "ticket",
    description: "Primary interface of the ticket system.",
    options: [
        {
            name: "assign",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Assigns yourself to a ticket.",
            options: [
                {
                    name: "author",
                    type: ApplicationCommandOptionType.User,
                    description:
                        "The user who opened the ticket. If unspecified, will default to the ticket in the channel.",
                },
                {
                    name: "id",
                    type: ApplicationCommandOptionType.Integer,
                    minValue: 1,
                    description:
                        "The ID of the ticket. If unspecified, will default to the ticket in the channel.",
                },
            ],
        },
        {
            name: "assigned",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Lists all tickets that you are assigned to.",
            options: [
                {
                    name: "author",
                    type: ApplicationCommandOptionType.User,
                    description:
                        "The ticket author to list for. If unspecified, all ticket authors will be listed.",
                },
                {
                    name: "status",
                    type: ApplicationCommandOptionType.Integer,
                    description:
                        "The ticket status to filter for. If unspecified, no status filter is applied.",
                    choices: [
                        {
                            name: "Open",
                            value: SupportTicketStatus.open,
                        },
                        {
                            name: "Closed",
                            value: SupportTicketStatus.closed,
                        },
                    ],
                },
            ],
        },
        {
            name: "close",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Closes a ticket.",
            options: [
                {
                    name: "author",
                    type: ApplicationCommandOptionType.User,
                    description:
                        "The user who opened the ticket. If unspecified, will default to the ticket in the channel.",
                },
                {
                    name: "id",
                    type: ApplicationCommandOptionType.Integer,
                    minValue: 1,
                    description:
                        "The ID of the ticket. If unspecified, will default to the ticket in the channel.",
                },
            ],
        },
        {
            name: "create",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Creates a new ticket.",
            options: [
                {
                    name: "preset",
                    type: ApplicationCommandOptionType.String,
                    description: "The preset to use.",
                    autocomplete: true,
                },
            ],
        },
        {
            name: "edit",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Edits a ticket.",
            options: [
                {
                    name: "author",
                    type: ApplicationCommandOptionType.User,
                    description:
                        "The user who opened the ticket. If unspecified, will default to the ticket in the channel.",
                },
                {
                    name: "id",
                    type: ApplicationCommandOptionType.Integer,
                    minValue: 1,
                    description:
                        "The ID of the ticket. If unspecified, will default to the ticket in the channel.",
                },
            ],
        },
        {
            name: "list",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Lists all tickets from you or a user.",
            options: [
                {
                    name: "author",
                    type: ApplicationCommandOptionType.User,
                    description:
                        "The user who opened the ticket. Defaults to yourself.",
                },
                {
                    name: "status",
                    type: ApplicationCommandOptionType.Integer,
                    description:
                        "The ticket status to filter for. If unspecified, no status filter is applied.",
                    choices: [
                        {
                            name: "Open",
                            value: SupportTicketStatus.open,
                        },
                        {
                            name: "Closed",
                            value: SupportTicketStatus.closed,
                        },
                    ],
                },
            ],
        },
        {
            name: "move",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Moves a ticket to a channel.",
            options: [
                {
                    name: "channel",
                    required: true,
                    type: ApplicationCommandOptionType.Channel,
                    description: "The channel to move the ticket to.",
                    channelTypes: [
                        ChannelType.GuildText,
                        ChannelType.GuildForum,
                    ],
                },
                {
                    name: "author",
                    type: ApplicationCommandOptionType.User,
                    description:
                        "The user who opened the ticket. If unspecified, will default to the ticket in the channel.",
                },
                {
                    name: "id",
                    type: ApplicationCommandOptionType.Integer,
                    minValue: 1,
                    description:
                        "The ID of the ticket. If unspecified, will default to the ticket in the channel.",
                },
            ],
        },
        {
            name: "presets",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Lists all available ticket presets.",
        },
        {
            name: "reopen",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Reopens a ticket.",
            options: [
                {
                    name: "author",
                    type: ApplicationCommandOptionType.User,
                    description:
                        "The user who opened the ticket. If unspecified, will default to the ticket in the channel.",
                },
                {
                    name: "id",
                    type: ApplicationCommandOptionType.Integer,
                    minValue: 1,
                    description:
                        "The ID of the ticket. If unspecified, will default to the ticket in the channel.",
                },
            ],
        },
        {
            name: "unassign",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Unassigns a yourself from a ticket.",
            options: [
                {
                    name: "author",
                    type: ApplicationCommandOptionType.User,
                    description:
                        "The user who opened the ticket. If unspecified, will default to the ticket in the channel.",
                },
                {
                    name: "id",
                    type: ApplicationCommandOptionType.Integer,
                    minValue: 1,
                    description:
                        "The ID of the ticket. If unspecified, will default to the ticket in the channel.",
                },
            ],
        },
        {
            name: "view",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Views a ticket.",
            options: [
                {
                    name: "author",
                    type: ApplicationCommandOptionType.User,
                    description:
                        "The user who opened the ticket. If unspecified, will default to the ticket in the channel.",
                },
                {
                    name: "id",
                    type: ApplicationCommandOptionType.Integer,
                    minValue: 1,
                    description:
                        "The ID of the ticket. If unspecified, will default to the ticket in the channel.",
                },
            ],
        },
    ],
    example: [],
    contexts: [InteractionContextType.Guild],
    replyEphemeral: true,
};
