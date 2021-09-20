import { CommandArgumentType } from "@alice-enums/core/CommandArgumentType";
import { CommandCategory } from "@alice-enums/core/CommandCategory";
import { Command } from "@alice-interfaces/core/Command";
import { CommandHelper } from "@alice-utils/helpers/CommandHelper";

export const run: Command["run"] = async (_, interaction) => {
    CommandHelper.runSubcommandOrGroup(interaction);
};

export const category: Command["category"] = CommandCategory.OSU;

export const config: Command["config"] = {
    name: "profile",
    description: "Main command for osu!droid account profile.",
    options: [
        {
            name: "bindinfo",
            type: CommandArgumentType.SUB_COMMAND,
            description: "View your bind information or an osu!droid account.",
            options: [
                {
                    name: "uid",
                    type: CommandArgumentType.INTEGER,
                    description: "The uid of the osu!droid account."
                },
                {
                    name: "username",
                    type: CommandArgumentType.STRING,
                    description: "The username the osu!droid account."
                },
                {
                    name: "user",
                    type: CommandArgumentType.USER,
                    description: "The Discord user."
                }
            ]
        },
        {
            name: "view",
            type: CommandArgumentType.SUB_COMMAND,
            description: "View your osu!droid account's profile or someone else's.",
            options: [
                {
                    name: "uid",
                    type: CommandArgumentType.INTEGER,
                    description: "The uid of the osu!droid account."
                },
                {
                    name: "username",
                    type: CommandArgumentType.STRING,
                    description: "The username the osu!droid account."
                },
                {
                    name: "user",
                    type: CommandArgumentType.USER,
                    description: "The Discord user."
                }
            ]
        },
        {
            name: "customize",
            type: CommandArgumentType.SUB_COMMAND_GROUP,
            description: "Customize your profile card.",
            options: [
                {
                    name: "background",
                    type: CommandArgumentType.SUB_COMMAND,
                    description: "Customize your profile card's background."
                },
                {
                    name: "badge",
                    type: CommandArgumentType.SUB_COMMAND,
                    description: "Customize your profile card's badge."
                },
                {
                    name: "infobox",
                    type: CommandArgumentType.SUB_COMMAND,
                    description: "Customize your profile card's information box."
                }
            ]
        }
    ],
    example: [
        {
            command: "profile view",
            description: "will view your currently binded osu!droid account's profile."
        },
        {
            command: "profile bindinfo",
            arguments: [
                {
                    name: "user",
                    value: "@Rian8337#0001"
                }
            ],
            description: "will view Rian8337's bind information."
        },
        {
            command: "profile view",
            arguments: [
                {
                    name: "user",
                    value: "132783516176875520"
                }
            ],
            description: "will view the currently binded osu!droid account's profile of the user with that Discord ID."
        },
        {
            command: "profile bindinfo",
            arguments: [
                {
                    name: "username",
                    value: "dgsrz"
                }
            ],
            description: "will view the bind information of the osu!droid account with that username."
        },
        {
            command: "profile view",
            arguments: [
                {
                    name: "uid",
                    value: 11678
                }
            ],
            description: "will view that uid's profile."
        }
    ],
    cooldown: 10,
    permissions: [],
    scope: "ALL"
};