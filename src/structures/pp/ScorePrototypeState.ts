import { ScorePrototypeDifficultyState } from "./ScorePrototypeDifficultyState";
import { ScorePrototypePerformanceState } from "./ScorePrototypePerformanceState";

/**
 * Represents the state of a score in a prototype.
 */
export interface ScorePrototypeState {
    /**
     * The difficulty of the score for this prototype.
     */
    readonly difficulty: ScorePrototypeDifficultyState;

    /**
     * The performance of the score for this prototype.
     */
    readonly performance: ScorePrototypePerformanceState;
}
