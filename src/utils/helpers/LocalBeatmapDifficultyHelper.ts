import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { Beatmap, Modes } from "@rian8337/osu-base";
import {
    DroidDifficultyAttributes,
    DroidDifficultyCalculator,
    DroidPerformanceCalculator,
    ExtendedDroidDifficultyAttributes,
    OsuDifficultyAttributes,
    OsuDifficultyCalculator,
    OsuPerformanceCalculator,
    PerformanceCalculationOptions,
} from "@rian8337/osu-difficulty-calculator";
import {
    DroidDifficultyAttributes as RebalanceDroidDifficultyAttributes,
    DroidDifficultyCalculator as RebalanceDroidDifficultyCalculator,
    DroidPerformanceCalculator as RebalanceDroidPerformanceCalculator,
    ExtendedDroidDifficultyAttributes as RebalanceExtendedDroidDifficultyAttributes,
    OsuDifficultyAttributes as RebalanceOsuDifficultyAttributes,
    OsuDifficultyCalculator as RebalanceOsuDifficultyCalculator,
    OsuPerformanceCalculator as RebalanceOsuPerformanceCalculator,
} from "@rian8337/osu-rebalance-difficulty-calculator";
import { DifficultyCalculationParameters } from "@utils/pp/DifficultyCalculationParameters";
import { PerformanceCalculationParameters } from "@utils/pp/PerformanceCalculationParameters";

/**
 * A helper for calculating beatmaps that are stored locally.
 */
export abstract class LocalBeatmapDifficultyHelper {
    /**
     * Calculates the difficulty of a beatmap.
     *
     * @param beatmap The beatmap to calculate.
     * @param mode The gamemode to calculate.
     * @param method The calculation method to use.
     * @param calculationParams The calculation parameters.
     * @returns The difficulty attributes of the beatmap.
     */
    static calculateDifficulty(
        beatmap: Beatmap,
        mode: Modes.droid,
        method: PPCalculationMethod.live,
        calculationParams?: DifficultyCalculationParameters
    ): ExtendedDroidDifficultyAttributes;

    /**
     * Calculates the difficulty of a beatmap.
     *
     * @param beatmap The beatmap to calculate.
     * @param mode The gamemode to calculate.
     * @param method The calculation method to use.
     * @param calculationParams The calculation parameters.
     * @returns The difficulty attributes of the beatmap.
     */
    static calculateDifficulty(
        beatmap: Beatmap,
        mode: Modes.osu,
        method: PPCalculationMethod.live,
        calculationParams?: DifficultyCalculationParameters
    ): OsuDifficultyAttributes;

    /**
     * Calculates the difficulty of a beatmap.
     *
     * @param beatmap The beatmap to calculate.
     * @param mode The gamemode to calculate.
     * @param method The calculation method to use.
     * @param calculationParams The calculation parameters.
     * @returns The difficulty attributes of the beatmap.
     */
    static calculateDifficulty(
        beatmap: Beatmap,
        mode: Modes.droid,
        method: PPCalculationMethod.rebalance,
        calculationParams?: DifficultyCalculationParameters
    ): RebalanceExtendedDroidDifficultyAttributes;

    /**
     * Calculates the difficulty of a beatmap.
     *
     * @param beatmap The beatmap to calculate.
     * @param mode The gamemode to calculate.
     * @param method The calculation method to use.
     * @param calculationParams The calculation parameters.
     * @returns The calculator instance that calculated the beatmap.
     */
    static calculateDifficulty(
        beatmap: Beatmap,
        mode: Modes.osu,
        method: PPCalculationMethod.rebalance,
        calculationParams?: DifficultyCalculationParameters
    ): RebalanceOsuDifficultyAttributes;

