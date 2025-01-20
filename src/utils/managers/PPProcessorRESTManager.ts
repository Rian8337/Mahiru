import { Config } from "@core/Config";
import { RESTManager } from "./RESTManager";
import { ModUtil, Modes, RequestResponse } from "@rian8337/osu-base";
import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { RawDifficultyAttributes } from "@structures/difficultyattributes/RawDifficultyAttributes";
import {
    CacheableDifficultyAttributes,
    DroidDifficultyAttributes,
    OsuDifficultyAttributes,
} from "@rian8337/osu-difficulty-calculator";
import {
    DroidDifficultyAttributes as RebalanceDroidDifficultyAttributes,
    OsuDifficultyAttributes as RebalanceOsuDifficultyAttributes,
} from "@rian8337/osu-rebalance-difficulty-calculator";
import { consola } from "consola";
import { DifficultyCalculationParameters } from "@utils/pp/DifficultyCalculationParameters";
import { PerformanceCalculationParameters } from "@utils/pp/PerformanceCalculationParameters";
import { CompleteCalculationAttributes } from "@structures/difficultyattributes/CompleteCalculationAttributes";
import { DroidPerformanceAttributes } from "@structures/difficultyattributes/DroidPerformanceAttributes";
import { OsuPerformanceAttributes } from "@structures/difficultyattributes/OsuPerformanceAttributes";
import { PerformanceAttributes } from "@structures/difficultyattributes/PerformanceAttributes";
import { RebalanceDroidPerformanceAttributes } from "@structures/difficultyattributes/RebalanceDroidPerformanceAttributes";
import { PPProcessorCalculationResponse } from "@structures/utils/PPProcessorCalculationResponse";

/**
 * A REST manager for the performance points processor backend.
 */
export abstract class PPProcessorRESTManager extends RESTManager {
    private static readonly endpoint = Config.isDebug
        ? "https://droidpp.osudroid.moe/api/dpp/processor/"
        : "http://localhost:3006/api/dpp/processor/";

    /**
     * Retrieves a difficulty attributes from the backend.
     *
     * @param beatmapIdOrHash The MD5 hash or ID of the beatmap.
     * @param mode The gamemode to calculate.
     * @param calculationMethod The calculation method to use.
     * @param calculationParams The difficulty calculation parameters to use.
     * @param generateStrainChart Whether to generate a strain chart.
     * @returns The difficulty attributes, `null` if the difficulty attributes cannot be retrieved.
     */
    static async getDifficultyAttributes<
        THasStrainChart extends boolean = false,
    >(
        beatmapIdOrHash: string | number,
        mode: Modes.droid,
        calculationMethod: PPCalculationMethod.live,
        calculationParams?: DifficultyCalculationParameters,
        generateStrainChart?: THasStrainChart,
    ): Promise<PPProcessorCalculationResponse<
        CacheableDifficultyAttributes<DroidDifficultyAttributes>,
        THasStrainChart
    > | null>;

    /**
     * Retrieves a difficulty attributes from the backend.
     *
     * @param beatmapIdOrHash The MD5 hash or ID of the beatmap.
     * @param mode The gamemode to calculate.
     * @param calculationMethod The calculation method to use.
     * @param calculationParams The difficulty calculation parameters to use.
     * @param generateStrainChart Whether to generate a strain chart.
     * @returns The difficulty attributes, `null` if the difficulty attributes cannot be retrieved.
     */
    static async getDifficultyAttributes<
        THasStrainChart extends boolean = false,
    >(
        beatmapIdOrHash: string | number,
        mode: Modes.droid,
        calculationMethod: PPCalculationMethod.rebalance,
        calculationParams?: DifficultyCalculationParameters,
        generateStrainChart?: THasStrainChart,
    ): Promise<PPProcessorCalculationResponse<
        CacheableDifficultyAttributes<RebalanceDroidDifficultyAttributes>,
        THasStrainChart
    > | null>;

