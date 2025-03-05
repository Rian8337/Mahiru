import { ApplicationCommandOptionType } from "discord.js";
import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { CommandHelper } from "@utils/helpers/CommandHelper";

export const run: SlashCommand["run"] = async (_, interaction) => {
    CommandHelper.runSlashSubcommandOrGroup(interaction);
};

export const category: SlashCommand["category"] = CommandCategory.tournament;

export const config: SlashCommand["config"] = {
    name: "pool",
    description: "Main command for tournament mappools.",
    options: [
        {
            name: "leaderboard",
            type: ApplicationCommandOptionType.SubcommandGroup,
            description: "Leaderboard commands for tournament mappools.",
            options: [
                {
                    name: "output",
                    description:
                        "Outputs the ScoreV2 leaderboard of a tournament beatmap to a CSV file.",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "id",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The ID of the mappool.",
                        },
                        {
                            name: "pick",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The pick to output (NM1, NM2, etc).",
                        },
                    ],
                },
                {
                    name: "view",
                    description:
                        "Views the ScoreV2 leaderboard of a tournament beatmap in a registered tournament mappool.",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "id",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The ID of the mappool.",
                        },
                        {
                            name: "pick",
                            required: true,
                            type: ApplicationCommandOptionType.String,
                            description: "The pick to view (NM1, NM2, etc).",
                        },
                    ],
                },
            ],
        },
        {
            name: "view",
            type: ApplicationCommandOptionType.Subcommand,
            description:
                "Retrieves a list of beatmaps from a registered tournament mappool.",
            options: [
                {
                    name: "id",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description: "The ID of the mappool.",
                },
            ],
        },
    ],
    example: [
        {
            command: "pool view",
            arguments: [
                {
                    name: "id",
                    value: "t11sf",
                },
            ],
            description:
                'will retrieve a list of beatmaps from tournament mappool "t11sf".',
        },
        {
            command: "pool view",
            arguments: [
                {
                    name: "id",
                    value: "t8gf",
                },
            ],
            description:
                'will retrieve a list of beatmaps from tournament mappool "t8gf".',
        },
    ],
};
