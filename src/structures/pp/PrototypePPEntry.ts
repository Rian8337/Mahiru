import { PPEntry } from "./PPEntry";

/**
 * Represents a prototype droid performance points (dpp) entry.
 */
export interface PrototypePPEntry extends PPEntry {
    /**
     * The maximum combo of the score.
     */
    maxCombo: number;

    /**
     * The previous star rating.
     */
    prevStarRating: number;

    /**
     * The previous aim difficulty.
     */
    prevAimDifficulty: number;

    /**
     * The previous tap difficulty.
     */
    prevTapDifficulty: number;

    /**
     * The previous rhythm difficulty.
     */
    prevRhythmDifficulty: number;

    /**
     * The previous flashlight difficulty.
     */
    prevFlashlightDifficulty: number;

    /**
     * The previous reading difficulty.
     */
    prevReadingDifficulty: number;

    /**
     * The new star rating.
     */
    newStarRating: number;

    /**
     * The new aim difficulty.
     */
    newAimDifficulty: number;

    /**
     * The new tap difficulty.
     */
    newTapDifficulty: number;

    /**
     * The new rhythm difficulty.
     */
    newRhythmDifficulty: number;

    /**
     * The new flashlight difficulty.
     */
    newFlashlightDifficulty: number;

    /**
     * The new reading difficulty.
     */
    newReadingDifficulty: number;

    /**
     * The pp before the score was recalculated.
     */
    prevPP: number;

    /**
     * The previous aim pp value.
     */
    prevAim: number;

    /**
     * The previous tap pp value.
     */
    prevTap: number;

    /**
     * The previous accuracy pp value.
     */
    prevAccuracy: number;

    /**
     * The previous flashlight pp value.
     */
    prevFlashlight: number;

    /**
     * The previous reading pp value.
     */
    prevReading: number;

    /**
     * The new aim pp value.
     */
    newAim: number;

    /**
     * The new tap pp value.
     */
    newTap: number;

    /**
     * The new accuracy pp value.
     */
    newAccuracy: number;

    /**
     * The new flashlight pp value.
     */
    newFlashlight: number;

    /**
     * The new reading pp value.
     */
    newReading: number;

    /**
     * The estimated unstable rate of the score.
     */
    estimatedUnstableRate: number;

    /**
     * The estimated speed unstable rate of the score.
     */
    estimatedSpeedUnstableRate: number;

    /**
     * The circle size of the played beatmap.
     */
    circleSize: number;

    /**
     * The approach rate of the played beatmap.
     */
    approachRate: number;

    /**
     * The evaluated osu!droid overall difficulty of the score.
     */
    overallDifficulty: number;

    /**
     * The amount of great hits achieved in the score.
     */
    hit300: number;

    /**
     * The amount of good hits achieved in the score.
     */
    hit100: number;

    /**
     * The amount of meh hits achieved in the score.
     */
    hit50: number;

    /**
     * The tap penalty in live.
     */
    liveTapPenalty: number;

    /**
     * The tap penalty in rebalance.
     */
    rebalanceTapPenalty: number;

    /**
     * The aim slider cheese penalty of the score.
     */
    aimSliderCheesePenalty: number;

    /**
     * The flashlight slider cheese penalty of the score.
     */
    flashlightSliderCheesePenalty: number;

    /**
     * The number of clickable objects weighted by difficulty.
     *
     * Related to tap difficulty.
     */
    speedNoteCount: number;
}
