import {
    IDifficultyAttributes,
    PerformanceCalculator,
} from "@rian8337/osu-difficulty-calculator";
import {
    IDifficultyAttributes as IRebalanceDifficultyAttributes,
    PerformanceCalculator as RebalancePerformanceCalculator,
} from "@rian8337/osu-rebalance-difficulty-calculator";
import { PerformanceCalculationParameters } from "@utils/pp/PerformanceCalculationParameters";

/**
 * A structure for implementing performance calculation results.
 */
export interface IPerformanceCalculationResult<
    P extends
        | PerformanceCalculator<IDifficultyAttributes>
        | RebalancePerformanceCalculator<IRebalanceDifficultyAttributes>,
> {
    /**
     * The calculation parameters.
     */
    readonly params: PerformanceCalculationParameters;

    /**
     * The performance of the beatmap.
     */
    readonly result: P;

    /**
     * A string containing information about this performance calculation result's star rating.
     */
    get starRatingInfo(): string;
}