    /**
     * Retrieves a difficulty attributes from the backend.
     *
     * @param beatmapIdOrHash The MD5 hash or ID of the beatmap.
     * @param mode The gamemode to calculate.
     * @param calculationMethod The calculation method to use.
     * @param calculationParams The difficulty calculation parameters to use.
     * @param generateStrainChart Whether to generate a strain chart.
     * @returns The difficulty attributes, `null` if the difficulty attributes cannot be retrieved.
     */
    static async getDifficultyAttributes<
        THasStrainChart extends boolean = false,
    >(
        beatmapIdOrHash: string | number,
        mode: Modes.osu,
        calculationMethod: PPCalculationMethod.live,
        calculationParams?: DifficultyCalculationParameters,
        generateStrainChart?: THasStrainChart,
    ): Promise<PPProcessorCalculationResponse<
        CacheableDifficultyAttributes<OsuDifficultyAttributes>,
        THasStrainChart
    > | null>;

    /**
     * Retrieves a difficulty attributes from the backend.
     *
     * @param beatmapIdOrHash The MD5 hash or ID of the beatmap.
     * @param mode The gamemode to calculate.
     * @param calculationMethod The calculation method to use.
     * @param calculationParams The difficulty calculation parameters to use.
     * @param generateStrainChart Whether to generate a strain chart.
     * @returns The difficulty attributes, `null` if the difficulty attributes cannot be retrieved.
     */
    static async getDifficultyAttributes<
        THasStrainChart extends boolean = false,
    >(
        beatmapIdOrHash: string | number,
        mode: Modes.osu,
        calculationMethod: PPCalculationMethod.rebalance,
        calculationParams?: DifficultyCalculationParameters,
        generateStrainChart?: THasStrainChart,
    ): Promise<PPProcessorCalculationResponse<
        CacheableDifficultyAttributes<RebalanceOsuDifficultyAttributes>,
        THasStrainChart
    > | null>;

    static async getDifficultyAttributes<
        THasStrainChart extends boolean = false,
    >(
        beatmapIdOrHash: string | number,
        mode: Modes,
        calculationMethod: PPCalculationMethod,
        calculationParams?: DifficultyCalculationParameters,
        generateStrainChart?: THasStrainChart,
    ): Promise<PPProcessorCalculationResponse<
        CacheableDifficultyAttributes<RawDifficultyAttributes>,
        THasStrainChart
    > | null> {
        const url = new URL(`${this.endpoint}get-difficulty-attributes`);

        url.searchParams.set("key", process.env.DROID_SERVER_INTERNAL_KEY!);
        url.searchParams.set("gamemode", mode);
        url.searchParams.set("calculationmethod", calculationMethod.toString());
        url.searchParams.set(
            typeof beatmapIdOrHash === "number" ? "beatmapid" : "beatmaphash",
            beatmapIdOrHash.toString(),
        );

        if (calculationParams) {
            if (calculationParams.mods && calculationParams.mods.length > 0) {
                url.searchParams.set(
                    "mods",
                    ModUtil.modsToOsuString(calculationParams.mods),
                );
            }

            if (calculationParams.oldStatistics) {
                url.searchParams.set("oldstatistics", "1");
            }

            if (
                calculationParams.customSpeedMultiplier !== undefined &&
                calculationParams.customSpeedMultiplier !== 1
            ) {
                url.searchParams.set(
                    "customspeedmultiplier",
                    calculationParams.customSpeedMultiplier.toString(),
                );
            }

            if (calculationParams.forceCS !== undefined) {
                url.searchParams.set(
                    "forcecs",
                    calculationParams.forceCS.toString(),
                );
            }

            if (calculationParams.forceAR !== undefined) {
                url.searchParams.set(
                    "forcear",
                    calculationParams.forceAR.toString(),
                );
            }

            if (calculationParams.forceOD !== undefined) {
                url.searchParams.set(
                    "forceod",
                    calculationParams.forceOD.toString(),
                );
            }

            if (calculationParams.forceHP !== undefined) {
                url.searchParams.set(
                    "forcehp",
                    calculationParams.forceHP.toString(),
                );
            }
        }

        if (generateStrainChart) {
            url.searchParams.set("generatestrainchart", "1");
        }

        const result = await this.request(url).catch(() => null);

        if (result?.statusCode !== 200) {
            this.logError(url, result);

            return null;
        }

        return JSON.parse(result.data.toString("utf-8"));
    }

