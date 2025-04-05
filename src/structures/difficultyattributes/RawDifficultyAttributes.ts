import { IDifficultyAttributes } from "@rian8337/osu-difficulty-calculator";
import { IDifficultyAttributes as IRebalanceDifficultyAttributes } from "@rian8337/osu-rebalance-difficulty-calculator";

/**
 * A base difficulty attributes structure for all difficulty attributes.
 */
export type RawDifficultyAttributes =
    | IDifficultyAttributes
    | IRebalanceDifficultyAttributes;
