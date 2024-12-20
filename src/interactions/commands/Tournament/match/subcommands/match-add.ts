import { DatabaseManager } from "@database/DatabaseManager";
import { TournamentMatch } from "@database/utils/elainaDb/TournamentMatch";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { OperationResult } from "structures/core/OperationResult";
import { DatabaseTournamentMatch } from "structures/database/elainaDb/DatabaseTournamentMatch";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { MatchLocalization } from "@localization/interactions/commands/Tournament/match/MatchLocalization";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization: MatchLocalization = new MatchLocalization(
        CommandHelper.getLocale(interaction),
    );

    const matchId: string = interaction.options.getString("id", true);

    const name: string = interaction.options.getString("name", true);

    const team1Name: string = interaction.options.getString("team1name", true);

    const team2Name: string = interaction.options.getString("team2name", true);

    const team1Players: string = interaction.options.getString(
        "team1players",
        true,
    );

    const team2Players: string = interaction.options.getString(
        "team2players",
        true,
    );

    if (matchId.split(".").length !== 2) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("invalidMatchID"),
            ),
        });
    }

    const existingMatchCheck: TournamentMatch | null =
        await DatabaseManager.elainaDb.collections.tournamentMatch.getById(
            matchId,
        );

    if (existingMatchCheck) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("matchIDAlreadyTaken"),
            ),
        });
    }

    const matchData: Partial<DatabaseTournamentMatch> = {
        matchid: matchId,
        name: name,
        team: [
            [team1Name, 0],
            [team2Name, 0],
        ],
        player: [],
        result: [],
    };

    const splitRegex: RegExp = /\b[\w']+(?:[^\w\n]+[\w']+){0,1}\b/g;

    const team1PlayersInformation: RegExpMatchArray | null =
        team1Players.match(splitRegex);

    const team2PlayersInformation: RegExpMatchArray | null =
        team2Players.match(splitRegex);

    if (!team1PlayersInformation || !team2PlayersInformation) {
        return;
    }

    // Ensure the player difference between both teams don't exceed 1
    if (
        Math.abs(
            team1PlayersInformation.length - team2PlayersInformation.length,
        ) > 1
    ) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("teamPlayerCountDoNotBalance"),
            ),
        });
    }

    for (
        let i = 0;
        i < team1PlayersInformation.length + team2PlayersInformation.length;
        ++i
    ) {
        const teamInfo: [string, string] =
            <[string, string]>(
                (i % 2 === 0
                    ? team1PlayersInformation
                    : team2PlayersInformation)[Math.floor(i / 2)]?.split(" ")
            ) ?? [];

        if (teamInfo.length !== 2) {
            return InteractionHelper.reply(interaction, {
                content: MessageCreator.createReject(
                    localization.getTranslation("invalidPlayerInformation"),
                    teamInfo.join(" "),
                ),
            });
        }

        matchData.player!.push(teamInfo);
        matchData.result!.push([]);
    }

    const result: OperationResult =
        await DatabaseManager.elainaDb.collections.tournamentMatch.insert(
            matchData,
        );

    if (!result.success) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("addMatchFailed"),
                result.reason!,
            ),
        });
    }

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("addMatchSuccessful"),
            matchId,
        ),
    });
};
