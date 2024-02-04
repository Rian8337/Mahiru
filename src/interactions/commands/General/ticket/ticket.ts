import { CommandCategory } from "@alice-enums/core/CommandCategory";
import { SupportTicketStatus } from "@alice-enums/ticket/SupportTicketStatus";
import { SlashCommand } from "@alice-structures/core/SlashCommand";
import { CommandHelper } from "@alice-utils/helpers/CommandHelper";
import { ApplicationCommandOptionType, ChannelType } from "discord.js";

export const run: SlashCommand["run"] = async (_, interaction) => {
    CommandHelper.runSlashSubcommandFromInteraction(
        interaction,
        await CommandHelper.getLocale(interaction),
    );
};

export const category: SlashCommand["category"] = CommandCategory.general;

export const config: SlashCommand["config"] = {
    name: "ticket",
    description: "Primary interface of the ticket system.",
    options: [
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
                        "The user who originally opened the ticket. If unspecified, will default to the ticket in the channel.",
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
            name: "reopen",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Reopens a ticket.",
            options: [
                {
                    name: "author",
                    type: ApplicationCommandOptionType.User,
                    description:
                        "The user who originally opened the ticket. If unspecified, will default to the ticket in the channel.",
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
    permissions: [],
    scope: "GUILD_CHANNEL",
    replyEphemeral: true,
};