import { PPEntry } from "./PPEntry";
import { ScorePrototypeState } from "./ScorePrototypeState";

/**
 * Represents a prototype droid performance points (dpp) entry.
 */
export interface PrototypePPEntry extends Omit<PPEntry, "pp"> {
    /**
     * The maximum combo of the beatmap.
     */
    readonly maxCombo: number;

    /**
     * The circle size of the played beatmap.
     */
    readonly circleSize: number;

    /**
     * The approach rate of the played beatmap.
     */
    readonly approachRate: number;

    /**
     * The evaluated osu!droid overall difficulty of the score.
     */
    readonly overallDifficulty: number;

    /**
     * The amount of great hits achieved in the score.
     */
    readonly hit300: number;

    /**
     * The amount of good hits achieved in the score.
     */
    readonly hit100: number;

    /**
     * The amount of meh hits achieved in the score.
     */
    readonly hit50: number;

    /**
     * The state of the score in the live system.
     */
    readonly live: ScorePrototypeState;

    /**
     * The state of the score in the prototype system.
     */
    readonly local: ScorePrototypeState;

    /**
     * The state of the score in the master prototype system, if this entry
     * does not represent the score in the master prototype system.
     */
    master?: ScorePrototypeState;
}
