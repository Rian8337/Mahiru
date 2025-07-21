import { OfficialDatabaseScore } from "@database/official/schema/OfficialDatabaseScore";
import { RecentPlay } from "@database/utils/aliceDb/RecentPlay";
import {
    Accuracy,
    MapInfo,
    ModCustomSpeed,
    ModDifficultyAdjust,
    ModMap,
    ModUtil,
    PlayableBeatmap,
    SerializedMod,
} from "@rian8337/osu-base";
import {
    CacheableDifficultyAttributes,
    DifficultyAttributes,
    DifficultyCalculator,
    DifficultyHitObject,
    IDifficultyAttributes,
    PerformanceCalculator,
} from "@rian8337/osu-difficulty-calculator";
import { Score } from "@rian8337/osu-droid-utilities";
import {
    IDifficultyAttributes as IRebalanceDifficultyAttributes,
    DifficultyAttributes as RebalanceDifficultyAttributes,
    DifficultyCalculator as RebalanceDifficultyCalculator,
    DifficultyHitObject as RebalanceDifficultyHitObject,
    PerformanceCalculator as RebalancePerformanceCalculator,
} from "@rian8337/osu-rebalance-difficulty-calculator";
import { DifficultyAttributesCacheManager } from "@utils/difficultyattributescache/DifficultyAttributesCacheManager";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { DifficultyCalculationParameters } from "@utils/pp/DifficultyCalculationParameters";
import { DifficultyCalculationResult } from "@utils/pp/DifficultyCalculationResult";
import { PerformanceCalculationParameters } from "@utils/pp/PerformanceCalculationParameters";
import { PerformanceCalculationResult } from "@utils/pp/PerformanceCalculationResult";
import { RebalanceDifficultyCalculationResult } from "@utils/pp/RebalanceDifficultyCalculationResult";
import { RebalancePerformanceCalculationResult } from "@utils/pp/RebalancePerformanceCalculationResult";
import { NumberHelper } from "./NumberHelper";

/**
 * A helper class for calculating difficulty and performance of beatmaps or scores.
 */
export abstract class BeatmapDifficultyHelper<
    DA extends DifficultyAttributes,
    RDA extends RebalanceDifficultyAttributes,
    PC extends PerformanceCalculator<IDifficultyAttributes>,
    RPC extends RebalancePerformanceCalculator<IRebalanceDifficultyAttributes>,
