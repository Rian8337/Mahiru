import { OsuAPIResponse } from "@rian8337/osu-base";
import { RESTManager } from "./RESTManager";
import { Config } from "@core/Config";

/**
 * A REST manager for the beatmap processor.
 */
export abstract class BeatmapProcessorRESTManager extends RESTManager {
    private static readonly endpoint = Config.isDebug
        ? "https://droidpp.osudroid.moe/api/beatmap/"
        : "http://localhost:3017/api/beatmap/";

    /**
     * Obtains a beatmap.
     *
     * @param idOrHash The ID or MD5 hash of the beatmap.
     * @returns The beatmap in osu! API response format, `null` if the beatmap cannot be obtained.
     */
    static async getBeatmap(
        idOrHash: string | number
    ): Promise<OsuAPIResponse | null> {
        const url = new URL(`${this.endpoint}getbeatmap`);

        url.searchParams.append("key", process.env.DROID_SERVER_INTERNAL_KEY!);

        if (typeof idOrHash === "number") {
            url.searchParams.append("id", idOrHash.toString());
        } else {
            url.searchParams.append("hash", idOrHash);
        }

        const result = await this.request(url).catch((e: unknown) => {
            console.error("Failed to fetch beatmap:", e);

            return null;
        });

        if (result?.statusCode !== 200) {
            return null;
        }

        return JSON.parse(result.data.toString());
    }

    /**
     * Obtains the beatmap file of a beatmap.
     *
     * @param idOrHash The ID or MD5 hash of the beatmap.
     * @returns The beatmap file, `null` if the beatmap file cannot be downloaded.
     */
    static async getBeatmapFile(
        idOrHash: string | number
    ): Promise<Buffer | null> {
        const url = new URL(`${this.endpoint}getbeatmapfile`);

        url.searchParams.append("key", process.env.DROID_SERVER_INTERNAL_KEY!);

        if (typeof idOrHash === "number") {
            url.searchParams.append("id", idOrHash.toString());
        } else {
            url.searchParams.append("hash", idOrHash);
        }

        const result = await this.request(url).catch((e: unknown) => {
            console.error("Failed to fetch beatmap file:", e);

            return null;
        });

        if (result?.statusCode !== 200) {
            return null;
        }

        return result.data;
    }

    /**
     * Obtains a beatmapset.
     *
     * @param id The ID of the beatmapset.
     * @returns The beatmapset in osu! API response format, `null` if the beatmapset cannot be obtained.
     */
    static async getBeatmapset(id: number): Promise<OsuAPIResponse[] | null> {
        const url = new URL(`${this.endpoint}getbeatmaps`);

        url.searchParams.append("key", process.env.DROID_SERVER_INTERNAL_KEY!);
        url.searchParams.append("id", id.toString());

        const result = await this.request(url).catch((e: unknown) => {
            console.error("Failed to fetch beatmapset:", e);

            return null;
        });

        if (result?.statusCode !== 200) {
            return null;
        }

        return JSON.parse(result.data.toString());
    }
}
