import {
    ApplicationCommandOptionType,
    InteractionContextType,
} from "discord.js";
import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { GuildMember } from "discord.js";
import { MusicLocalization } from "@localization/interactions/commands/Fun/music/MusicLocalization";
import { Language } from "@localization/base/Language";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashCommand["run"] = async (_, interaction) => {
    const language = CommandHelper.getLocale(interaction);

    if (!(<GuildMember>interaction.member).voice.channelId) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                new MusicLocalization(language).getTranslation(
                    "userIsNotInVoiceChannel"
                )
            ),
        });
    }

    CommandHelper.runSlashSubcommandOrGroup(interaction, language);
};

export const category: SlashCommand["category"] = CommandCategory.fun;

export const config: SlashCommand["config"] = {
    name: "music",
    description: "Main command for music.",
    options: [
        {
            name: "collections",
            type: ApplicationCommandOptionType.SubcommandGroup,
            description: "Manages music collections.",
            options: [
                {
                    name: "add",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Adds a YouTube URL to a music collection.",
                    options: [
                        {
                            name: "name",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The name of the collection.",
                        },
                        {
                            name: "query",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description:
                                "The query to search for the YouTube video.",
                        },
                        {
                            name: "position",
                            type: ApplicationCommandOptionType.Integer,
                            description:
                                "The position at which to insert the new YouTube URL on, ranging from 1 to 10. Defaults to latest.",
                            minValue: 1,
                            maxValue: 10,
                        },
                    ],
                },
                {
                    name: "create",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Creates a new music collection.",
                    options: [
                        {
                            name: "name",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The name of the collection.",
                        },
                        {
                            name: "query",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description:
                                "The query to search for the YouTube video.",
                        },
                    ],
                },
                {
                    name: "delete",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Deletes a music collection.",
                    options: [
                        {
                            name: "name",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The name of the collection.",
                        },
                    ],
                },
                {
                    name: "enqueue",
                    type: ApplicationCommandOptionType.Subcommand,
                    description:
                        "Enqueues a music collection into the music queue.",
                    options: [
                        {
                            name: "name",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The name of the collection.",
                        },
                    ],
                },
                {
                    name: "list",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Lists all music collections owned by a user.",
                    options: [
                        {
                            name: "user",
                            type: ApplicationCommandOptionType.User,
                            description: "The user. Defaults to yourself.",
                        },
                    ],
                },
                {
                    name: "remove",
                    type: ApplicationCommandOptionType.Subcommand,
                    description:
                        "Removes a YouTube URL from a music collection.",
                    options: [
                        {
                            name: "name",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The name of the collection.",
                        },
                        {
                            name: "position",
                            required: true,
                            type: ApplicationCommandOptionType.Integer,
                            description:
                                "The position of the YouTube URL to remove in the music collection's links list.",
                            minValue: 1,
                            maxValue: 10,
                        },
                    ],
                },
                {
                    name: "view",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Views a music collection's information.",
                    options: [
                        {
                            name: "name",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The name of the collection.",
                        },
                    ],
                },
            ],
        },
        {
            name: "info",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Shows information about my music status.",
        },
        {
            name: "leave",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Leaves the current voice channel I'm in.",
        },
        {
            name: "nowplaying",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Shows the music that is being played.",
        },
        {
            name: "pause",
            type: ApplicationCommandOptionType.Subcommand,
            description:
                "Pauses the currently played audio in a voice channel.",
        },
        {
            name: "play",
            type: ApplicationCommandOptionType.Subcommand,
            description:
                "Plays or enqueues a YouTube video into a voice channel.",
            options: [
                {
                    name: "query",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description: "The query to search for the YouTube video.",
                },
            ],
        },
        {
            name: "queue",
            type: ApplicationCommandOptionType.SubcommandGroup,
            description: "Manages music queue.",
            options: [
                {
                    name: "add",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Adds a YouTube video into the music queue.",
                    options: [
                        {
                            name: "query",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description:
                                "The query to search for the YouTube video.",
                        },
                        {
                            name: "position",
                            type: ApplicationCommandOptionType.Integer,
                            description:
                                "The position at which to insert this queue in, ranging from 1 to 10. Defaults to latest.",
                            minValue: 1,
                            maxValue: 10,
                        },
                    ],
                },
                {
                    name: "remove",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Removes an item from the music queue.",
                    options: [
                        {
                            name: "position",
                            required: true,
                            type: ApplicationCommandOptionType.Integer,
                            description:
                                "The position of the item to remove, ranging from 1 to 10.",
                            minValue: 1,
                            maxValue: 10,
                        },
                    ],
                },
                {
                    name: "view",
                    type: ApplicationCommandOptionType.Subcommand,
                    description: "Views the current music queue.",
                },
            ],
        },
        {
            name: "repeat",
            type: ApplicationCommandOptionType.Subcommand,
            description:
                "Sets repeat mode (whether to repeat music during playback).",
            options: [
                {
                    name: "repeat",
                    required: true,
                    type: ApplicationCommandOptionType.Boolean,
                    description: "Whether to enable repeat mode.",
                },
            ],
        },
        {
            name: "resume",
            type: ApplicationCommandOptionType.Subcommand,
            description:
                "Resumes the currently played audio in a voice channel.",
        },
        {
            name: "shuffle",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Shuffles the current music queue.",
        },
        {
            name: "skip",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Skips the currently played audio in a voice channel.",
        },
    ],
    example: [
        {
            command: "music play",
            arguments: [
                {
                    name: "query",
                    value: "realm of tranquil eternity",
                },
            ],
            description:
                'will search "realm of tranquil eternity" from YouTube and lets you choose which video to play.',
        },
        {
            command: "music queue remove",
            arguments: [
                {
                    name: "position",
                    value: 3,
                },
            ],
            description: "will remove the 3rd music queue in queue list.",
        },
    ],
    cooldown: 10,
    permissions: ["BotOwner"],
    contexts: [InteractionContextType.Guild],
};
