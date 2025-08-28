import { DanCourseLeaderboardScore } from "@database/utils/aliceDb/DanCourseLeaderboardScore";
import { DatabaseDanCourseLeaderboardScore } from "@structures/database/aliceDb/DatabaseDanCourseLeaderboardScore";
import { DatabaseDanCourseScore } from "@structures/database/aliceDb/DatabaseDanCourseScore";
import { DatabaseCollectionManager } from "../DatabaseCollectionManager";

/**
 * A manager for the `dancourseleaderboard` collection.
 *
 * This collection is responsible for storing all highest scores of players that aren't flagged by 3f detection.
 */
export class DanCourseLeaderboardScoreCollectionManager extends DatabaseCollectionManager<
    DatabaseDanCourseLeaderboardScore,
    DanCourseLeaderboardScore
> {
    protected override utilityInstance: new (
        data: DatabaseDanCourseScore
    ) => DanCourseLeaderboardScore = DanCourseLeaderboardScore;

    override get defaultDocument(): DatabaseDanCourseScore {
        return {
            bad: 0,
            date: Date.now(),
            geki: 0,
            good: 0,
            hash: "",
            isSliderLock: false,
            katu: 0,
            maxCombo: 0,
            miss: 0,
            mods: [],
            perfect: 0,
            rank: "X",
            score: 0,
            skippedTime: 0,
            uid: 0,
            unstableRate: 0,
            username: "",
            replayFileName: "",
            grade: 0,
        };
    }

    /**
     * Gets the leaderboard of a beatmap.
     *
     * @param hash The MD5 hash of the beatmap.
     * @param page The page to view. Each page consists of 50 scores.
     * @returns The leaderboard of the beatmap at the page.
     */
    async getLeaderboard(
        hash: string,
        page: number
    ): Promise<DanCourseLeaderboardScore[]> {
        const amountPerPage = 50;

        const scores = await this.collection
            .find({ hash: hash })
            .sort({ score: -1, date: -1, grade: -1 })
            .skip(amountPerPage * Math.max(0, page - 1))
            .limit(amountPerPage)
            .toArray();

        return scores.map((v) => new DanCourseLeaderboardScore(v));
    }

    /**
     * Gets a score from a player.
     *
     * @param uid The uid of the player.
     * @param hash The hash of the player.
     * @returns The score of the player, `null` if not found.
     */
    getScore(
        uid: number,
        hash: string
    ): Promise<DanCourseLeaderboardScore | null> {
        return this.getOne({ uid: uid, hash: hash });
    }
}
