import { Accuracy, ModMap, ModUtil } from "@rian8337/osu-base";
import { SliderCheeseInformation } from "@rian8337/osu-droid-replay-analyzer";
import {
    CacheableDifficultyAttributes,
    PerformanceCalculationOptions,
} from "@rian8337/osu-difficulty-calculator";
import { DifficultyCalculationParameters } from "./DifficultyCalculationParameters";
import { RawDifficultyAttributes } from "@structures/difficultyattributes/RawDifficultyAttributes";
import { CloneablePerformanceCalculationParameters } from "@structures/pp/CloneablePerformanceCalculationParameters";

/**
 * Represents a parameter to alter performance calculation result.
 */
export interface PerformanceCalculationParametersInit {
    /**
     * The mods to calculate for.
     */
    mods?: ModMap;

    /**
     * The combo achieved. Defaults to the beatmap's maximum combo.
     */
    combo?: number;

    /**
     * The accuracy achieved. Defaults to SS.
     */
    accuracy: Accuracy;

    /**
     * The accuracy that a user inputs, if any. Defaults to 100.
     */
    inputAccuracy?: number;

    /**
     * The amount of slider ticks that were missed.
     */
    sliderTicksMissed?: number;

    /**
     * The amount of slider ends that were dropped.
     */
    sliderEndsDropped?: number;

    /**
     * The total score achieved.
     */
    totalScore?: number;

    /**
     * The tap penalty to apply for penalized scores. Defaults to 1.
     */
    tapPenalty?: number;

    /**
     * The slider cheese penalties to apply for penalized scores. Each of them defaults to 1.
     */
    sliderCheesePenalty?: SliderCheeseInformation;
}

/**
 * Represents a parameter to alter performance calculation result.
 */
export class PerformanceCalculationParameters extends DifficultyCalculationParameters {
    /**
     * Constructs a `PerformanceCalculationParameters` object from raw data.
     *
     * @param data The data.
     */
    static override from(
        data: CloneablePerformanceCalculationParameters
    ): PerformanceCalculationParameters {
        return new this({
            ...data,
            accuracy: new Accuracy(data.accuracy),
            mods: ModUtil.deserializeMods(data.mods),
        });
    }

    /**
     * The combo achieved.
     */
    combo?: number;

    /**
     * The accuracy achieved.
     */
    accuracy: Accuracy;

    /**
     * The accuracy that a user inputs.
     */
    inputAccuracy: number;

    /**
     * The amount of slider ticks that were missed.
     */
    sliderTicksMissed?: number;

    /**
     * The amount of slider ends that were dropped.
     */
    sliderEndsDropped?: number;

    /**
     * The total score achieved.
     */
    totalScore?: number;

    /**
     * The tap penalty to apply for penalized scores. Defaults to 1.
     */
    tapPenalty?: number;

    /**
     * The slider cheese penalties to apply for penalized scores. Each of them defaults to 1.
     */
    sliderCheesePenalty?: SliderCheeseInformation;

    constructor(values: PerformanceCalculationParametersInit) {
        super(values.mods);

        this.combo = values.combo;
        this.accuracy = values.accuracy;
        this.inputAccuracy = values.inputAccuracy ?? 100;
        this.sliderTicksMissed = values.sliderTicksMissed;
        this.sliderEndsDropped = values.sliderEndsDropped;
        this.totalScore = values.totalScore;
        this.tapPenalty = values.tapPenalty;
        this.sliderCheesePenalty = values.sliderCheesePenalty;
    }

    /**
     * Applies difficulty attributes to alter this parameter.
     *
     * @param attributes The difficulty attributes.
     */
    applyFromAttributes(
        attributes:
            | CacheableDifficultyAttributes<RawDifficultyAttributes>
            | RawDifficultyAttributes
    ): void {
        this.combo ??= attributes.maxCombo;

        if (this.accuracy.n50 || this.accuracy.n100) {
            const objectCount =
                attributes.hitCircleCount +
                attributes.sliderCount +
                attributes.spinnerCount;

            this.accuracy = new Accuracy({
                ...this.accuracy,
                // Add remaining objects as misses.
                nmiss: Math.max(
                    0,
                    objectCount -
                        this.accuracy.n300 -
                        this.accuracy.n100 -
                        this.accuracy.n50
                ),
            });
        }
    }

    /**
     * Recalculates the accuracy of this parameter.
     *
     * @param objectCount The amount of objects.
     */
    recalculateAccuracy(objectCount: number): void {
        if (this.accuracy.n50 || this.accuracy.n100) {
            this.accuracy = new Accuracy({
                n300:
                    objectCount -
                    this.accuracy.n100 -
                    this.accuracy.n50 -
                    this.accuracy.nmiss,
                n100: this.accuracy.n100,
                n50: this.accuracy.n50,
                nmiss: this.accuracy.nmiss,
            });
        } else {
            this.accuracy = new Accuracy({
                percent: this.inputAccuracy,
                nmiss: this.accuracy.nmiss,
                nobjects: objectCount,
            });
        }
    }

    /**
     * Converts this parameter to a `PerformanceCalculationOptions`.
     */
    toPerformanceCalculationOptions(): PerformanceCalculationOptions {
        return {
            combo: this.combo,
            accPercent: this.accuracy,
            tapPenalty: this.tapPenalty,
            aimSliderCheesePenalty: this.sliderCheesePenalty?.aimPenalty ?? 1,
            flashlightSliderCheesePenalty:
                this.sliderCheesePenalty?.flashlightPenalty ?? 1,
        };
    }

    /**
     * Returns a cloneable form of this parameter.
     */
    override toCloneable(): CloneablePerformanceCalculationParameters {
        return {
            ...super.toCloneable(),
            accuracy: {
                ...this.accuracy,
            },
            combo: this.combo,
            tapPenalty: this.tapPenalty,
            sliderCheesePenalty: this.sliderCheesePenalty,
        };
    }
}
