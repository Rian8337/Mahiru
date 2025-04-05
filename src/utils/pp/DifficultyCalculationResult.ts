import { MapInfo } from "@rian8337/osu-base";
import { IDifficultyAttributes } from "@rian8337/osu-difficulty-calculator";
import { IDifficultyCalculationResult } from "@structures/utils/IDifficultyCalculationResult";

/**
 * Represents a beatmap's difficulty calculation result.
 */
export class DifficultyCalculationResult<DA extends IDifficultyAttributes>
    implements IDifficultyCalculationResult<DA>
{
    readonly map: MapInfo<true>;
    readonly attributes: DA;

    constructor(map: MapInfo<true>, attributes: DA) {
        this.map = map;
        this.attributes = attributes;
    }
}
