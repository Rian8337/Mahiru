import { Constants } from "@core/Constants";
import {
    ApplicationCommandOptionType,
    InteractionContextType,
} from "discord.js";
import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashCommand["run"] = async (_, interaction) => {
    const constantsLocalization = new ConstantsLocalization(
        CommandHelper.getLocale(interaction)
    );

    const whitelistedGuilds = [
        Constants.mainServer,
        Constants.testingServer,
        "526214018269184001",
    ];

    if (
        !interaction.inCachedGuild() ||
        !whitelistedGuilds.includes(interaction.guildId)
    ) {
        interaction.ephemeral = true;

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                constantsLocalization.getTranslation(
                    Constants.notAvailableInServerReject
                )
            ),
        });
    }

    if (!interaction.member.roles.cache.find((r) => r.name === "Referee")) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                constantsLocalization.getTranslation(
                    Constants.noPermissionReject
                )
            ),
        });
    }

    CommandHelper.runSlashSubcommandFromInteraction(interaction);
};

export const category: SlashCommand["category"] = CommandCategory.tournament;

export const config: SlashCommand["config"] = {
    name: "match",
    description:
        "Main command for tournament matches.\n\nThis command has a special permission that cannot be modified.",
    options: [
        {
            name: "add",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Adds a match.",
            options: [
                {
                    name: "id",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The ID of the match, in {<pool ID>.<match ID>} format.",
                },
                {
                    name: "name",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description: "The name of the match.",
                },
                {
                    name: "team1name",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description: "The name of team 1.",
                },
                {
                    name: "team2name",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description: "The name of team 2.",
                },
                {
                    name: "team1players",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The players in team 1, in the format {<player name> <uid>} for each player, separated by space.",
                },
                {
                    name: "team2players",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The players in team 2, in the format {<player name> <uid>} for each player, separated by space.",
                },
            ],
        },
        {
            name: "bind",
            type: ApplicationCommandOptionType.Subcommand,
            description:
                "Binds a match to the current channel and creates a thread for the match.",
            options: [
                {
                    name: "id",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description: "The ID of the match.",
                },
            ],
        },
        {
            name: "check",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Checks the status of a match.",
            options: [
                {
                    name: "id",
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The ID of the match. Defaults to the match in current bound thread.",
                },
            ],
        },
        {
            name: "end",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Ends a match.",
            options: [
                {
                    name: "id",
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The ID of the match. Defaults to the match in current bound thread.",
                },
            ],
        },
        {
            name: "manualsubmit",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Manually submits a round of score for a match.",
            options: [
                {
                    name: "id",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description: "The ID of the match.",
                },
                {
                    name: "pick",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description: "The current pick (NM1, NM2, etc).",
                },
                {
                    name: "team1scores",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description:
                        "Scores from team 1, in format {<score>[h] <acc> <miss>} for every player by order in the team.",
                },
                {
                    name: "team2scores",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description:
                        "Scores from team 2, in format {<score>[h] <acc> <miss>} for every player by order in the team.",
                },
            ],
        },
        {
            name: "remove",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Removes a match.",
            options: [
                {
                    name: "id",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description: "The ID of the match.",
                },
            ],
        },
        {
            name: "start",
            type: ApplicationCommandOptionType.Subcommand,
            description:
                "Starts a round in a match. This can only be done in a bound thread (see /match bind).",
            options: [
                {
                    name: "pick",
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    description: "The current pick (NM1, NM2, etc).",
                },
            ],
        },
        {
            name: "submit",
            type: ApplicationCommandOptionType.Subcommand,
            description:
                "Submits the most recent play of each player in a match.",
            options: [
                {
                    name: "id",
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The ID of the match. Defaults to the match in current bound thread.",
                },
                {
                    name: "pick",
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The pick to be submitted. If omitted, uses the most recent play from all participants in the match.",
                },
            ],
        },
        {
            name: "unbind",
            type: ApplicationCommandOptionType.Subcommand,
            description:
                "Unbinds an ended match and closes (archives) its thread.",
            options: [
                {
                    name: "id",
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The ID of the match. Defaults to the match in current bound thread.",
                },
            ],
        },
        {
            name: "undo",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Undo the recent result of a match.",
            options: [
                {
                    name: "id",
                    type: ApplicationCommandOptionType.String,
                    description:
                        "The match to undo. Defaults to the match in current bound channel.",
                },
            ],
        },
    ],
    example: [
        {
            command: "match add",
            arguments: [
                {
                    name: "id",
                    value: "t11f1.m1",
                },
                {
                    name: "name",
                    value: "osu!droid 11th Tournament",
                },
                {
                    name: "team1name",
                    value: "Red Team",
                },
                {
                    name: "team2name",
                    value: "Blue Team",
                },
                {
                    name: "team1players",
                    value: "NeroYuki 5455 Rian8337 51076",
                },
                {
                    name: "team2players",
                    value: "RisingSTORM 117819 NabilaSari 156828",
                },
            ],
            description:
                'will add a match with ID `t11f1.m1` and name "osu!droid 11th Tournament", and the following teams and players:\n- Red Team: NeroYuki (uid 5455) and Rian8337 (uid 51076)\n- Blue Team: RisingSTORM (uid 117819) and NabilaSari (uid 156828)',
        },
        {
            command: "match bind",
            arguments: [
                {
                    name: "id",
                    value: "t11f1.m1",
                },
            ],
            description:
                "will bind the match with ID `t11f1.m1` to the channel the command is executed.",
        },
    ],
    permissions: ["Special"],
    contexts: [InteractionContextType.Guild],
};
