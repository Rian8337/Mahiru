import { DatabaseManager } from "@database/DatabaseManager";
import { OperationResult } from "structures/core/OperationResult";
import { DatabaseTournamentMatch } from "structures/database/elainaDb/DatabaseTournamentMatch";
import { TournamentBeatmap } from "structures/tournament/TournamentBeatmap";
import { Manager } from "@utils/base/Manager";
import { ObjectId } from "bson";
import { Snowflake } from "discord.js";
import {
    Mod,
    ModEasy,
    ModHardRock,
    ModHidden,
    ModNoFail,
    ModUtil,
} from "@rian8337/osu-base";
import { Player, Score } from "@rian8337/osu-droid-utilities";
import { TournamentMappool } from "./TournamentMappool";
import { Language } from "@localization/base/Language";
import { TournamentMatchLocalization } from "@localization/database/utils/elainaDb/TournamentMatch/TournamentMatchLocalization";
import { StringHelper } from "@utils/helpers/StringHelper";

/**
 * Represents a tournament match.
 */
export class TournamentMatch
    extends Manager
    implements DatabaseTournamentMatch
{
    matchid: string;
    channelId: Snowflake;
    name: string;
    team: [string, number][];
    player: [string, string][];
    status: "scheduled" | "on-going" | "completed";
    result: number[][];
    readonly _id?: ObjectId;

    /**
     * The color code of this match.
     */
    get matchColorCode(): number {
        switch (this.status) {
            case "scheduled":
                return 16776960;
            case "on-going":
                return 65280;
            case "completed":
                return 16711680;
        }
    }

    constructor(
        data: DatabaseTournamentMatch = DatabaseManager.elainaDb?.collections
            .tournamentMatch.defaultDocument ?? {}
    ) {
        super();

        this._id = data._id;
        this.matchid = data.matchid;
        this.channelId = data.channelId;
        this.name = data.name;
        this.team = data.team ?? [];
        this.player = data.player ?? [];
        this.status = data.status;
        this.result = data.result ?? [];
    }

    /**
     * Updates the match in match database.
     *
     * This should only be called after changing everything needed
     * as this will perform a database operation.
     *
     * @returns An object containing information about the operation.
     */
    updateMatch(): Promise<OperationResult> {
        return DatabaseManager.elainaDb.collections.tournamentMatch.updateOne(
            { matchid: this.matchid },
            {
                $set: {
                    channelId: this.channelId,
                    player: this.player,
                    result: this.result,
                    status: this.status,
                    team: this.team,
                },
            }
        );
    }

    /**
     * Gets the last played beatmap from players.
     *
     * @param pool The tournament mappool of this match.
     * @param players The list of players who played in this match.
     * @param pick The beatmap that was picked, if any.
     * @returns The last played beatmap, `null` if not found.
     */
    getLastPlayedBeatmap(
        pool: TournamentMappool,
        players: Player[],
        pick?: string
    ): TournamentBeatmap | null {
        let map: TournamentBeatmap | null = null;

        if (pick) {
            map = pool.getBeatmapFromPick(pick);
        } else {
            let minTime = Number.NEGATIVE_INFINITY;
            let hash = "";

            for (const player of players) {
                const recentPlay = player.recentPlays[0];

                if (minTime >= recentPlay?.date.getTime()) {
                    continue;
                }

                hash = recentPlay.hash;
                minTime = recentPlay.date.getTime();

                map = pool.getBeatmapFromHash(hash);
            }
        }

        return map;
    }

    /**
     * Verifies whether a team's scores fulfill the criteria of team-wide criteria.
     *
     * @param scores The scores to verify.
     * @param map The beatmap data to verify for.
     * @param language The locale of the user who attempted to verify a team's score. Defaults to English.
     */
    verifyTeamScore(
        scores: Score[],
        map: TournamentBeatmap,
        language: Language = "en"
    ): OperationResult {
        if (map.minPlayers === "ALL" || !map.pickId.startsWith("FM")) {
            return this.createOperationResult(true);
        }

        return this.createOperationResult(
            scores.some(
                (score) =>
                    score.mods.has(ModEasy) ||
                    score.mods.has(ModHidden) ||
                    score.mods.has(ModHardRock)
            ),
            this.getLocalization(language).getTranslation(
                "teamMembersIncorrectFMmod"
            )
        );
    }

    /**
     * Verifies whether a score fulfills the criteria of submitting a score.
     *
     * @param score The score to verify.
     * @param map The beatmap data to verify for.
     * @param teamScoreStatus Whether the team fulfills the criteria of submitting a score.
     * @param language The locale of the user who attempted to verify the score. Defaults to English.
     */
    verifyScore(
        score: Score,
        map: TournamentBeatmap,
        teamScoreStatus: boolean,
        language: Language = "en"
    ): OperationResult {
        const localization: TournamentMatchLocalization =
            this.getLocalization(language);

        if (score.hash !== map.hash) {
            return this.createOperationResult(
                false,
                localization.getTranslation("scoreNotFound")
            );
        }

        // await score.downloadReplay();

        // if (!score.replay || !score.replay.data) {
        //     return this.createOperationResult(
        //         false,
        //         localization.getTranslation("replayNotFound")
        //     );
        // }

        // if (score.replay.data.replayVersion > 4) {
        //     return this.createOperationResult(
        //         false,
        //         localization.getTranslation("unsupportedGameVersion")
        //     );
        // }

        const correctMods: Mod[] = [];
        const incorrectMods: Mod[] = [];
        const requiredMods = ModUtil.pcStringToMods(map.requiredMods);

        // Consider required mods first, then we can check for invalid mods.
        for (const mod of requiredMods.values()) {
            if (score.mods.has(mod)) {
                correctMods.push(mod);
            }
        }

        for (const mod of score.mods.values()) {
            if (mod instanceof ModNoFail) {
                continue;
            }

            if (
                !map.requiredMods.includes(mod.acronym) &&
                !map.allowedMods.includes(mod.acronym)
            ) {
                incorrectMods.push(mod);
            }
        }

        return this.createOperationResult(
            correctMods.length === requiredMods.size &&
                incorrectMods.length === 0 &&
                teamScoreStatus,
            StringHelper.formatString(
                localization.getTranslation("modsWasUsed"),
                incorrectMods.reduce((a, m) => a + m.acronym, "")
            )
        );
    }

    /**
     * Gets the localization of this database utility.
     *
     * @param language The language to localize.
     */
    private getLocalization(language: Language): TournamentMatchLocalization {
        return new TournamentMatchLocalization(language);
    }
}
