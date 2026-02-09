import { DatabaseManager } from "@database/DatabaseManager";
import { ModMap } from "@rian8337/osu-base";
import { Score } from "@rian8337/osu-droid-utilities";
import { TournamentScore } from "@structures/tournament/TournamentScore";
import { Manager } from "@utils/base/Manager";
import { ArrayHelper } from "@utils/helpers/ArrayHelper";
import { DroidHelper } from "@utils/helpers/DroidHelper";
import { ScoreHelper } from "@utils/helpers/ScoreHelper";
import { ObjectId } from "mongodb";
import { Collection } from "discord.js";
import { DatabaseTournamentMappool } from "structures/database/elainaDb/DatabaseTournamentMappool";
import { TournamentBeatmap } from "structures/tournament/TournamentBeatmap";

/**
 * Represents a mappool for tournament.
 */
export class TournamentMappool extends Manager {
    /**
     * The ID of the mappool.
     */
    poolId: string;

    /**
     * The beatmaps in this tournament, mapped by pick ID.
     */
    maps: Collection<string, TournamentBeatmap>;

    /**
     * The BSON object ID of this document in the database.
     */
    readonly _id?: ObjectId;

    constructor(
        data: DatabaseTournamentMappool = DatabaseManager.elainaDb?.collections
            .tournamentMappool.defaultDocument ?? {},
    ) {
        super();

        this._id = data._id;
        this.poolId = data.poolId;
        this.maps = ArrayHelper.arrayToCollection(data.maps ?? [], "pickId");
    }

    /**
     * Calculates the ScoreV2 for a pick with respect to a score.
     *
     * @param pick The pick to calculate for.
     * @param score The score achieved.
     * @param accuracy The accuracy achieved, from 0 to 1.
     * @param misses The amount of misses achieved.
     * @param mods The mods that were used.
     * @returns The final ScoreV2.
     */
    calculateScoreV2(
        pick: string,
        score: number,
        accuracy: number,
        misses: number,
        mods: ModMap,
    ): number {
        const pickData = this.maps.get(pick.toUpperCase());

        if (!pickData) {
            return 0;
        }

        return ScoreHelper.calculateScoreV2(
            score,
            accuracy,
            misses,
            pickData.maxScore,
            mods,
            pickData.scorePortion,
        );
    }

    /**
     * Calculates the score portion of ScoreV2.
     *
     * @param pick The pick to calculate for.
     * @param score The score achieved.
     * @param misses The amount of misses achieved.
     * @param mods The mods that were used.
     * @returns The score portion of ScoreV2 for the pick, 0 if the pick is not found.
     */
    calculateScorePortionScoreV2(
        pick: string,
        score: number,
        misses: number,
        mods: ModMap,
    ): number {
        const pickData = this.maps.get(pick.toUpperCase());

        if (!pickData) {
            return 0;
        }

        return ScoreHelper.calculateScorePortionScoreV2(
            score,
            misses,
            pickData.maxScore,
            mods,
            pickData.scorePortion,
        );
    }

    /**
     * Calculates the accuracy portion of ScoreV2.
     *
     * @param pick The pick to calculate for.
     * @param accuracy The accuracy achieved, from 0 to 1.
     * @param misses The amount of misses achieved.
     * @param mods The mods that were used.
     * @returns The accuracy portion of ScoreV2 for the pick, 0 if the pick is not found.
     */
    calculateAccuracyPortionScoreV2(
        pick: string,
        accuracy: number,
        misses: number,
        mods: ModMap,
    ): number {
        const pickData = this.maps.get(pick.toUpperCase());

        if (!pickData) {
            return 0;
        }

        return ScoreHelper.calculateAccuracyPortionScoreV2(
            accuracy,
            misses,
            mods,
            1 - pickData.scorePortion,
        );
    }

    /**
     * Gets a beatmap from this tournament mappool by pick ID.
     *
     * @param pick The pick ID of the beatmap.
     * @returns The beatmap, `null` if not found.
     */
    getBeatmapFromPick(pick: string): TournamentBeatmap | null {
        return this.maps.get(pick.toUpperCase()) ?? null;
    }

    /**
     * Gets a beatmap from this tournament mappool by MD5 hash.
     *
     * @param hash The MD5 hash of the beatmap.
     * @returns The beatmap, `null` if not found.
     */
    getBeatmapFromHash(hash: string): TournamentBeatmap | null {
        return this.maps.find((v) => v.hash === hash) ?? null;
    }

    /**
     * Retrieves the leaderboard of a beatmap from this tournament pool.
     *
     * @param pick The pick ID of the beatmap.
     * @returns The leaderboard of the beatmap.
     */
    async getBeatmapLeaderboard(pick: string): Promise<TournamentScore[]> {
        const pickData: TournamentBeatmap | undefined = this.maps.get(
            pick.toUpperCase(),
        );

        if (!pickData) {
            return [];
        }

        const scores: TournamentScore[] = [];
        let page: number = 1;
        let retrievedScores: Score[];

        while (
            (retrievedScores = await DroidHelper.getBeatmapLeaderboard(
                pickData.hash,
                undefined,
                page++,
            )).length > 0
        ) {
            scores.push(
                ...retrievedScores.map<TournamentScore>((v) => {
                    return {
                        scoreV2: this.calculateScoreV2(
                            pick,
                            v.score,
                            v.accuracy.value(),
                            v.accuracy.nmiss,
                            v.mods,
                        ),
                        score: v,
                    };
                }),
            );
        }

        scores.sort((a, b) => b.scoreV2 - a.scoreV2);

        return scores;
    }

    /**
     * Gets the penalty for misses.
     *
     * @param tempScoreV2 The temporary score V2 to calculate for.
     * @param misses The amount of misses achieved.
     */
    private getMissPenalty(tempScoreV2: number, misses: number): number {
        return misses * 5e-3 * tempScoreV2;
    }
}
