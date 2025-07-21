import { ScoreRank } from "@rian8337/osu-base";

/**
 * Represents an osu!droid score.
 */
export interface OfficialDatabaseScore {
    readonly id: number;
    readonly uid: number;
    readonly filename: string;
    readonly hash: string;
    mods: string;
    score: number;
    combo: number;
    mark: ScoreRank;
    readonly geki: number;
    perfect: number;
    readonly katu: number;
    good: number;
    bad: number;
    miss: number;
    readonly date: Date;
    accuracy: number;
    readonly slider_tick_hit: number | null;
    readonly slider_end_hit: number | null;
    readonly pp: number | null;
}
