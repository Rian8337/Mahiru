import { Beatmap } from "@rian8337/osu-base";
import {
    DroidDifficultyAttributes,
    DroidDifficultyCalculator,
    DroidPerformanceCalculator,
    ExtendedDroidDifficultyAttributes,
} from "@rian8337/osu-difficulty-calculator";
import {
    ReplayAnalyzer,
    SliderCheeseInformation,
    ThreeFingerChecker,
} from "@rian8337/osu-droid-replay-analyzer";
import { Score } from "@rian8337/osu-droid-utilities";
import {
    DroidDifficultyAttributes as RebalanceDroidDifficultyAttributes,
    DroidDifficultyCalculator as RebalanceDroidDifficultyCalculator,
    DroidPerformanceCalculator as RebalanceDroidPerformanceCalculator,
    ExtendedDroidDifficultyAttributes as RebalanceExtendedDroidDifficultyAttributes,
} from "@rian8337/osu-rebalance-difficulty-calculator";
import { CacheManager } from "@utils/managers/CacheManager";
import { PerformanceCalculationResult } from "@utils/pp/PerformanceCalculationResult";
import { RebalancePerformanceCalculationResult } from "@utils/pp/RebalancePerformanceCalculationResult";
import { BeatmapDifficultyHelper } from "./BeatmapDifficultyHelper";
import { ReplayHelper } from "./ReplayHelper";

/**
 * A helper class for calculating osu!droid difficulty and performance of beatmaps or scores.
 */
export class DroidBeatmapDifficultyHelper extends BeatmapDifficultyHelper<
    DroidDifficultyAttributes,
    RebalanceDroidDifficultyAttributes,
    DroidPerformanceCalculator,
    RebalanceDroidPerformanceCalculator
