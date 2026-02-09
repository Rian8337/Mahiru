/**
 * Represents the difficulty state of a score in prototype.
 */
export interface ScorePrototypeDifficultyState {
    /**
     * The star rating of the score for this difficulty state.
     */
    readonly starRating: number;

    /**
     * The aim difficulty of the score for this difficulty state.
     */
    readonly aim: number;

    /**
     * The tap difficulty of the score for this difficulty state.
     */
    readonly tap: number;

    /**
     * The rhythm difficulty of the score for this difficulty state.
     */
    readonly rhythm: number;

    /**
     * The flashlight difficulty of the score for this difficulty state.
     */
    readonly flashlight: number;

    /**
     * The reading difficulty of the score for this difficulty state.
     */
    readonly reading: number;

    /**
     * The number of clickable objects weighted by difficulty.
     *
     * Related to tap difficulty.
     */
    readonly speedNoteCount: number;
}