    static calculateDifficulty(
        beatmap: Beatmap,
        mode: Modes,
        method: PPCalculationMethod,
        calculationParams?: DifficultyCalculationParameters
    ):
        | ExtendedDroidDifficultyAttributes
        | OsuDifficultyAttributes
        | RebalanceExtendedDroidDifficultyAttributes
        | RebalanceOsuDifficultyAttributes {
        if (mode === Modes.droid) {
            switch (method) {
                case PPCalculationMethod.live:
                    return new DroidDifficultyCalculator().calculate(
                        beatmap,
                        calculationParams?.mods
                    );

                case PPCalculationMethod.rebalance:
                    return new RebalanceDroidDifficultyCalculator().calculate(
                        beatmap,
                        calculationParams?.mods
                    );
            }
        } else {
            switch (method) {
                case PPCalculationMethod.rebalance:
                    return new RebalanceOsuDifficultyCalculator().calculate(
                        beatmap,
                        calculationParams?.mods
                    );

                default:
                    return new OsuDifficultyCalculator().calculate(
                        beatmap,
                        calculationParams?.mods
                    );
            }
        }
    }

    /**
     * Calculates the performance of a beatmap.
     *
     * @param attributes The difficulty attributes of the beatmap.
     * @param calculationParams The calculation parameters.
     * @returns The performance calculator instance.
     */
    static calculatePerformance(
        attributes: DroidDifficultyAttributes,
        calculationParams: PerformanceCalculationParameters
    ): DroidPerformanceCalculator;

    /**
     * Calculates the performance of a beatmap.
     *
     * @param attributes The difficulty attributes of the beatmap.
     * @param calculationParams The calculation parameters.
     * @returns The performance calculator instance.
     */
    static calculatePerformance(
        attributes: RebalanceDroidDifficultyAttributes,
        calculationParams: PerformanceCalculationParameters
    ): RebalanceDroidPerformanceCalculator;

    /**
     * Calculates the performance of a beatmap.
     *
     * @param attributes The difficulty attributes of the beatmap.
     * @param calculationParams The calculation parameters.
     * @returns The performance calculator instance.
     */
    static calculatePerformance(
        attributes: OsuDifficultyAttributes,
        calculationParams: PerformanceCalculationParameters
    ): OsuPerformanceCalculator;

    /**
     * Calculates the performance of a beatmap.
     *
     * @param attributes The difficulty attributes of the beatmap.
     * @param calculationParams The calculation parameters.
     * @returns The performance calculator instance.
     */
    static calculatePerformance(
        attributes: RebalanceOsuDifficultyAttributes,
        calculationParams: PerformanceCalculationParameters
    ): RebalanceOsuPerformanceCalculator;

    static calculatePerformance(
        attributes:
            | DroidDifficultyAttributes
            | RebalanceOsuDifficultyAttributes
            | OsuDifficultyAttributes
            | RebalanceOsuDifficultyAttributes,
        calculationParams: PerformanceCalculationParameters
    ):
        | DroidPerformanceCalculator
        | RebalanceDroidPerformanceCalculator
        | OsuPerformanceCalculator
        | RebalanceOsuPerformanceCalculator {
        calculationParams.applyFromAttributes(attributes);

        const calculationOptions: PerformanceCalculationOptions = {
            combo: calculationParams.combo,
            accPercent: calculationParams.accuracy,
            tapPenalty: calculationParams.tapPenalty,
        };

        if (attributes instanceof DroidDifficultyAttributes) {
            return new DroidPerformanceCalculator(attributes).calculate(
                calculationOptions
            );
        } else if (attributes instanceof OsuDifficultyAttributes) {
            return new OsuPerformanceCalculator(attributes).calculate(
                calculationOptions
            );
        } else if (attributes instanceof RebalanceDroidDifficultyAttributes) {
            return new RebalanceDroidPerformanceCalculator(
                attributes
            ).calculate(calculationOptions);
        } else {
            return new RebalanceOsuPerformanceCalculator(attributes).calculate(
                calculationOptions
            );
        }
    }
}
