import {
    DroidDifficultyAttributes,
    IDifficultyAttributes,
    OsuDifficultyAttributes,
    PerformanceCalculator,
} from "@rian8337/osu-rebalance-difficulty-calculator";
import { IPerformanceCalculationResult } from "@structures/utils/IPerformanceCalculationResult";
import { PerformanceCalculationParameters } from "./PerformanceCalculationParameters";

/**
 * Represents a beatmap's performance calculation result.
 */
export class RebalancePerformanceCalculationResult<
    P extends PerformanceCalculator<IDifficultyAttributes>,
> implements IPerformanceCalculationResult<P>
{
    readonly params: PerformanceCalculationParameters;
    readonly result: P;

    get starRatingInfo(): string {
        const { difficultyAttributes } = this.result;
        let string = `${difficultyAttributes.starRating.toFixed(2)} stars (`;
        const starRatingDetails: string[] = [];

        const addDetail = (num: number, suffix: string) =>
            starRatingDetails.push(`${num.toFixed(2)} ${suffix}`);

        if ("tapDifficulty" in difficultyAttributes) {
            const droidDifficultyAttributes =
                difficultyAttributes as DroidDifficultyAttributes;

            addDetail(droidDifficultyAttributes.aimDifficulty, "aim");
            addDetail(droidDifficultyAttributes.tapDifficulty, "tap");
            addDetail(droidDifficultyAttributes.rhythmDifficulty, "rhythm");
            addDetail(
                droidDifficultyAttributes.flashlightDifficulty,
                "flashlight"
            );
            addDetail(droidDifficultyAttributes.readingDifficulty, "reading");
        } else {
            const osuDifficultyAttributes =
                difficultyAttributes as OsuDifficultyAttributes;

            addDetail(osuDifficultyAttributes.aimDifficulty, "aim");
            addDetail(osuDifficultyAttributes.speedDifficulty, "speed");
            addDetail(
                osuDifficultyAttributes.flashlightDifficulty,
                "flashlight"
            );
        }

        string += starRatingDetails.join(", ") + ")";

        return string;
    }

    constructor(params: PerformanceCalculationParameters, result: P) {
        this.params = params;
        this.result = result;
    }
}
