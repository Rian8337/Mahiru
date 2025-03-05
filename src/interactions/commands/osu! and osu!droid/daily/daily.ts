import {
    ApplicationCommandOptionType,
    InteractionContextType,
} from "discord.js";
import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { Challenge } from "@database/utils/aliceDb/Challenge";
import { Constants } from "@core/Constants";

export const run: SlashCommand["run"] = async (_, interaction) => {
    CommandHelper.runSlashSubcommandOrGroup(interaction);
};

export const category: SlashCommand["category"] = CommandCategory.osu;

export const config: SlashCommand["config"] = {
    name: "daily",
    description: "Main command for daily and weekly challenges.",
    options: [
        {
            name: "about",
            type: ApplicationCommandOptionType.Subcommand,
            description:
                "All you need to know about daily and weekly challenges!",
        },
        {
            name: "bonuses",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Views bonuses for the current ongoing challenge.",
            options: [
                {
                    name: "type",
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The type of the challenge. Defaults to daily.",
                    choices: [
                        {
                            name: "Daily",
                            value: "daily",
                        },
                        {
                            name: "Weekly",
                            value: "weekly",
                        },
                    ],
                },
            ],
        },
        {
            name: "check",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Checks the current ongoing challenge.",
            options: [
                {
                    name: "type",
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The type of the challenge. Defaults to daily.",
                    choices: [
                        {
                            name: "Daily",
                            value: "daily",
                        },
                        {
                            name: "Weekly",
                            value: "weekly",
                        },
                    ],
                },
            ],
        },
        {
            name: "checksubmit",
            type: ApplicationCommandOptionType.Subcommand,
            description:
                "Checks if you, an osu!droid account, or Discord user has completed a challenge.",
            options: [
                {
                    name: "challengeid",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description: "The ID of the challenge.",
                },
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
            name: "challenges",
            type: ApplicationCommandOptionType.SubcommandGroup,
            description: "Manages challenges.",
            options: [
                {
                    name: "add",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Adds a challenge.",
                    options: [
                        {
                            name: "id",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            description: "The ID of the challenge.",
                        },
                        {
                            name: "beatmap",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            description:
                                "The beatmap ID or link that will be used in the challenge.",
                        },
                        {
                            name: "points",
                            type: ApplicationCommandOptionType.Integer,
                            required: true,
                            description:
                                "The amount of points awarded for completing the challenge.",
                            minValue: 1,
                        },
                        {
                            name: "passrequirement",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            description: "The type of the pass requirement.",
                            choices: Challenge.passCommandChoices,
                        },
                        {
                            name: "passvalue",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            description:
                                "The value that must be fulfilled to pass the challenge.",
                        },
                        {
                            name: "featured",
                            type: ApplicationCommandOptionType.User,
                            description:
                                "The user who featured the challenge. Defaults to yourself.",
                        },
                        {
                            name: "constrain",
                            type: ApplicationCommandOptionType.String,
                            description:
                                "The mods required to complete the challenge. Defaults to none.",
                        },
                    ],
                },
                {
                    name: "beatmap",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Changes the beatmap used in a challenge.",
                    options: [
                        {
                            name: "id",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            description: "The ID of the challenge.",
                        },
                    ],
                },
                {
                    name: "beatmapfile",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Gets the beatmap file of a challenge.",
                    options: [
                        {
                            name: "id",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            description: "The ID of the challenge.",
                        },
                    ],
                },
                {
                    name: "bonus",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Adds or modifies a bonus.",
                    options: [
                        {
                            name: "id",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            description: "The ID of the challenge.",
                        },
                        {
                            name: "type",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            description: "The type of the bonus.",
                            choices: Challenge.bonusCommandChoices,
                        },
                        {
                            name: "level",
                            type: ApplicationCommandOptionType.Integer,
                            required: true,
                            description: "The level of the bonus.",
                            minValue: 1,
                        },
                        {
                            name: "value",
                            type: ApplicationCommandOptionType.String,
                            description:
                                "The value to set the bonus to. Omit to delete the bonus level.",
                        },
                    ],
                },
                {
                    name: "check",
                    type: ApplicationCommandOptionType.Subcommand,
                    description:
                        "Similar to /daily check, but will respond privately.",
                    options: [
                        {
                            name: "id",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            description: "The ID of the challenge.",
                        },
                    ],
                },
                {
                    name: "constrain",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Modifies the constrain of a challenge.",
                    options: [
                        {
                            name: "id",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            description: "The ID of the challenge.",
                        },
                        {
                            name: "constrain",
                            type: ApplicationCommandOptionType.String,
                            description:
                                "The mods required to complete the challenge. Omit to clear the challenge's constrain.",
                        },
                    ],
                },
                {
                    name: "delete",
                    type: ApplicationCommandOptionType.Subcommand,
                    description:
                        "Deletes a challenge given that it's still scheduled.",
                    options: [
                        {
                            name: "id",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            description: "The ID of the challenge.",
                        },
                    ],
                },
                {
                    name: "downloadlink",
                    type: ApplicationCommandOptionType.Subcommand,
                    description:
                        "Sets the download link to the beatmapset of the challenge.",
                    options: [
                        {
                            name: "id",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            description: "The ID of the challenge.",
                        },
                        {
                            name: "link1",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            description: "The download link.",
                        },
                        {
                            name: "link2",
                            type: ApplicationCommandOptionType.String,
                            description:
                                "The alternative download link, if any.",
                        },
                    ],
                },
                {
                    name: "featured",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Modifies the featured user of a challenge.",
                    options: [
                        {
                            name: "id",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            description: "The ID of the challenge.",
                        },
                        {
                            name: "user",
                            type: ApplicationCommandOptionType.User,
                            description:
                                "The user to feature. Defaults to yourself.",
                        },
                    ],
                },
                {
                    name: "passrequirement",
                    type: ApplicationCommandOptionType.Subcommand,
                    description:
                        "Modifies the pass requirement of a challenge.",
                    options: [
                        {
                            name: "id",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            description: "The ID of the challenge.",
                        },
                        {
                            name: "type",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            description:
                                "The type of the new pass requirement.",
                            choices: Challenge.passCommandChoices,
                        },
                        {
                            name: "value",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            description:
                                "The value that must be fulfilled to pass the challenge.",
                        },
                    ],
                },
                {
                    name: "points",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Modifies the points awarded in a challenge.",
                    options: [
                        {
                            name: "id",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            description: "The ID of the challenge.",
                        },
                        {
                            name: "points",
                            type: ApplicationCommandOptionType.Integer,
                            required: true,
                            description:
                                "The points awarded for completing the challenge.",
                            minValue: 1,
                        },
                    ],
                },
                {
                    name: "viewbonus",
                    type: ApplicationCommandOptionType.Subcommand,
                    description:
                        "Similar to /daily bonuses, but will respond privately.",
                    options: [
                        {
                            name: "id",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            description: "The ID of the challenge.",
                        },
                    ],
                },
            ],
        },
        {
            name: "leaderboard",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Views daily and weekly challenges leaderboard.",
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
            name: "manualsubmit",
            type: ApplicationCommandOptionType.Subcommand,
            description:
                "Manually submits a replay towards the current ongoing challenge.",
            options: [
                {
                    name: "replay",
                    required: true,
                    type: ApplicationCommandOptionType.Attachment,
                    description: "The replay file (.odr).",
                },
            ],
        },
        {
            name: "profile",
            type: ApplicationCommandOptionType.Subcommand,
            description:
                "Checks yours or an osu!droid account's challenge profile.",
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
            name: "start",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Starts a challenge.",
            options: [
                {
                    name: "challengeid",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description: "The ID of the challenge.",
                },
            ],
        },
        {
            name: "submit",
            type: ApplicationCommandOptionType.Subcommand,
            description:
                "Submits your 50 most recent plays towards the current ongoing challenge.",
            options: [
                {
                    name: "type",
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The type of the challenge. Defaults to daily.",
                    choices: [
                        {
                            name: "Daily",
                            value: "daily",
                        },
                        {
                            name: "Weekly",
                            value: "weekly",
                        },
                    ],
                },
            ],
        },
    ],
    example: [
        {
            command: "daily checksubmit",
            arguments: [
                {
                    name: "challengeid",
                    value: "d21",
                },
            ],
            description: "will check if you have played challenge `d21`.",
        },
        {
            command: "daily manualsubmit",
            description:
                "will submit the provided replay to be verified against the current daily or weekly challenge.",
        },
        {
            command: "daily submit",
            description:
                "will submit your 50 most recent plays towards the current ongoing daily challenge.",
        },
    ],
    contexts: [InteractionContextType.Guild],
    cooldown: 5,
};
