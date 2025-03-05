import { Constants } from "@core/Constants";
import {
    ApplicationCommandOptionType,
    InteractionContextType,
} from "discord.js";
import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { ClanLocalization } from "@localization/interactions/commands/osu! and osu!droid/clan/ClanLocalization";
import { Language } from "@localization/base/Language";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashCommand["run"] = async (_, interaction) => {
    const language = CommandHelper.getLocale(interaction);

    if (interaction.guildId! !== Constants.mainServer) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                new ClanLocalization(language).getTranslation("notInMainGuild")
            ),
        });
    }

    CommandHelper.runSlashSubcommandOrGroup(interaction, language);
};

export const category: SlashCommand["category"] = CommandCategory.osu;

export const config: SlashCommand["config"] = {
    name: "clan",
    description: "Main command for clans.",
    options: [
        {
            name: "about",
            type: ApplicationCommandOptionType.Subcommand,
            description: "About clans.",
        },
        {
            name: "accept",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Accepts a user to your clan.",
            options: [
                {
                    name: "user",
                    required: true,
                    type: ApplicationCommandOptionType.User,
                    description: "The user to accept.",
                },
            ],
        },
        {
            name: "announce",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Announces a message for your clan members.",
        },
        {
            name: "auction",
            type: ApplicationCommandOptionType.SubcommandGroup,
            description: "Main point of clan auctions.",
            options: [
                {
                    name: "bid",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Bids to an ongoing auction.",
                    options: [
                        {
                            name: "name",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description:
                                "The name of the auction. Must be less than 20 characters.",
                            maxLength: 20,
                        },
                        {
                            name: "amount",
                            required: true,
                            type: ApplicationCommandOptionType.Integer,
                            description: "The amount of Mahiru coins to bid.",
                            minValue: 0,
                        },
                    ],
                },
                {
                    name: "cancel",
                    type: ApplicationCommandOptionType.Subcommand,
                    description:
                        "Cancels an auction, provided that no one has bid to it.",
                    options: [
                        {
                            name: "name",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The name of the auction.",
                            maxLength: 20,
                        },
                    ],
                },
                {
                    name: "create",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Creates an auction.",
                    options: [
                        {
                            name: "name",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The name of the auction.",
                            maxLength: 20,
                        },
                        {
                            name: "powerup",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The powerup to be auctioned.",
                        },
                        {
                            name: "amount",
                            required: true,
                            type: ApplicationCommandOptionType.Integer,
                            description:
                                "The amount of powerups to be auctioned.",
                            minValue: 0,
                        },
                        {
                            name: "minimumbidamount",
                            required: true,
                            type: ApplicationCommandOptionType.Integer,
                            description:
                                "The minimum bid amount for the auction.",
                            minValue: 0,
                        },
                        {
                            name: "duration",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description:
                                "The duration of the auction in time format (e.g. 6:01:24:33 or 2d14h55m34s), from 1 minute to 1 day.",
                        },
                    ],
                },
                {
                    name: "list",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Lists all active auctions.",
                    options: [
                        {
                            name: "page",
                            type: ApplicationCommandOptionType.Integer,
                            description: "The page to view. Defaults to 1.",
                            minValue: 1,
                        },
                    ],
                },
                {
                    name: "status",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Checks the status of an auction.",
                    options: [
                        {
                            name: "name",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The name of the auction.",
                            maxLength: 20,
                        },
                    ],
                },
            ],
        },
        {
            name: "banner",
            type: ApplicationCommandOptionType.SubcommandGroup,
            description: "Modifies a clan's banner.",
            options: [
                {
                    name: "set",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Sets your clan's banner.",
                    options: [
                        {
                            name: "attachment",
                            required: true,
                            type: ApplicationCommandOptionType.Attachment,
                            description: "The clan banner.",
                        },
                    ],
                },
                {
                    name: "unset",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Unsets a clan's banner.",
                    options: [
                        {
                            name: "name",
                            type: ApplicationCommandOptionType.String,
                            description:
                                "The name of the clan. Defaults to your own clan.",
                        },
                    ],
                },
            ],
        },
        {
            name: "cooldown",
            type: ApplicationCommandOptionType.Subcommand,
            description:
                "Displays cooldown-related informations such as battle cooldown and join cooldown.",
            options: [
                {
                    name: "type",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description: "The cooldown type.",
                    choices: [
                        {
                            name: "Battle Cooldown",
                            value: "battle",
                        },
                        {
                            name: "Joining Cooldown",
                            value: "join",
                        },
                    ],
                },
                {
                    name: "user",
                    type: ApplicationCommandOptionType.User,
                    description: "The user to display. Defaults to yourself.",
                },
            ],
        },
        {
            name: "create",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Creates a clan.",
            options: [
                {
                    name: "name",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The name of the clan. Cannot contain unicode characters.",
                    maxLength: 25,
                },
            ],
        },
        {
            name: "demote",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Demotes a clan member from co-leader.",
            options: [
                {
                    name: "member",
                    required: true,
                    type: ApplicationCommandOptionType.User,
                    description: "The clan member to demote.",
                },
            ],
        },
        {
            name: "disband",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Disbands a clan.",
            options: [
                {
                    name: "name",
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The name of the clan. Defaults to your own clan.",
                    maxLength: 25,
                },
            ],
        },
        {
            name: "description",
            type: ApplicationCommandOptionType.SubcommandGroup,
            description: "Modifies a clan's description.",
            options: [
                {
                    name: "clear",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Clears the description of a clan.",
                    options: [
                        {
                            name: "clan",
                            type: ApplicationCommandOptionType.String,
                            description:
                                "The name of the clan. Defaults to your own clan.",
                            maxLength: 25,
                        },
                    ],
                },
                {
                    name: "edit",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Edits the description of a clan.",
                    options: [
                        {
                            name: "description",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description:
                                "The new description. Must be less than 2000 characters.",
                        },
                        {
                            name: "name",
                            type: ApplicationCommandOptionType.String,
                            description:
                                "The name of the clan. Defaults to your own clan.",
                            maxLength: 25,
                        },
                    ],
                },
            ],
        },
        {
            name: "icon",
            type: ApplicationCommandOptionType.SubcommandGroup,
            description: "Modifies a clan's icon.",
            options: [
                {
                    name: "set",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Sets your clan's icon.",
                    options: [
                        {
                            name: "attachment",
                            required: true,
                            type: ApplicationCommandOptionType.Attachment,
                            description: "The new clan icon.",
                        },
                    ],
                },
                {
                    name: "unset",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Unsets a clan's icon.",
                    options: [
                        {
                            name: "name",
                            type: ApplicationCommandOptionType.String,
                            description:
                                "The name of the clan. Defaults to your own clan.",
                            maxLength: 25,
                        },
                    ],
                },
            ],
        },
        {
            name: "info",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Views the info of a clan.",
            options: [
                {
                    name: "name",
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The name of the clan. Defaults to your own clan, if any.",
                    maxLength: 25,
                },
            ],
        },
        {
            name: "kick",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Kicks a clan member from your clan.",
            options: [
                {
                    name: "member",
                    required: true,
                    type: ApplicationCommandOptionType.User,
                    description: "The clan member to kick.",
                },
                {
                    name: "name",
                    type: ApplicationCommandOptionType.String,
                    description: "The name of the clan.",
                    maxLength: 25,
                },
            ],
        },
        {
            name: "leaderboard",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Views the clan leaderboard.",
            options: [
                {
                    name: "page",
                    type: ApplicationCommandOptionType.Integer,
                    description: "The page to view. Defaults to 1.",
                    minValue: 1,
                },
            ],
        },
        {
            name: "leave",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Leaves your current clan.",
        },
        {
            name: "match",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Sets the match mode of a clan.",
            options: [
                {
                    name: "name",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description: "The name of the clan.",
                    maxLength: 25,
                },
                {
                    name: "ismatchmode",
                    required: true,
                    type: ApplicationCommandOptionType.Boolean,
                    description: "Whether the clan is in match mode.",
                },
            ],
        },
        {
            name: "members",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Views the members of a clan.",
            options: [
                {
                    name: "name",
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The name of the clan. Defaults to your own clan, if any.",
                    maxLength: 25,
                },
            ],
        },
        {
            name: "power",
            type: ApplicationCommandOptionType.SubcommandGroup,
            description: "Manages clan power.",
            options: [
                {
                    name: "give",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Gives clan power to a clan.",
                    options: [
                        {
                            name: "name",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The name of the clan.",
                            maxLength: 25,
                        },
                        {
                            name: "amount",
                            required: true,
                            type: ApplicationCommandOptionType.Integer,
                            description: "The amount of power to give.",
                            minValue: 0,
                        },
                    ],
                },
                {
                    name: "take",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Takes clan power from a clan.",
                    options: [
                        {
                            name: "name",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The name of the clan.",
                            maxLength: 25,
                        },
                        {
                            name: "amount",
                            required: true,
                            type: ApplicationCommandOptionType.Integer,
                            description: "The amount of power to take.",
                            minValue: 0,
                        },
                    ],
                },
                {
                    name: "transfer",
                    type: ApplicationCommandOptionType.Subcommand,
                    description:
                        "Transfers clan power from one clan to another. Used after completing a clan battle.",
                    options: [
                        {
                            name: "fromclan",
                            required: true,
                            type: ApplicationCommandOptionType.User,
                            description:
                                "The member of the clan to transfer clan power from.",
                        },
                        {
                            name: "toclan",
                            required: true,
                            type: ApplicationCommandOptionType.User,
                            description:
                                "The member of the clan to transfer clan power to.",
                        },
                        {
                            name: "challengepassed",
                            type: ApplicationCommandOptionType.Boolean,
                            description:
                                "Whether the winning clan passed the challenge given by the losing clan.",
                        },
                    ],
                },
            ],
        },
        {
            name: "powerup",
            type: ApplicationCommandOptionType.SubcommandGroup,
            description: "Manages your clan's powerups.",
            options: [
                {
                    name: "activate",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Activates a powerup.",
                    options: [
                        {
                            name: "name",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The name of the powerup.",
                        },
                    ],
                },
                {
                    name: "activelist",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Lists your clan's active powerups.",
                },
                {
                    name: "list",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Lists your clan's powerups.",
                },
            ],
        },
        {
            name: "promote",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Promotes a clan member to co-leader.",
            options: [
                {
                    name: "member",
                    required: true,
                    type: ApplicationCommandOptionType.User,
                    description: "The clan member to promote.",
                },
            ],
        },
        {
            name: "role",
            type: ApplicationCommandOptionType.SubcommandGroup,
            description: "Manages your clan role.",
            options: [
                {
                    name: "seticon",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Sets or clears your clan role's icon.",
                    options: [
                        {
                            name: "attachment",
                            type: ApplicationCommandOptionType.Attachment,
                            description:
                                "The new clan role icon. Omit to clear the icon.",
                        },
                    ],
                },
                {
                    name: "setcolor",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Sets or clears your clan role's color.",
                    options: [
                        {
                            name: "color",
                            type: ApplicationCommandOptionType.String,
                            description:
                                "The new color of the role. Must be a hex code. Omit to clear the color.",
                        },
                    ],
                },
            ],
        },
        {
            name: "shop",
            type: ApplicationCommandOptionType.SubcommandGroup,
            description: "Main point of clan shop.",
            options: [
                {
                    name: "channel",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Buys a text channel for your clan.",
                },
                {
                    name: "powerup",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Buys powerups for your clan.",
                },
                {
                    name: "rename",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Renames your clan.",
                    options: [
                        {
                            name: "name",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The new name of your clan.",
                            maxLength: 25,
                        },
                    ],
                },
                {
                    name: "role",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Buys a custom role for your clan.",
                },
                {
                    name: "rolecolor",
                    type: ApplicationCommandOptionType.Subcommand,
                    description:
                        "Unlocks the ability to change your clan role's color.",
                },
                {
                    name: "roleicon",
                    type: ApplicationCommandOptionType.Subcommand,
                    description:
                        "Unlocks the ability to change your clan role's icon.",
                },
                {
                    name: "special",
                    type: ApplicationCommandOptionType.Subcommand,
                    description:
                        "A shop section specifically for special events.",
                },
                {
                    name: "transferleader",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Transfers clan leadership to a clan member.",
                    options: [
                        {
                            name: "member",
                            required: true,
                            type: ApplicationCommandOptionType.User,
                            description:
                                "The clan member to transfer leadership to.",
                        },
                    ],
                },
            ],
        },
        {
            name: "upkeep",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Views the weekly uptime pickup of your clan.",
        },
    ],
    example: [],
    contexts: [InteractionContextType.Guild],
};
