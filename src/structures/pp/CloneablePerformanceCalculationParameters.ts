import { Optional } from "@structures/utils/Optional";
import { CloneableAccuracy } from "./CloneableAccuracy";
import { CloneableDifficultyCalculationParameters } from "./CloneableDifficultyCalculationParameters";

/**
 * Represents a parameter to alter performance calculation result that can be cloned
 * for specific purposes (i.e., passing data between worker threads).
 */
export interface CloneablePerformanceCalculationParameters<
    TFromCalculation extends boolean = boolean,
> extends CloneableDifficultyCalculationParameters {
    /**
     * The combo achieved.
     */
    combo: Optional<TFromCalculation, number>;

    /**
     * The accuracy achieved.
     */
    accuracy: CloneableAccuracy;

    /**
     * The tap penalty to apply for penalized scores.
     */
    tapPenalty: Optional<TFromCalculation, number>;

    /**
     * The slider cheese penalties to apply for penalized scores.
     */
    sliderCheesePenalty: Optional<TFromCalculation, number>;

    /**
     * The amount of slider ticks that were missed.
     */
    sliderTicksMissed: Optional<TFromCalculation, number>;

    /**
     * The amount of slider ends that were dropped.
     */
    sliderEndsDropped: Optional<TFromCalculation, number>;

    /**
     * The total score achieved.
     */
    totalScore: Optional<TFromCalculation, number>;
}