    /**
     * Retrieves a difficulty and performance attributes from the backend.
     *
     * @param beatmapIdOrHash The MD5 hash or ID of the beatmap.
     * @param mode The gamemode to calculate.
     * @param calculationMethod The calculation method to use.
     * @param calculationParams The performance calculation parameters to use.
     * @param generateStrainChart Whether to generate a strain chart.
     * @returns The difficulty and performance attributes, `null` if the attributes cannot be retrieved.
     */
    static async getPerformanceAttributes<THasStrainChart extends boolean>(
        beatmapIdOrHash: string | number,
        mode: Modes.droid,
        calculationMethod: PPCalculationMethod.live,
        calculationParams?: PerformanceCalculationParameters,
        generateStrainChart?: THasStrainChart,
    ): Promise<PPProcessorCalculationResponse<
        CompleteCalculationAttributes<
            DroidDifficultyAttributes,
            DroidPerformanceAttributes
        >,
        THasStrainChart
    > | null>;

    /**
     * Retrieves a difficulty and performance attributes from the backend.
     *
     * @param beatmapIdOrHash The MD5 hash or ID of the beatmap.
     * @param mode The gamemode to calculate.
     * @param calculationMethod The calculation method to use.
     * @param calculationParams The performance calculation parameters to use.
     * @param generateStrainChart Whether to generate a strain chart.
     * @returns The difficulty and performance attributes, `null` if the attributes cannot be retrieved.
     */
    static async getPerformanceAttributes<THasStrainChart extends boolean>(
        beatmapIdOrHash: string | number,
        mode: Modes.droid,
        calculationMethod: PPCalculationMethod.rebalance,
        calculationParams?: PerformanceCalculationParameters,
        generateStrainChart?: THasStrainChart,
    ): Promise<PPProcessorCalculationResponse<
        CompleteCalculationAttributes<
            RebalanceDroidDifficultyAttributes,
            RebalanceDroidPerformanceAttributes
        >,
        THasStrainChart
    > | null>;

    /**
     * Retrieves a difficulty and performance attributes from the backend.
     *
     * @param beatmapIdOrHash The MD5 hash or ID of the beatmap.
     * @param mode The gamemode to calculate.
     * @param calculationMethod The calculation method to use.
     * @param calculationParams The performance calculation parameters to use.
     * @param generateStrainChart Whether to generate a strain chart.
     * @returns The difficulty and performance attributes, `null` if the attributes cannot be retrieved.
     */
    static async getPerformanceAttributes<THasStrainChart extends boolean>(
        beatmapIdOrHash: string | number,
        mode: Modes.osu,
        calculationMethod: PPCalculationMethod.live,
        calculationParams?: PerformanceCalculationParameters,
        generateStrainChart?: THasStrainChart,
    ): Promise<PPProcessorCalculationResponse<
        CompleteCalculationAttributes<
            OsuDifficultyAttributes,
            OsuPerformanceAttributes
        >,
        THasStrainChart
    > | null>;

    /**
     * Retrieves a difficulty and performance attributes from the backend.
     *
     * @param beatmapIdOrHash The MD5 hash or ID of the beatmap.
     * @param mode The gamemode to calculate.
     * @param calculationMethod The calculation method to use.
     * @param calculationParams The performance calculation parameters to use.
     * @param generateStrainChart Whether to generate a strain chart.
     * @returns The difficulty and performance attributes, `null` if the attributes cannot be retrieved.
     */
    static async getPerformanceAttributes<THasStrainChart extends boolean>(
        beatmapIdOrHash: string | number,
        mode: Modes.osu,
        calculationMethod: PPCalculationMethod.rebalance,
        calculationParams?: PerformanceCalculationParameters,
        generateStrainChart?: THasStrainChart,
    ): Promise<PPProcessorCalculationResponse<
        CompleteCalculationAttributes<
            RebalanceOsuDifficultyAttributes,
            OsuPerformanceAttributes
        >,
        THasStrainChart
    > | null>;

