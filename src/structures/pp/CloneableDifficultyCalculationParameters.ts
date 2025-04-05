import { SerializedMod } from "@rian8337/osu-base";

/**
 * Represents a parameter to alter difficulty calculation result that can be cloned
 * for specific purposes (i.e., passing data between worker threads).
 */
export interface CloneableDifficultyCalculationParameters {
    /**
     * The mods to calculate for.
     */
    mods: SerializedMod[];
}
