import { CloneableDifficultyCalculationParameters } from "@structures/pp/CloneableDifficultyCalculationParameters";
import { Mod, ModDifficultyAdjust, ModMap, ModUtil } from "@rian8337/osu-base";

/**
 * Represents a parameter to alter difficulty calculation result.
 */
export class DifficultyCalculationParameters {
    /**
     * Constructs a `DifficultyCalculationParameters` object from raw data.
     *
     * @param data The data.
     */
    static from(
        data: CloneableDifficultyCalculationParameters
    ): DifficultyCalculationParameters {
        return new this(ModUtil.deserializeMods(data.mods));
    }

    /**
     * The mods to calculate for.
     */
    mods: ModMap;

    constructor(mods = new ModMap()) {
        this.mods = mods;
    }

    /**
     * Returns a cloneable form of this parameter.
     */
    toCloneable(): CloneableDifficultyCalculationParameters {
        return { mods: this.mods.serializeMods() };
    }
}