    static async getPerformanceAttributes<THasStrainChart extends boolean>(
        beatmapIdOrHash: string | number,
        mode: Modes,
        calculationMethod: PPCalculationMethod,
        calculationParams?: PerformanceCalculationParameters,
        generateStrainChart?: THasStrainChart,
    ): Promise<PPProcessorCalculationResponse<
        CompleteCalculationAttributes<
            RawDifficultyAttributes,
            PerformanceAttributes
        >,
        THasStrainChart
    > | null> {
        const url = new URL(`${this.endpoint}get-performance-attributes`);

        url.searchParams.set("key", process.env.DROID_SERVER_INTERNAL_KEY!);
        url.searchParams.set("gamemode", mode);
        url.searchParams.set("calculationmethod", calculationMethod.toString());
        url.searchParams.set(
            typeof beatmapIdOrHash === "number" ? "beatmapid" : "beatmaphash",
            beatmapIdOrHash.toString(),
        );

        if (calculationParams) {
            if (calculationParams.mods && calculationParams.mods.length > 0) {
                url.searchParams.set(
                    "mods",
                    ModUtil.modsToOsuString(calculationParams.mods),
                );
            }

            if (calculationParams.oldStatistics) {
                url.searchParams.set("oldstatistics", "1");
            }

            if (
                calculationParams.customSpeedMultiplier !== undefined &&
                calculationParams.customSpeedMultiplier !== 1
            ) {
                url.searchParams.set(
                    "customspeedmultiplier",
                    calculationParams.customSpeedMultiplier.toString(),
                );
            }

            if (calculationParams.forceCS !== undefined) {
                url.searchParams.set(
                    "forcecs",
                    calculationParams.forceCS.toString(),
                );
            }

            if (calculationParams.forceAR !== undefined) {
                url.searchParams.set(
                    "forcear",
                    calculationParams.forceAR.toString(),
                );
            }

            if (calculationParams.forceOD !== undefined) {
                url.searchParams.set(
                    "forceod",
                    calculationParams.forceOD.toString(),
                );
            }

            url.searchParams.set(
                "n300",
                calculationParams.accuracy.n300.toString(),
            );
            url.searchParams.set(
                "n100",
                calculationParams.accuracy.n100.toString(),
            );
            url.searchParams.set(
                "n50",
                calculationParams.accuracy.n50.toString(),
            );
            url.searchParams.set(
                "nmiss",
                calculationParams.accuracy.nmiss.toString(),
            );

            if (calculationParams.combo !== undefined) {
                url.searchParams.set(
                    "maxcombo",
                    calculationParams.combo.toString(),
                );
            }
        }

        if (generateStrainChart) {
            url.searchParams.set("generatestrainchart", "1");
        }

        const result = await this.request(url).catch(() => null);

        if (result?.statusCode !== 200) {
            this.logError(url, result);

            return null;
        }

        return JSON.parse(result.data.toString("utf-8"));
    }

    /**
     * Gets the difficulty and performance attributes of a score.
     *
     * @param uid The uid of the player in the score.
     * @param hash The MD5 hash of the beatmap in the score.
     * @param mode The gamemode to calculate.
     * @param calculationMethod The calculation method to use.
     * @param generateStrainChart Whether to generate a strain chart.
     * @returns The difficulty and performance attributes, `null` if the attributes cannot be retrieved.
     */
    static async getOnlineScoreAttributes<THasStrainChart extends boolean>(
        uid: number,
        hash: string,
        mode: Modes.droid,
        calculationMethod: PPCalculationMethod.live,
        generateStrainChart?: THasStrainChart,
    ): Promise<PPProcessorCalculationResponse<
        CompleteCalculationAttributes<
            DroidDifficultyAttributes,
            DroidPerformanceAttributes
        >,
        THasStrainChart
    > | null>;

