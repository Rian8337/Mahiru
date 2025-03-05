import { ApplicationCommandOptionType } from "discord.js";
import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { Constants } from "@core/Constants";

export const run: SlashCommand["run"] = async (_, interaction) => {
    CommandHelper.runSlashSubcommandOrGroup(interaction);
};

export const category: SlashCommand["category"] = CommandCategory.osu;

export const config: SlashCommand["config"] = {
    name: "profile",
    description: "Main command for osu!droid account profile.",
    options: [
        {
            name: "bindinfo",
            type: ApplicationCommandOptionType.Subcommand,
            description: "View your bind information or an osu!droid account.",
            options: [
                {
                    name: "uid",
                    type: ApplicationCommandOptionType.Integer,
                    description: "The uid of the osu!droid account.",
                    minValue: Constants.uidMinLimit,
                },
                {
                    name: "username",
                    type: ApplicationCommandOptionType.String,
                    description: "The username of the osu!droid account.",
                    minLength: 2,
                    maxLength: 20,
                    autocomplete: true,
                },
                {
                    name: "user",
                    type: ApplicationCommandOptionType.User,
                    description: "The Discord user.",
                },
            ],
        },
        {
            name: "customize",
            type: ApplicationCommandOptionType.SubcommandGroup,
            description: "Customize your profile card.",
            options: [
                {
                    name: "background",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Customize your profile card's background.",
                },
                {
                    name: "badge",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Customize your profile card's badge.",
                },
                {
                    name: "infobox",
                    type: ApplicationCommandOptionType.Subcommand,
                    description:
                        "Customize your profile card's information box.",
                },
            ],
        },
        {
            name: "restoreaccount",
            type: ApplicationCommandOptionType.Subcommand,
            description:
                "Gives the credentials of your bound osu!droid accounts that were deleted in the deletion incident.",
        },
        {
            name: "view",
            type: ApplicationCommandOptionType.Subcommand,
            description:
                "View your osu!droid account's profile or someone else's.",
            options: [
                {
                    name: "uid",
                    type: ApplicationCommandOptionType.Integer,
                    description: "The uid of the osu!droid account.",
                    minValue: Constants.uidMinLimit,
                },
                {
                    name: "username",
                    type: ApplicationCommandOptionType.String,
                    description: "The username of the osu!droid account.",
                    minLength: 2,
                    maxLength: 20,
                    autocomplete: true,
                },
                {
                    name: "user",
                    type: ApplicationCommandOptionType.User,
                    description: "The Discord user.",
                },
                {
                    name: "type",
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The type of the profile to show. Defaults to simplified.",
                    choices: [
                        {
                            name: "Simplified Profile",
                            value: "simplified",
                        },
                        {
                            name: "Detailed Profile",
                            value: "detailed",
                        },
                    ],
                },
                {
                    name: "showhashedemail",
                    type: ApplicationCommandOptionType.Boolean,
                    description:
                        "Whether to display the hashed email of the osu!droid account if you own the account.",
                },
            ],
        },
    ],
    example: [
        {
            command: "profile view",
            description:
                "will view your currently bound osu!droid account's profile.",
        },
        {
            command: "profile bindinfo",
            arguments: [
                {
                    name: "user",
                    value: "@Rian8337#0001",
                },
            ],
            description: "will view Rian8337's bind information.",
        },
        {
            command: "profile view",
            arguments: [
                {
                    name: "user",
                    value: "132783516176875520",
                },
            ],
            description:
                "will view the currently bound osu!droid account's profile of the user with that Discord ID.",
        },
        {
            command: "profile bindinfo",
            arguments: [
                {
                    name: "username",
                    value: "dgsrz",
                },
            ],
            description:
                "will view the bind information of the osu!droid account with that username.",
        },
        {
            command: "profile view",
            arguments: [
                {
                    name: "uid",
                    value: 11678,
                },
            ],
            description: "will view that uid's profile.",
        },
    ],
    cooldown: 10,
};