> {
    /**
     * The type of the difficulty attributes.
     */
    protected abstract readonly difficultyAttributes: new (
        data: CacheableDifficultyAttributes<DA>
    ) => DA;

    /**
     * The difficulty calculator to use.
     */
    protected abstract readonly difficultyCalculator: DifficultyCalculator<
        PlayableBeatmap,
        DifficultyHitObject,
        DA
    >;

    /**
     * The rebalance difficulty calculator to use.
     */
    protected abstract readonly rebalanceDifficultyCalculator: RebalanceDifficultyCalculator<
        PlayableBeatmap,
        RebalanceDifficultyHitObject,
        RDA
    >;

    /**
     * The performance calculator to use.
     */
    protected abstract readonly performanceCalculator: new (
        difficultyAttributes: DA | CacheableDifficultyAttributes<DA>
    ) => PC;

    /**
     * The rebalance performance calculator to use.
     */
    protected abstract readonly rebalancePerformanceCalculator: new (
        difficultyAttributes: RDA | CacheableDifficultyAttributes<RDA>
    ) => RPC;

    /**
     * The cache manager responsible for storing live calculation difficulty attributes.
     */
    protected abstract readonly liveDifficultyAttributesCache: DifficultyAttributesCacheManager<DA>;

    /**
     * The cache manager responsible for storing rebalance calculation difficulty attributes.
     */
    protected abstract readonly rebalanceDifficultyAttributesCache: DifficultyAttributesCacheManager<RDA>;

    /**
     * Gets calculation parameters from a user's message.
     *
     * @param message The user's message.
     * @returns The calculation parameters from the user's message.
     */
    static getCalculationParamsFromMessage(
        message: string
    ): PerformanceCalculationParameters {
        const mods = new ModMap();
        let combo: number | undefined;
        let forceCS: number | undefined;
        let forceAR: number | undefined;
        let forceOD: number | undefined;
        let customSpeedMultiplier = 1;

        let accPercent = 100;
        let countMiss = 0;
        let count100 = 0;
        let count50 = 0;

        for (const input of message.split(/\s+/g)) {
            if (input.endsWith("%")) {
                const newAccPercent = parseFloat(input);

                if (!Number.isNaN(newAccPercent)) {
                    accPercent = NumberHelper.clamp(newAccPercent, 0, 100);
                }
            }

            if (input.endsWith("m")) {
                const newCountMiss = parseInt(input);

                if (!Number.isNaN(newCountMiss)) {
                    countMiss = Math.max(0, newCountMiss);
                }
            }

            if (input.endsWith("x")) {
                if (input.includes(".")) {
                    const newSpeedMultiplier = parseFloat(input);

                    if (!Number.isNaN(newSpeedMultiplier)) {
                        customSpeedMultiplier = Math.max(
                            0.5,
                            Math.min(
                                2,
                                NumberHelper.round(newSpeedMultiplier, 2)
                            )
                        );
                    }
                } else {
                    const newCombo = parseInt(input);

                    if (!Number.isNaN(newCombo)) {
                        combo = Math.max(0, newCombo);
                    }
                }
            }

            if (input.startsWith("+")) {
                const map = ModUtil.pcStringToMods(input.substring(1));

                for (const mod of map.values()) {
                    mods.set(mod);
                }
            }

            if (input.startsWith("CS")) {
                const newForceCS = parseFloat(input.substring(2));

                if (!Number.isNaN(newForceCS)) {
                    forceCS = NumberHelper.clamp(
                        NumberHelper.round(newForceCS, 2),
                        0,
                        15
                    );
                }
            }

            if (input.startsWith("AR")) {
                const newForceAR = parseFloat(input.substring(2));

                if (!Number.isNaN(newForceAR)) {
                    forceAR = NumberHelper.clamp(
                        NumberHelper.round(newForceAR, 2),
                        0,
                        12.5
                    );
                }
            }

            if (input.startsWith("OD")) {
                const newForceOD = parseFloat(input.substring(2));

                if (!Number.isNaN(newForceOD)) {
                    forceOD = NumberHelper.clamp(
                        NumberHelper.round(newForceOD, 2),
                        0,
                        11
                    );
                }
            }

            if (input.endsWith("x50")) {
                const newCount50 = parseInt(input);

                if (!Number.isNaN(newCount50)) {
                    count50 = Math.max(0, newCount50);
                }
            }

            if (input.endsWith("x100")) {
                const newCount100 = parseInt(input);

                if (!Number.isNaN(newCount100)) {
                    count100 = Math.max(0, newCount100);
                }
            }
        }

        if (customSpeedMultiplier !== 1) {
            const customSpeed =
                mods.get(ModCustomSpeed) ?? new ModCustomSpeed();

            customSpeed.trackRateMultiplier.value = customSpeedMultiplier;

            mods.set(customSpeed);
        }

        if (
            forceCS !== undefined ||
            forceAR !== undefined ||
            forceOD !== undefined
        ) {
            mods.set(
                new ModDifficultyAdjust({
                    cs: forceCS,
                    ar: forceAR,
                    od: forceOD,
                })
            );
        }

        return new PerformanceCalculationParameters({
            mods: mods,
            accuracy: new Accuracy({
                n100: count100,
                n50: count50,
                nmiss: countMiss,
            }),
            inputAccuracy: accPercent,
            combo: combo,
        });
    }

    /**
     * Gets calculation parameters from a score.
     *
     * @param score The score.
     * @returns Calculation parameters of the score.
     */
    static getCalculationParamsFromScore(
        score:
            | Pick<
                  OfficialDatabaseScore,
                  "combo" | "mods" | "perfect" | "good" | "bad" | "miss"
              >
            | Score
            | RecentPlay
    ): PerformanceCalculationParameters {
        if (score instanceof Score || score instanceof RecentPlay) {
            return new PerformanceCalculationParameters({
                accuracy: score.accuracy,
                combo: score.combo,
                mods: score.mods,
            });
        } else {
            return new PerformanceCalculationParameters({
                accuracy: new Accuracy({
                    n300: score.perfect,
                    n100: score.good,
                    n50: score.bad,
                    nmiss: score.miss,
                }),
                combo: score.combo,
                mods: ModUtil.deserializeMods(
                    JSON.parse(score.mods) as SerializedMod[]
                ),
            });
        }
    }

    /**
     * Calculates the difficulty and performance value of a score.
     *
     * @param score The score.
     * @param calcParams Calculation parameters to override the score's default calculation parameters.
     * @returns The result of the calculation, `null` if the beatmap is not found.
     */
    async calculateScorePerformance(
        score: Score,
        calcParams?: PerformanceCalculationParameters
    ): Promise<PerformanceCalculationResult<PC> | null> {
        const beatmap: MapInfo | null = await BeatmapManager.getBeatmap(
            score.hash,
            { checkFile: false }
        );

        if (!beatmap) {
            return null;
        }

        calcParams ??=
            BeatmapDifficultyHelper.getCalculationParamsFromScore(score);

        let cachedAttributes =
            this.liveDifficultyAttributesCache.getDifficultyAttributes(
                beatmap,
                score.mods
            );

        if (!cachedAttributes) {
            const result = await this.calculateDifficulty(beatmap, calcParams);

            if (result) {
                cachedAttributes = result.attributes.toCacheableAttributes();
            }
        }

        if (!cachedAttributes) {
            return null;
        }

        return this.calculatePerformance(cachedAttributes, calcParams);
    }

    /**
     * Calculates the rebalance difficulty and performance value of a score.
     *
     * @param score The score.
     * @param calcParams Calculation parameters to override the score's default calculation parameters.
     * @returns The result of the calculation, `null` if the beatmap is not found.
     */
    async calculateScoreRebalancePerformance(
        score: Score,
        calcParams?: PerformanceCalculationParameters
    ): Promise<RebalancePerformanceCalculationResult<RPC> | null> {
        const beatmap: MapInfo | null = await BeatmapManager.getBeatmap(
            score.hash,
            { checkFile: false }
        );

        if (!beatmap) {
            return null;
        }

        calcParams ??=
            BeatmapDifficultyHelper.getCalculationParamsFromScore(score);

        let cachedAttributes =
            this.rebalanceDifficultyAttributesCache.getDifficultyAttributes(
                beatmap,
                score.mods
            );

        if (!cachedAttributes) {
            const result = await this.calculateRebalanceDifficulty(
                beatmap,
                calcParams
            );

            if (result) {
                cachedAttributes = result.attributes.toCacheableAttributes();
            }
        }

        if (!cachedAttributes) {
            return null;
        }

        return this.calculateRebalancePerformance(cachedAttributes, calcParams);
    }

    /**
     * Calculates the difficulty and/or performance value of a beatmap.
     *
     * @param beatmap The beatmap to calculate.
     * @param calculationParams Calculation parameters. If unspecified, will calculate for No Mod SS.
     * @returns The result of the calculation, `null` if the beatmap is not found.
     */
    async calculateBeatmapPerformance(
        beatmap: MapInfo,
        calculationParams?: PerformanceCalculationParameters
    ): Promise<PerformanceCalculationResult<PC> | null>;

    /**
     * Calculates the difficulty and/or performance value of a beatmap.
     *
     * @param attributes The difficulty attributes of the beatmap.
     * @param calculationParams Calculation parameters. If unspecified, will calculate for No Mod SS.
     * @returns The result of the calculation, `null` if the beatmap is not found.
     */
    async calculateBeatmapPerformance(
        attributes: DA | CacheableDifficultyAttributes<DA>,
        calculationParams?: PerformanceCalculationParameters
    ): Promise<PerformanceCalculationResult<PC>>;

    /**
     * Calculates the difficulty and/or performance value of a beatmap.
     *
     * @param beatmapIdOrHash The ID or MD5 hash of the beatmap.
     * @param calculationParams Calculation parameters. If unspecified, will calculate for No Mod SS.
     * @returns The result of the calculation, `null` if the beatmap is not found.
     */
    async calculateBeatmapPerformance(
        beatmapIdOrHash: number | string,
        calculationParams?: PerformanceCalculationParameters
    ): Promise<PerformanceCalculationResult<PC> | null>;

    async calculateBeatmapPerformance(
        beatmapOrHashOrDA:
            | MapInfo
            | number
            | string
            | DA
            | CacheableDifficultyAttributes<DA>,
        calculationParams?: PerformanceCalculationParameters
    ): Promise<PerformanceCalculationResult<PC> | null> {
        let beatmap: MapInfo | null;

        if (beatmapOrHashOrDA instanceof MapInfo) {
            beatmap = beatmapOrHashOrDA;
        } else if (
            typeof beatmapOrHashOrDA === "number" ||
            typeof beatmapOrHashOrDA === "string"
        ) {
            beatmap = await BeatmapManager.getBeatmap(beatmapOrHashOrDA, {
                checkFile: false,
            });
        } else {
            return this.calculatePerformance(
                beatmapOrHashOrDA,
                calculationParams ??
                    new PerformanceCalculationParameters({
                        accuracy: new Accuracy({
                            n300:
                                beatmapOrHashOrDA.hitCircleCount +
                                beatmapOrHashOrDA.sliderCount +
                                beatmapOrHashOrDA.spinnerCount,
                        }),
                        inputAccuracy: 100,
                        combo: beatmapOrHashOrDA.maxCombo,
                    })
            );
        }

        if (!beatmap) {
            return null;
        }

        calculationParams ??= new PerformanceCalculationParameters({
            accuracy: new Accuracy({
                n300: beatmap.objects,
            }),
            inputAccuracy: 100,
            combo: beatmap.maxCombo ?? undefined,
        });

        let cachedAttributes =
            this.liveDifficultyAttributesCache.getDifficultyAttributes(
                beatmap,
                calculationParams.mods
            );

        if (!cachedAttributes) {
            const star = await this.calculateDifficulty(
                beatmap,
                calculationParams
            );

            if (star) {
                cachedAttributes = star.attributes.toCacheableAttributes();
            }
        }

        if (!cachedAttributes) {
            return null;
        }

        return this.calculatePerformance(cachedAttributes, calculationParams);
    }

    /**
     * Calculates the rebalance difficulty and/or performance value of a beatmap.
     *
     * @param beatmap The beatmap to calculate.
     * @param calculationParams Calculation parameters. If unspecified, will calculate for No Mod SS.
     * @returns The result of the calculation, `null` if the beatmap is not found.
     */
    async calculateBeatmapRebalancePerformance(
        beatmap: MapInfo,
        calculationParams?: PerformanceCalculationParameters
    ): Promise<RebalancePerformanceCalculationResult<RPC> | null>;

    /**
     * Calculates the rebalance difficulty and/or performance value of a beatmap.
     *
     * @param attributes The difficulty attributes of the beatmap.
     * @param calculationParams Calculation parameters. If unspecified, will calculate for No Mod SS.
     * @returns The result of the calculation, `null` if the beatmap is not found.
     */
    async calculateBeatmapRebalancePerformance(
        attributes: RDA | CacheableDifficultyAttributes<RDA>,
        calculationParams?: PerformanceCalculationParameters
    ): Promise<RebalancePerformanceCalculationResult<RPC>>;

    /**
     * Calculates the rebalance difficulty and/or performance value of a beatmap.
     *
     * @param beatmapIDorHash The ID or MD5 hash of the beatmap.
     * @param calculationParams Calculation parameters. If unspecified, will calculate for No Mod SS.
     * @returns The result of the calculation, `null` if the beatmap is not found.
     */
    async calculateBeatmapRebalancePerformance(
        beatmapIDorHash: number | string,
        calculationParams?: PerformanceCalculationParameters
    ): Promise<RebalancePerformanceCalculationResult<RPC> | null>;

    async calculateBeatmapRebalancePerformance(
        beatmapOrHashOrDA:
            | MapInfo
            | number
            | string
            | RDA
            | CacheableDifficultyAttributes<RDA>,
        calculationParams?: PerformanceCalculationParameters
    ): Promise<RebalancePerformanceCalculationResult<RPC> | null> {
        let beatmap: MapInfo | null;

        if (beatmapOrHashOrDA instanceof MapInfo) {
            beatmap = beatmapOrHashOrDA;
        } else if (
            typeof beatmapOrHashOrDA === "number" ||
            typeof beatmapOrHashOrDA === "string"
        ) {
            beatmap = await BeatmapManager.getBeatmap(beatmapOrHashOrDA, {
                checkFile: false,
            });
        } else {
            return this.calculateRebalancePerformance(
                beatmapOrHashOrDA,
                calculationParams ??
                    new PerformanceCalculationParameters({
                        accuracy: new Accuracy({
                            n300:
                                beatmapOrHashOrDA.hitCircleCount +
                                beatmapOrHashOrDA.sliderCount +
                                beatmapOrHashOrDA.spinnerCount,
                        }),
                        inputAccuracy: 100,
                        combo: beatmapOrHashOrDA.maxCombo,
                    })
            );
        }

        if (!beatmap) {
            return null;
        }

        calculationParams ??= new PerformanceCalculationParameters({
            accuracy: new Accuracy({
                n300: beatmap.objects,
            }),
            inputAccuracy: 100,
            combo: beatmap.maxCombo ?? undefined,
        });

        let cachedAttributes =
            this.rebalanceDifficultyAttributesCache.getDifficultyAttributes(
                beatmap,
                calculationParams.mods
            );

        if (!cachedAttributes) {
            const star = await this.calculateRebalanceDifficulty(
                beatmap,
                calculationParams
            );

            if (star) {
                cachedAttributes = star.attributes.toCacheableAttributes();
            }
        }

        if (!cachedAttributes) {
            return null;
        }

        return this.calculateRebalancePerformance(
            cachedAttributes,
            calculationParams
        );
    }

    /**
     * Calculates the difficulty of the beatmap being played in a score.
     *
     * @param score The score to calculate.
     * @returns The calculation result.
     */
    async calculateScoreDifficulty(
        score: Score
    ): Promise<DifficultyCalculationResult<DA> | null> {
        const beatmap = await BeatmapManager.getBeatmap(score.hash);

        if (!beatmap) {
            return null;
        }

        return this.calculateDifficulty(
            beatmap,
            BeatmapDifficultyHelper.getCalculationParamsFromScore(score)
        );
    }

    /**
     * Calculates the rebalance difficulty of the beatmap being played in a score.
     *
     * @param score The score to calculate.
     * @returns The calculation result.
     */
    async calculateScoreRebalanceDifficulty(
        score: Score
    ): Promise<RebalanceDifficultyCalculationResult<RDA> | null> {
        const beatmap = await BeatmapManager.getBeatmap(score.hash);

        if (!beatmap) {
            return null;
        }

        return this.calculateRebalanceDifficulty(
            beatmap,
            BeatmapDifficultyHelper.getCalculationParamsFromScore(score)
        );
    }

    /**
     * Calculates the difficulty of a beatmap.
     *
     * @param beatmap The beatmap.
     * @param calculationParams Calculation parameters.
     * @returns The calculation result.
     */
    async calculateBeatmapDifficulty(
        beatmap: MapInfo,
        calculationParams: DifficultyCalculationParameters
    ): Promise<DifficultyCalculationResult<DA> | null>;

    /**
     * Calculates the difficulty of a beatmap.
     *
     * @param beatmapIdOrHash The ID or MD5 hash of the beatmap.
     * @param calculationParams Calculation parameters.
     * @returns The calculation result.
     */
    async calculateBeatmapDifficulty(
        beatmapIdOrHash: number | string,
        calculationParams: DifficultyCalculationParameters
    ): Promise<DifficultyCalculationResult<DA> | null>;

    async calculateBeatmapDifficulty(
        beatmapOrIdOrHash: MapInfo | number | string,
        calculationParams: DifficultyCalculationParameters
    ): Promise<DifficultyCalculationResult<DA> | null> {
        const beatmap: MapInfo | null =
            beatmapOrIdOrHash instanceof MapInfo
                ? beatmapOrIdOrHash
                : await BeatmapManager.getBeatmap(beatmapOrIdOrHash);

        if (!beatmap) {
            return null;
        }

        return this.calculateDifficulty(beatmap, calculationParams);
    }

    /**
     * Calculates the rebalance difficulty of a beatmap.
     *
     * @param beatmap The beatmap.
     * @param calculationParams Calculation parameters.
     * @returns The calculation result.
     */
    async calculateBeatmapRebalanceDifficulty(
        beatmap: MapInfo,
        calculationParams: DifficultyCalculationParameters
    ): Promise<RebalanceDifficultyCalculationResult<RDA> | null>;

    /**
     * Calculates the rebalance difficulty of a beatmap.
     *
     * @param beatmapIdorHash The ID or MD5 hash of the beatmap.
     * @param calculationParams Calculation parameters.
     * @returns The calculation result.
     */
    async calculateBeatmapRebalanceDifficulty(
        beatmapIdorHash: number | string,
        calculationParams: DifficultyCalculationParameters
    ): Promise<RebalanceDifficultyCalculationResult<RDA> | null>;

    async calculateBeatmapRebalanceDifficulty(
        beatmapOrIdOrHash: MapInfo | number | string,
        calculationParams: DifficultyCalculationParameters
    ): Promise<RebalanceDifficultyCalculationResult<RDA> | null> {
        const beatmap: MapInfo | null =
            beatmapOrIdOrHash instanceof MapInfo
                ? beatmapOrIdOrHash
                : await BeatmapManager.getBeatmap(beatmapOrIdOrHash);

        if (!beatmap) {
            return null;
        }

        return this.calculateRebalanceDifficulty(beatmap, calculationParams);
    }

    /**
     * Calculates the difficulty of a beatmap.
     *
     * @param beatmap The beatmap to calculate.
     * @param calculationParams Calculation parameters.
     * @returns The calculation result.
     */
    private async calculateDifficulty(
        beatmap: MapInfo<true>,
        calculationParams?: DifficultyCalculationParameters
    ): Promise<DifficultyCalculationResult<DA> | null> {
        await this.initBeatmap(beatmap);

        if (
            !beatmap.hasDownloadedBeatmap() ||
            beatmap.beatmap.hitObjects.objects.length === 0
        ) {
            return null;
        }

        const attributes = this.difficultyCalculator.calculate(
            beatmap.beatmap,
            calculationParams?.mods
        );

        this.liveDifficultyAttributesCache.addAttribute(beatmap, attributes);

        return new DifficultyCalculationResult(beatmap, attributes);
    }

    /**
     * Calculates the rebalance difficulty of a beatmap.
     *
     * @param beatmap The beatmap to calculate.
     * @param calculationParams Calculation parameters.
     * @returns The calculation result.
     */
    private async calculateRebalanceDifficulty(
        beatmap: MapInfo<true>,
        calculationParams?: DifficultyCalculationParameters
    ): Promise<RebalanceDifficultyCalculationResult<RDA> | null> {
        await this.initBeatmap(beatmap);

        if (
            !beatmap.hasDownloadedBeatmap() ||
            beatmap.beatmap.hitObjects.objects.length === 0
        ) {
            return null;
        }

        const attributes = this.rebalanceDifficultyCalculator.calculate(
            beatmap.beatmap,
            calculationParams?.mods
        );

        this.rebalanceDifficultyAttributesCache.addAttribute(
            beatmap,
            attributes
        );

        return new RebalanceDifficultyCalculationResult(beatmap, attributes);
    }

    /**
     * Calculates the performance value of a beatmap.
     *
     * @param difficultyAttributes The difficulty attributes to calculate the performance value for.
     * @param calculationParams Calculation parameters.
     * @param difficultyCalculator The difficulty calculator that was used to calculate the beatmap.
     * @returns The result of the calculation.
     */
    private calculatePerformance(
        difficultyAttributes: DA | CacheableDifficultyAttributes<DA>,
        calculationParams: PerformanceCalculationParameters
    ): PerformanceCalculationResult<PC> | null {
        calculationParams.applyFromAttributes(difficultyAttributes);

        const pp = new this.performanceCalculator(
            difficultyAttributes
        ).calculate(calculationParams.toPerformanceCalculationOptions());

        return new PerformanceCalculationResult(calculationParams, pp);
    }

    /**
     * Calculates the performance value of a beatmap.
     *
     * @param difficultyAttributes The difficulty attributes to calculate the performance value for.
     * @param calculationParams Calculation parameters.
     * @param difficultyCalculator The difficulty calculator that was used to calculate the beatmap.
     * @returns The result of the calculation.
     */
    private calculateRebalancePerformance(
        difficultyAttributes: RDA | CacheableDifficultyAttributes<RDA>,
        calculationParams: PerformanceCalculationParameters
    ): RebalancePerformanceCalculationResult<RPC> | null {
        calculationParams.applyFromAttributes(difficultyAttributes);

        const pp = new this.rebalancePerformanceCalculator(
            difficultyAttributes
        ).calculate(calculationParams.toPerformanceCalculationOptions());

        return new RebalancePerformanceCalculationResult(calculationParams, pp);
    }

    /**
     * Initializes a beatmap by downloading its file when needed.
     *
     * @param beatmap The beatmap.
     */
    private async initBeatmap(beatmap: MapInfo): Promise<void> {
        await BeatmapManager.downloadBeatmap(beatmap);
    }
}
