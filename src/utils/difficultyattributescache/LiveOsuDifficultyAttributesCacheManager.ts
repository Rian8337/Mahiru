import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { Modes } from "@rian8337/osu-base";
import { OsuDifficultyAttributes } from "@rian8337/osu-difficulty-calculator";
import { DifficultyAttributesCacheManager } from "./DifficultyAttributesCacheManager";

/**
 * A cache manager for osu!standard live calculation difficulty attributes.
 */
export class LiveOsuDifficultyAttributesCacheManager extends DifficultyAttributesCacheManager<OsuDifficultyAttributes> {
    protected override readonly attributeType: PPCalculationMethod =
        PPCalculationMethod.live;
    protected override readonly mode: Modes = Modes.Osu;
}
