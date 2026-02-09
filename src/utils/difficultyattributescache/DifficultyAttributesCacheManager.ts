import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { MapInfo, Modes, ModMap } from "@rian8337/osu-base";
import { CacheableDifficultyAttributes } from "@rian8337/osu-difficulty-calculator";
import { CachedDifficultyAttributes } from "@structures/difficultyattributes/CachedDifficultyAttributes";
import { RawDifficultyAttributes } from "@structures/difficultyattributes/RawDifficultyAttributes";
import { StringHelper } from "@utils/helpers/StringHelper";
import { Collection } from "discord.js";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

/**
 * A cache manager for difficulty attributes.
 */
export abstract class DifficultyAttributesCacheManager<
    T extends RawDifficultyAttributes,
> {
    /**
     * The type of the attribute.
     */
    protected abstract readonly attributeType: PPCalculationMethod;

    /**
     * The gamemode at which the difficulty attribute is stored for.
     */
    protected abstract readonly mode: Modes;

    /**
     * The difficulty attributes cache.
     */
    private readonly cache = new Collection<
        number,
        CachedDifficultyAttributes<T>
    >();

    /**
     * The cache that needs to be saved to disk.
     */
    private readonly cacheToSave = new Collection<
        number,
        CachedDifficultyAttributes<T>
    >();

    private get folderPath(): string {
        let attributeTypeFolder: string;
        let gamemodeFolder: string;

        switch (this.attributeType) {
            case PPCalculationMethod.live:
                attributeTypeFolder = "live";
                break;
            case PPCalculationMethod.rebalance:
                attributeTypeFolder = "rebalance";
                break;
        }

        switch (this.mode) {
            case Modes.droid:
                gamemodeFolder = "droid";
                break;
            case Modes.osu:
                gamemodeFolder = "osu";
                break;
        }

        return join(
            process.cwd(),
            "files",
            "difficultyattributescache",
            attributeTypeFolder,
            gamemodeFolder,
        );
    }

    /**
     * Gets all difficulty attributes cache of a beatmap.
     *
     * @param beatmapInfo The information about the beatmap.
     * @returns The difficulty attributes of the beatmap, or `null` if it doesn't exist.
     */
    getBeatmapAttributes(
        beatmapInfo: MapInfo,
    ): CachedDifficultyAttributes<T> | null {
        return this.getCache(beatmapInfo);
    }

    /**
     * Gets a specific difficulty attributes cache of a beatmap.
     *
     * @param beatmapInfo The information about the beatmap.
     * @param mods The mods to get the attributes for.
     * @returns The difficulty attributes of the beatmap, or `null` if it doesn't exist.
     */
    getDifficultyAttributes(
        beatmapInfo: MapInfo,
        mods: ModMap,
    ): CacheableDifficultyAttributes<T> | null {
        return (
            this.getCache(beatmapInfo)?.difficultyAttributes[
                this.getAttributeName(mods)
            ] ?? null
        );
    }

    /**
     * Adds an attribute to the beatmap difficulty cache.
     *
     * @param beatmapInfo The information about the beatmap.
     * @param difficultyAttributes The difficulty attributes to add.
     * @returns The difficulty attributes that were cached.
     */
    addAttribute(
        beatmapInfo: MapInfo,
        difficultyAttributes: T,
    ): CacheableDifficultyAttributes<T> {
        const cache = this.getBeatmapAttributes(beatmapInfo) ?? {
            lastUpdate: Date.now(),
            difficultyAttributes: {},
        };

        const attributeName = this.getAttributeName(difficultyAttributes.mods);

        cache.difficultyAttributes[attributeName] = {
            ...difficultyAttributes,
            mods: undefined,
        };

        this.cache.set(beatmapInfo.beatmapId, cache);
        this.cacheToSave.set(beatmapInfo.beatmapId, cache);

        return cache.difficultyAttributes[attributeName];
    }

    /**
     * Reads the existing cache from the disk.
     */
    async readCacheFromDisk(): Promise<void> {
        console.log(
            "Reading difficulty cache of attribute type",
            PPCalculationMethod[this.attributeType],
            "and gamemode",
            this.mode,
        );

        const start = process.hrtime.bigint();

        try {
            for (const fileName of await readdir(this.folderPath)) {
                const beatmapId = parseInt(fileName);

                if (this.cache.has(beatmapId)) {
                    continue;
                }

                const cache = JSON.parse(
                    await readFile(join(this.folderPath, fileName), {
                        encoding: "utf-8",
                    }),
                ) as CachedDifficultyAttributes<T>;

                this.cache.set(beatmapId, cache);
            }
        } catch {
            // If it falls into here, the directory may not have been created.
            // Try to create it.
            try {
                await mkdir(this.folderPath, { recursive: true });
            } catch {
                // Ignore mkdir error.
            }
        }

        const end = process.hrtime.bigint();

        setInterval(
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            async () => {
                await this.saveToDisk();
            },
            60 * 5 * 1000,
        );

        console.log(
            "Reading difficulty cache of attribute type",
            PPCalculationMethod[this.attributeType],
            "and gamemode",
            this.mode,
            "complete (took",
            Number(end - start) / 1e6,
            "ms)",
        );
    }

    /**
     * Saves the in-memory cache to the disk.
     */
    private async saveToDisk(): Promise<void> {
        for (const [beatmapId, cache] of this.cacheToSave) {
            await writeFile(
                join(this.folderPath, `${beatmapId.toString()}.json`),
                JSON.stringify(cache),
            );

            this.cacheToSave.delete(beatmapId);
        }
    }

    /**
     * Gets a specific difficulty attributes cache of a beatmap.
     *
     * Includes logic to invalidate the beatmap's cache if it's no longer valid.
     *
     * @param beatmapInfo The information about the beatmap.
     */
    private getCache(
        beatmapInfo: MapInfo,
    ): CachedDifficultyAttributes<T> | null {
        const cache = this.cache.get(beatmapInfo.beatmapId);

        if (!cache) {
            return null;
        }

        if (cache.lastUpdate < beatmapInfo.lastUpdate.getTime()) {
            this.invalidateCache(beatmapInfo.beatmapId);
            return null;
        }

        return cache;
    }

    /**
     * Invalidates a difficulty attributes cache.
     *
     * @param beatmapId The ID of the beatmap to invalidate.
     */
    private invalidateCache(beatmapId: number): void {
        const cache = this.cache.get(beatmapId);

        if (!cache) {
            return;
        }

        cache.lastUpdate = Date.now();
        cache.difficultyAttributes = {};

        this.cacheToSave.set(beatmapId, cache);
    }

    /**
     * Constructs an attribute name based on the given parameters.
     *
     * @param mods The mods to construct with.
     */
    private getAttributeName(mods: ModMap): string {
        return StringHelper.sortAlphabet(
            mods
                .serializeMods()
                .map((v) => JSON.stringify(v))
                .join(""),
        );
    }
}
