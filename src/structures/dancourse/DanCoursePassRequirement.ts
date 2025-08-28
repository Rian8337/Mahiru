import { SerializedMod } from "@rian8337/osu-base";
import { DanCoursePassRequirementType } from "./DanCoursePassRequirementType";

/**
 * Represents a pass requirement of a dan course beatmap.
 */
export interface DanCoursePassRequirement {
    /**
     * The type of the pass requirement.
     */
    readonly id: DanCoursePassRequirementType;

    /**
     * The value that must be fulfilled to pass the course.
     */
    readonly value: number;

    /**
     * The combination of mods that must be used to pass the course.
     */
    readonly requiredMods?: SerializedMod[];

    /**
     * Whether to allow slider lock to be used.
     */
    readonly allowSliderLock?: boolean;
}
