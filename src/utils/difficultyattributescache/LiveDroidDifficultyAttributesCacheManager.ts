import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { Modes } from "@rian8337/osu-base";
import { ExtendedDroidDifficultyAttributes } from "@rian8337/osu-difficulty-calculator";
import { DifficultyAttributesCacheManager } from "./DifficultyAttributesCacheManager";

/**
 * A cache manager for osu!droid live calculation difficulty attributes.
 */
export class LiveDroidDifficultyAttributesCacheManager extends DifficultyAttributesCacheManager<ExtendedDroidDifficultyAttributes> {
    protected override readonly attributeType: PPCalculationMethod =
        PPCalculationMethod.live;
    protected override readonly mode: Modes = Modes.Droid;
}