    /**
     * Gets the difficulty and performance attributes of a score.
     *
     * @param uid The uid of the player in the score.
     * @param hash The MD5 hash of the beatmap in the score.
     * @param mode The gamemode to calculate.
     * @param calculationMethod The calculation method to use.
     * @param generateStrainChart Whether to generate a strain chart.
     * @returns The difficulty and performance attributes, `null` if the attributes cannot be retrieved.
     */
    static async getOnlineScoreAttributes<THasStrainChart extends boolean>(
        uid: number,
        hash: string,
        mode: Modes.droid,
        calculationMethod: PPCalculationMethod.rebalance,
        generateStrainChart?: THasStrainChart,
    ): Promise<PPProcessorCalculationResponse<
        CompleteCalculationAttributes<
            RebalanceDroidDifficultyAttributes,
            RebalanceDroidPerformanceAttributes
        >,
        THasStrainChart
    > | null>;

    /**
     * Gets the difficulty and performance attributes of a score.
     *
     * @param uid The uid of the player in the score.
     * @param hash The MD5 hash of the beatmap in the score.
     * @param mode The gamemode to calculate.
     * @param calculationMethod The calculation method to use.
     * @param generateStrainChart Whether to generate a strain chart.
     * @returns The difficulty and performance attributes, `null` if the attributes cannot be retrieved.
     */
    static async getOnlineScoreAttributes<THasStrainChart extends boolean>(
        uid: number,
        hash: string,
        mode: Modes.osu,
        calculationMethod: PPCalculationMethod.live,
        generateStrainChart?: THasStrainChart,
    ): Promise<PPProcessorCalculationResponse<
        CompleteCalculationAttributes<
            OsuDifficultyAttributes,
            OsuPerformanceAttributes
        >,
        THasStrainChart
    > | null>;

    /**
     * Gets the difficulty and performance attributes of a score.
     *
     * @param uid The uid of the player in the score.
     * @param hash The MD5 hash of the beatmap in the score.
     * @param mode The gamemode to calculate.
     * @param calculationMethod The calculation method to use.
     * @param generateStrainChart Whether to generate a strain chart.
     * @returns The difficulty and performance attributes, `null` if the attributes cannot be retrieved.
     */
    static async getOnlineScoreAttributes<THasStrainChart extends boolean>(
        uid: number,
        hash: string,
        mode: Modes.osu,
        calculationMethod: PPCalculationMethod.rebalance,
        generateStrainChart?: THasStrainChart,
    ): Promise<PPProcessorCalculationResponse<
        CompleteCalculationAttributes<
            RebalanceOsuDifficultyAttributes,
            OsuPerformanceAttributes
        >,
        THasStrainChart
    > | null>;

    static async getOnlineScoreAttributes<THasStrainChart extends boolean>(
        uid: number,
        hash: string,
        mode: Modes,
        calculationMethod: PPCalculationMethod,
        generateStrainChart?: THasStrainChart,
    ): Promise<PPProcessorCalculationResponse<
        CompleteCalculationAttributes<
            RawDifficultyAttributes,
            PerformanceAttributes
        >,
        THasStrainChart
    > | null> {
        const url = new URL(`${this.endpoint}get-online-score-attributes`);

        url.searchParams.set("key", process.env.DROID_SERVER_INTERNAL_KEY!);
        url.searchParams.set("uid", uid.toString());
        url.searchParams.set("hash", hash);
        url.searchParams.set("gamemode", mode);
        url.searchParams.set("calculationmethod", calculationMethod.toString());

        if (generateStrainChart) {
            url.searchParams.set("generatestrainchart", "1");
        }

        const result = await this.request(url).catch(() => null);

        if (result?.statusCode !== 200) {
            this.logError(url, result);

            return null;
        }

        return JSON.parse(result.data.toString("utf-8"));
    }

    /**
     * Logs the error of a request.
     *
     * @param url The URL the request was directed to.
     * @param result The request result.
     */
    private static logError(url: URL, result: RequestResponse | null): void {
        if (result) {
            consola.error(
                "Request to %s failed with error: %s",
                url
                    .toString()
                    .replace(process.env.DROID_SERVER_INTERNAL_KEY!, ""),
                result.data.toString("utf-8"),
            );
        } else {
            consola.error(
                "Request to %s failed with unknown error",
                url
                    .toString()
                    .replace(process.env.DROID_SERVER_INTERNAL_KEY!, ""),
            );
        }
    }
}
