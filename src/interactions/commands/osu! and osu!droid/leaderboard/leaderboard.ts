import { ApplicationCommandOptionType } from "discord.js";
import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { BeatmapLeaderboardSortMode } from "@enums/interactions/BeatmapLeaderboardSortMode";

export const run: SlashCommand["run"] = async (_, interaction) => {
    CommandHelper.runSlashSubcommandFromInteraction(interaction);
};

export const category: SlashCommand["category"] = CommandCategory.osu;

export const config: SlashCommand["config"] = {
    name: "leaderboard",
    description: "General leaderboard command.",
    options: [
        {
            name: "beatmap",
            type: ApplicationCommandOptionType.Subcommand,
            description: "View a beatmap's leaderboard.",
            options: [
                {
                    name: "beatmap",
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The beatmap ID or link to view. If unspecified, will take the latest cached beatmap in the channel.",
                },
                {
                    name: "page",
                    type: ApplicationCommandOptionType.Integer,
                    description: "The page of the leaderboard. Defaults to 1.",
                    minValue: 1,
                },
                {
                    name: "order",
                    type: ApplicationCommandOptionType.Integer,
                    description:
                        "The sorting order of the leaderboard. Defaults to score.",
                    choices: [
                        {
                            name: "Score",
                            value: BeatmapLeaderboardSortMode.score,
                        },
                        {
                            name: "Performance Points",
                            value: BeatmapLeaderboardSortMode.pp,
                        },
                    ],
                },
            ],
        },
        {
            name: "global",
            type: ApplicationCommandOptionType.Subcommand,
            description: "View the global pp leaderboard.",
            options: [
                {
                    name: "page",
                    type: ApplicationCommandOptionType.Integer,
                    description: "The page of the leaderboard. Defaults to 1.",
                    minValue: 1,
                },
            ],
        },
        {
            name: "prototype",
            type: ApplicationCommandOptionType.Subcommand,
            description: "View the droid pp (dpp) prototype leaderboard.",
            options: [
                {
                    name: "page",
                    type: ApplicationCommandOptionType.Integer,
                    description: "The page of the leaderboard. Defaults to 1.",
                    minValue: 1,
                },
                {
                    name: "rework",
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The name of the rework to view the leaderboard from. Defaults to overall.",
                    autocomplete: true,
                },
            ],
        },
    ],
    example: [
        {
            command: "leaderboard global",
            description: "will view the global game leaderboard.",
        },
    ],
    cooldown: 20,
};
