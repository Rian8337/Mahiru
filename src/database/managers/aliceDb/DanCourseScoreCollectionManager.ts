import { DanCourseScore } from "@database/utils/aliceDb/DanCourseScore";
import { DatabaseDanCourseScore } from "@structures/database/aliceDb/DatabaseDanCourseScore";
import { DatabaseCollectionManager } from "../DatabaseCollectionManager";

/**
 * A manager for the `dancoursescore` collection.
 *
 * This collection is responsible for storing all scores that have passed a dan course.
 */
export class DanCourseScoreCollectionManager extends DatabaseCollectionManager<
    DatabaseDanCourseScore,
    DanCourseScore
> {
    protected override utilityInstance: new (
        data: DatabaseDanCourseScore
    ) => DanCourseScore = DanCourseScore;
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
     * Checks if a player has at least one score in a beatmap.
     *
     * Keep in mind that this does not include leaderboard scores.
     *
     * @param uid The uid of the player.
     * @param hash The MD5 hash of the beatmap.
     * @returns Whether the player has any score in the beatmap.
     */
    async checkExistingScore(uid: number, hash: string): Promise<boolean> {
        const score = await this.collection.findOne(
            { uid: uid, hash: hash },
            { projection: { _id: 0, uid: 1 } }
        );

        return score !== null;
    }
}
