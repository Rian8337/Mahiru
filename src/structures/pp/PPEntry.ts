import { SerializedMod } from "@rian8337/osu-base";

/**
 * Represents a droid performance points (dpp) entry.
 */
export interface PPEntry {
    /**
     * The uid of the osu!droid account of which this score belongs to.
     */
    uid: number;

    /**
     * The MD5 hash of the beatmap.
     */
    hash: string;

    /**
     * The full name of the beatmap.
     */
    title: string;

    /**
     * The droid performance points of the score.
     */
    pp: number;

    /**
     * The maximum combo achieved in the score.
     */
    combo: number;

    /**
     * The modifications that are applied in the score.
     */
    mods: SerializedMod[];

    /**
     * The accuracy achieved in the score.
     */
    accuracy: number;

    /**
     * The amount of misses achieved in the score.
     */
    miss: number;
}
