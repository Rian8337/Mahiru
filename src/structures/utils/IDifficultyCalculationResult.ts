import { MapInfo } from "@rian8337/osu-base";
import { IDifficultyAttributes } from "@rian8337/osu-difficulty-calculator";
import { IDifficultyAttributes as IRebalanceDifficultyAttributes } from "@rian8337/osu-rebalance-difficulty-calculator";

/**
 * A structure for implementing difficulty calculation results.
 */
export interface IDifficultyCalculationResult<
    DA extends IDifficultyAttributes | IRebalanceDifficultyAttributes,
> {
    /**
     * The beatmap being calculated.
     */
    readonly map: MapInfo<true>;

    /**
     * The attributes that were cached into the cache manager as a result of this calculation.
     */
    readonly attributes: DA;
}
