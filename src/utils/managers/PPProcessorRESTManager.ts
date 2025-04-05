import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { Modes, RequestResponse } from "@rian8337/osu-base";
import {
    CacheableDifficultyAttributes,
    DroidDifficultyAttributes,
    OsuDifficultyAttributes,
} from "@rian8337/osu-difficulty-calculator";
import {
    DroidDifficultyAttributes as RebalanceDroidDifficultyAttributes,
    OsuDifficultyAttributes as RebalanceOsuDifficultyAttributes,
} from "@rian8337/osu-rebalance-difficulty-calculator";
import { CompleteCalculationAttributes } from "@structures/difficultyattributes/CompleteCalculationAttributes";
import { DroidPerformanceAttributes } from "@structures/difficultyattributes/DroidPerformanceAttributes";
import { OsuPerformanceAttributes } from "@structures/difficultyattributes/OsuPerformanceAttributes";
import { PerformanceAttributes } from "@structures/difficultyattributes/PerformanceAttributes";
import { RawDifficultyAttributes } from "@structures/difficultyattributes/RawDifficultyAttributes";
import { RebalanceDroidPerformanceAttributes } from "@structures/difficultyattributes/RebalanceDroidPerformanceAttributes";
import { PPProcessorCalculationResponse } from "@structures/utils/PPProcessorCalculationResponse";
import { DifficultyCalculationParameters } from "@utils/pp/DifficultyCalculationParameters";
import { PerformanceCalculationParameters } from "@utils/pp/PerformanceCalculationParameters";
import { consola } from "consola";
import { RESTManager } from "./RESTManager";

/**
 * A REST manager for the performance points processor backend.
 */
export abstract class PPProcessorRESTManager extends RESTManager {
    private static readonly endpoint =
        /* Config.isDebug
        ? "https://droidpp.osudroid.moe/api/dpp/processor/"
        :  */ "http://localhost:3006/api/dpp/processor/";

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
        generateStrainChart?: THasStrainChart
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
        generateStrainChart?: THasStrainChart
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
        generateStrainChart?: THasStrainChart
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
        generateStrainChart?: THasStrainChart
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
        generateStrainChart?: THasStrainChart
    ): Promise<PPProcessorCalculationResponse<
        CacheableDifficultyAttributes<RawDifficultyAttributes>,
        THasStrainChart
    > | null> {
        const url = new URL(`${this.endpoint}difficulty-attributes`);
        const formData = new FormData();

        formData.append("key", process.env.DROID_SERVER_INTERNAL_KEY!);
        formData.append("gamemode", mode);
        formData.append("calculationmethod", calculationMethod.toString());
        formData.append(
            typeof beatmapIdOrHash === "number" ? "beatmapid" : "beatmaphash",
            beatmapIdOrHash.toString()
        );

        if (calculationParams?.mods && !calculationParams.mods.isEmpty) {
            formData.append(
                "mods",
                JSON.stringify(calculationParams.mods.serializeMods())
            );
        }

        if (generateStrainChart) {
            formData.append("generatestrainchart", "1");
        }

        const result = await this.request(url, {
            method: "POST",
            body: formData,
        }).catch(() => null);

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
        generateStrainChart?: THasStrainChart
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
        generateStrainChart?: THasStrainChart
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
        generateStrainChart?: THasStrainChart
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
        generateStrainChart?: THasStrainChart
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
        generateStrainChart?: THasStrainChart
    ): Promise<PPProcessorCalculationResponse<
        CompleteCalculationAttributes<
            RawDifficultyAttributes,
            PerformanceAttributes
        >,
        THasStrainChart
    > | null> {
        const url = new URL(`${this.endpoint}performance-attributes`);
        const formData = new FormData();

        formData.append("key", process.env.DROID_SERVER_INTERNAL_KEY!);
        formData.append("gamemode", mode);
        formData.append("calculationmethod", calculationMethod.toString());
        formData.append(
            typeof beatmapIdOrHash === "number" ? "beatmapid" : "beatmaphash",
            beatmapIdOrHash.toString()
        );

        if (calculationParams) {
            if (calculationParams.mods && !calculationParams.mods.isEmpty) {
                formData.append(
                    "mods",
                    JSON.stringify(calculationParams.mods.serializeMods())
                );
            }

            formData.append("n300", calculationParams.accuracy.n300.toString());
            formData.append("n100", calculationParams.accuracy.n100.toString());
            formData.append("n50", calculationParams.accuracy.n50.toString());

            formData.append(
                "nmiss",
                calculationParams.accuracy.nmiss.toString()
            );

            if (calculationParams.combo !== undefined) {
                formData.append("maxcombo", calculationParams.combo.toString());
            }
        }

        if (generateStrainChart) {
            formData.append("generatestrainchart", "1");
        }

        const result = await this.request(url, {
            method: "POST",
            body: formData,
        }).catch(() => null);

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
     * @param calculateBestPPScore Whether to calculate the score with the best PP instead of the best score. Defaults to `false`.
     * @param generateStrainChart Whether to generate a strain chart.
     * @returns The difficulty and performance attributes, `null` if the attributes cannot be retrieved.
     */
    static async getOnlineScoreAttributes<THasStrainChart extends boolean>(
        uid: number,
        hash: string,
        mode: Modes.droid,
        calculationMethod: PPCalculationMethod.live,
        calculateBestPPScore?: boolean,
        generateStrainChart?: THasStrainChart
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
     * @param calculateBestPPScore Whether to calculate the score with the best PP instead of the best score. Defaults to `false`.
     * @param generateStrainChart Whether to generate a strain chart.
     * @returns The difficulty and performance attributes, `null` if the attributes cannot be retrieved.
     */
    static async getOnlineScoreAttributes<THasStrainChart extends boolean>(
        uid: number,
        hash: string,
        mode: Modes.droid,
        calculationMethod: PPCalculationMethod.rebalance,
        calculateBestPPScore?: boolean,
        generateStrainChart?: THasStrainChart
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
     * @param calculateBestPPScore Whether to calculate the score with the best PP instead of the best score. Defaults to `false`.
     * @param generateStrainChart Whether to generate a strain chart.
     * @returns The difficulty and performance attributes, `null` if the attributes cannot be retrieved.
     */
    static async getOnlineScoreAttributes<THasStrainChart extends boolean>(
        uid: number,
        hash: string,
        mode: Modes.osu,
        calculationMethod: PPCalculationMethod.live,
        calculateBestPPScore?: boolean,
        generateStrainChart?: THasStrainChart
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
     * @param calculateBestPPScore Whether to calculate the score with the best PP instead of the best score. Defaults to `false`.
     * @param generateStrainChart Whether to generate a strain chart.
     * @returns The difficulty and performance attributes, `null` if the attributes cannot be retrieved.
     */
    static async getOnlineScoreAttributes<THasStrainChart extends boolean>(
        uid: number,
        hash: string,
        mode: Modes.osu,
        calculationMethod: PPCalculationMethod.rebalance,
        calculateBestPPScore?: boolean,
        generateStrainChart?: THasStrainChart
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
        calculateBestPPScore?: boolean,
        generateStrainChart?: THasStrainChart
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

        if (calculateBestPPScore) {
            url.searchParams.set("usebestpp", "1");
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
                result.data.toString("utf-8")
            );
        } else {
            consola.error(
                "Request to %s failed with unknown error",
                url
                    .toString()
                    .replace(process.env.DROID_SERVER_INTERNAL_KEY!, "")
            );
        }
    }
}