> {
    protected override readonly difficultyAttributes =
        DroidDifficultyAttributes;

    protected override readonly difficultyCalculator =
        new DroidDifficultyCalculator();

    protected override readonly rebalanceDifficultyCalculator =
        new RebalanceDroidDifficultyCalculator();

    protected override readonly performanceCalculator =
        DroidPerformanceCalculator;
    protected override readonly rebalancePerformanceCalculator =
        RebalanceDroidPerformanceCalculator;
    protected override readonly liveDifficultyAttributesCache =
        CacheManager.difficultyAttributesCache.live.droid;
    protected override readonly rebalanceDifficultyAttributesCache =
        CacheManager.difficultyAttributesCache.rebalance.droid;

    /**
     * Applies a tap penalty to a calculation result.
     *
     * @param score The score associated to the calculation result.
     * @param beatmap The beatmap associated with the score.
     * @param calcResult The calculation result to apply the tap penalty to.
     * @param replay The existing replay analyzer instance, if any.
     */
    static async applyTapPenalty(
        score: Score,
        beatmap: Beatmap,
        calcResult:
            | PerformanceCalculationResult<DroidPerformanceCalculator>
            | RebalancePerformanceCalculationResult<RebalanceDroidPerformanceCalculator>,
        replay?: ReplayAnalyzer
    ): Promise<void> {
        const difficultyAttributes = <
            | ExtendedDroidDifficultyAttributes
            | RebalanceExtendedDroidDifficultyAttributes
        >calcResult.result.difficultyAttributes;
        if (!ThreeFingerChecker.isEligibleToDetect(difficultyAttributes)) {
            return;
        }

        replay ??= await ReplayHelper.analyzeReplay(score);

        if (!replay.data) {
            return;
        }

        if (!replay.hasBeenCheckedFor3Finger) {
            replay.beatmap ??= beatmap;
            replay.difficultyAttributes = difficultyAttributes;
            replay.checkFor3Finger();

            if (replay.tapPenalty > 1) {
                calcResult.params;
            }
            calcResult.params.tapPenalty = replay.tapPenalty;
        }

        calcResult.result.applyTapPenalty(replay.tapPenalty);
    }

    /**
     * Applies aim penalty to a score.
     *
     * @param beatmap The beatmap associated with the score.
     * @param score The score.
     * @param attributes The difficulty attributes of the score.
     * @param tapPenalty The tap penalty to preemptively apply.
     * @param sliderCheesePenalty The slider cheese penalty to preemptively apply.
     * @param replay The existing replay analyzer instance, if any.
     * @returns The performance calculation result.
     */
    static async applyAimPenalty(
        beatmap: Beatmap,
        score: Score,
        attributes: ExtendedDroidDifficultyAttributes,
        tapPenalty?: number,
        sliderCheesePenalty?: SliderCheeseInformation,
        replay?: ReplayAnalyzer
    ): Promise<PerformanceCalculationResult<DroidPerformanceCalculator>>;

    /**
     * Applies aim penalty to a score.
     *
     * @param beatmap The beatmap associated with the score.
     * @param score The score.
     * @param attributes The difficulty attributes of the score.
     * @param tapPenalty The tap penalty to preemptively apply.
     * @param sliderCheesePenalty The slider cheese penalty to preemptively apply.
     * @param replay The existing replay analyzer instance, if any.
     * @returns The performance calculation result.
     */
    static async applyAimPenalty(
        beatmap: Beatmap,
        score: Score,
        attributes: RebalanceExtendedDroidDifficultyAttributes,
        tapPenalty?: number,
        sliderCheesePenalty?: SliderCheeseInformation,
        replay?: ReplayAnalyzer
    ): Promise<
        RebalancePerformanceCalculationResult<RebalanceDroidPerformanceCalculator>
    >;

    static async applyAimPenalty(
        beatmap: Beatmap,
        score: Score,
        attributes:
            | ExtendedDroidDifficultyAttributes
            | RebalanceExtendedDroidDifficultyAttributes,
        tapPenalty: number = 1,
        sliderCheesePenalty?: SliderCheeseInformation,
        replay?: ReplayAnalyzer
    ): Promise<
        | PerformanceCalculationResult<DroidPerformanceCalculator>
        | RebalancePerformanceCalculationResult<RebalanceDroidPerformanceCalculator>
    > {
        replay ??= await ReplayHelper.analyzeReplay(score);

        if (!replay.hasBeenCheckedFor2Hand) {
            replay.beatmap = beatmap;
            replay.checkFor2Hand();
        }

        const diffCalcHelper = new DroidBeatmapDifficultyHelper();
        const calculationParams = this.getCalculationParamsFromScore(score);

        calculationParams.tapPenalty = tapPenalty;
        calculationParams.sliderCheesePenalty = sliderCheesePenalty;

        if (attributes.mode === "live") {
            return diffCalcHelper.calculateBeatmapPerformance(
                attributes,
                calculationParams
            );
        } else {
            return diffCalcHelper.calculateBeatmapRebalancePerformance(
                attributes,
                calculationParams
            );
        }
    }

    /**
     * Applies a slider cheese penalty to a calculation result.
     *
     * @param score The score associated to the calculation result.
     * @param beatmap The beatmap associated with the score.
     * @param calcResult The calculation result to apply the slider cheese penalty to.
     * @param replay The existing replay analyzer instance, if any.
     */
    static async applySliderCheesePenalty(
        score: Score,
        beatmap: Beatmap,
        calcResult:
            | PerformanceCalculationResult<DroidPerformanceCalculator>
            | RebalancePerformanceCalculationResult<RebalanceDroidPerformanceCalculator>,
        replay?: ReplayAnalyzer
    ): Promise<void> {
        if (beatmap.hitObjects.sliders === 0) {
            return;
        }

        replay ??= await ReplayHelper.analyzeReplay(score);

        if (!replay.data) {
            return;
        }

        if (!replay.hasBeenCheckedForSliderCheesing) {
            replay.beatmap ??= beatmap;
            replay.checkForSliderCheesing();
            calcResult.params.sliderCheesePenalty = replay.sliderCheesePenalty;
        }

        calcResult.result.applyAimSliderCheesePenalty(
            replay.sliderCheesePenalty.aimPenalty
        );
        calcResult.result.applyFlashlightSliderCheesePenalty(
            replay.sliderCheesePenalty.flashlightPenalty
        );
    }
}
