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
    name: "namechange",
    description: "Main command for osu!droid username change.",
    options: [
        {
            name: "change",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Changes your bound osu!droid account's username.",
            options: [
                {
                    name: "username",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The username to change to. Cannot contain unicode characters.",
                    minLength: 2,
                    maxLength: 20,
                },
            ],
        },
        {
            name: "history",
            type: ApplicationCommandOptionType.Subcommand,
            description:
                "Views the name change history of an osu!droid account.",
            options: [
                {
                    name: "uid",
                    required: true,
                    type: ApplicationCommandOptionType.Integer,
                    description: "The uid of the osu!droid account.",
                    minValue: Constants.uidMinLimit,
                },
            ],
        },
    ],
    example: [
        {
            command: "namechange change",
            arguments: [
                {
                    name: "newusername",
                    value: "deni123",
                },
            ],
            description:
                'will change your bound osu!droid account\'s username "deni123".',
        },
    ],
    cooldown: 10,
};
