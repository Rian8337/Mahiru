import { DatabaseManager } from "@database/DatabaseManager";
import { ScoreRank, SerializedMod } from "@rian8337/osu-base";
import { DatabaseDanCourseLeaderboardScore } from "@structures/database/aliceDb/DatabaseDanCourseLeaderboardScore";
import { Manager } from "@utils/base/Manager";
import { ObjectId } from "mongodb";

export class DanCourseLeaderboardScore
    extends Manager
    implements DatabaseDanCourseLeaderboardScore
{
    grade: number;
    readonly replayFileName: string;
    readonly uid: number;
    readonly username: string;
    readonly hash: string;
    readonly mods: SerializedMod[];
    readonly score: number;
    readonly maxCombo: number;
    readonly rank: ScoreRank;
    readonly geki: number;
    readonly perfect: number;
    readonly katu: number;
    readonly good: number;
    readonly bad: number;
    readonly miss: number;
    readonly date: number;
    readonly unstableRate: number;
    readonly isSliderLock: boolean;
    readonly skippedTime: number;
    readonly _id?: ObjectId;

    constructor(
        data: DatabaseDanCourseLeaderboardScore = DatabaseManager.aliceDb
            ?.collections.danCourseLeaderboardScores.defaultDocument ?? {}
    ) {
        super();

        this._id = data._id;
        this.grade = data.grade;
        this.replayFileName = data.replayFileName;
        this.uid = data.uid;
        this.username = data.username;
        this.hash = data.hash;
        this.mods = data.mods;
        this.score = data.score;
        this.maxCombo = data.maxCombo;
        this.rank = data.rank;
        this.geki = data.geki;
        this.perfect = data.perfect;
        this.katu = data.katu;
        this.good = data.good;
        this.bad = data.bad;
        this.miss = data.miss;
        this.date = data.date;
        this.unstableRate = data.unstableRate;
        this.isSliderLock = data.isSliderLock;
        this.skippedTime = data.skippedTime;
    }
}
