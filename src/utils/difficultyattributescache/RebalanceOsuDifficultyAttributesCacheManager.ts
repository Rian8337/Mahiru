import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { Modes } from "@rian8337/osu-base";
import { OsuDifficultyAttributes } from "@rian8337/osu-rebalance-difficulty-calculator";
import { DifficultyAttributesCacheManager } from "./DifficultyAttributesCacheManager";

/**
 * A cache manager for osu!standard rebalance calculation difficulty attributes.
 */
export class RebalanceOsuDifficultyAttributesCacheManager extends DifficultyAttributesCacheManager<OsuDifficultyAttributes> {
    protected override readonly attributeType: PPCalculationMethod =
        PPCalculationMethod.rebalance;
    protected override readonly mode: Modes = Modes.Osu;
}
