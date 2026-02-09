/**
 * Represents the performance state of a score in prototype.
 */
export interface ScorePrototypePerformanceState {
    /**
     * The total performance points of the score for this performance state.
     */
    readonly total: number;

    /**
     * The aim performance points of the score for this performance state.
     */
    readonly aim: number;

    /**
     * The tap performance points of the score for this performance state.
     */
    readonly tap: number;

    /**
     * The accuracy performance points of the score for this performance state.
     */
    readonly accuracy: number;

    /**
     * The flashlight performance points of the score for this performance state.
     */
    readonly flashlight: number;

    /**
     * The reading performance points of the score for this performance state.
     */
    readonly reading: number;

    /**
     * The estimated unstable rate of the score.
     */
    readonly estimatedUnstableRate: number;

    /**
     * The estimated tap unstable rate of the score.
     */
    readonly estimatedTapUnstableRate: number;

    /**
     * The tap penalty of the score for this performance state.
     */
    readonly tapPenalty: number;
}
