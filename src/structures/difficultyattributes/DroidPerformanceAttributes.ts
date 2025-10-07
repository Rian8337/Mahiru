import { PerformanceAttributes } from "./PerformanceAttributes";

/**
 * A structure containing information about a performance calculation result.
 */
export interface DroidPerformanceAttributes extends PerformanceAttributes {
    /**
     * The tap performance points.
     */
    tap: number;

    /**
     * The reading performance points.
     */
    reading: number;

    /**
     * The estimated deviation of the score.
     */
    deviation: number;

    /**
     * The estimated tap deviation of the score.
     */
    tapDeviation: number;

    /**
     * The penalty used to penalize the tap performance value.
     */
    tapPenalty: number;

    /**
     * The penalty used to penalize the aim performance value.
     */
    aimSliderCheesePenalty: number;

    /**
     * The penalty used to penalize the flashlight performance value.
     */
    flashlightSliderCheesePenalty: number;
}
