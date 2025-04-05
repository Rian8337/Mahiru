import { CacheableDifficultyAttributes } from "@rian8337/osu-difficulty-calculator";
import { CloneablePerformanceCalculationParameters } from "@structures/pp/CloneablePerformanceCalculationParameters";
import { PerformanceAttributes } from "./PerformanceAttributes";
import { RawDifficultyAttributes } from "./RawDifficultyAttributes";
import { ReplayAttributes } from "./ReplayAttributes";

/**
 * An attribute with complete calculation result.
 */
export interface CompleteCalculationAttributes<
    TDiffAttr extends RawDifficultyAttributes,
    TPerfAttr extends PerformanceAttributes,
> {
    /**
     * The parameters that were used to obtain the calculation result.
     */
    readonly params: CloneablePerformanceCalculationParameters<true>;

    /**
     * The difficulty attributes.
     */
    readonly difficulty: CacheableDifficultyAttributes<TDiffAttr>;

    /**
     * The performance attributes.
     */
    readonly performance: TPerfAttr;

    /**
     * The replay attributes, if any.
     */
    readonly replay?: ReplayAttributes;

    /**
     * The MD5 hash of the local replay file, if the file is present.
     */
    readonly localReplayMD5?: string;
}
