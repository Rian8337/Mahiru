import { Config } from "@core/Config";
import {
    BeatmapDecoder,
    BeatmapDifficulty,
    DroidHitWindow,
    MapInfo,
    Modes,
    ModMap,
    ModPrecise,
    ModUtil,
    PreciseDroidHitWindow,
    Precision,
    RankedStatus,
    ScoreRank,
} from "@rian8337/osu-base";
import { BeatmapRetrievalOptions } from "@structures/utils/BeatmapRetrievalOptions";
import { Manager } from "@utils/base/Manager";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { HelperFunctions } from "@utils/helpers/HelperFunctions";
import { NumberHelper } from "@utils/helpers/NumberHelper";
import { createCanvas } from "canvas";
import * as d3 from "d3";
import {
    AttachmentBuilder,
    bold,
    ColorResolvable,
    formatEmoji,
    hyperlink,
    Message,
    Snowflake,
} from "discord.js";
import { BeatmapProcessorRESTManager } from "./BeatmapProcessorRESTManager";
import { CacheManager } from "./CacheManager";

/**
 * A manager for beatmaps.
 */
export abstract class BeatmapManager extends Manager {
    /**
     * Color spectrum for difficulty rating icon.
     */
    private static readonly difficultyColorSpectrum: d3.ScaleLinear<
        string,
        string,
        never
    > = d3
        .scaleLinear<string>()
        .domain([0.1, 1.25, 2, 2.5, 3.3, 4.2, 4.9, 5.8, 6.7, 7.7, 9])
        .clamp(true)
        .range([
            "#4290FB",
            "#4FC0FF",
            "#4FFFD5",
            "#7CFF4F",
            "#F6F05C",
            "#FF8068",
            "#FF4E6F",
            "#C645B8",
            "#6563DE",
            "#18158E",
            "#000000",
        ])
        .interpolate(d3.interpolateRgb.gamma(2.2));

    /**
     * Gets a beatmap from the beatmap cache, or downloads it if it's not available.
     *
     * @param beatmapIdOrHash The beatmap ID or MD5 hash of the beatmap.
     * @param options Options for the retrieval of the beatmap.
     * @returns A `MapInfo` instance representing the beatmap.
     */
    static async getBeatmap<T extends boolean = true>(
        beatmapIdOrHash: number | string,
        options?: BeatmapRetrievalOptions & { checkFile?: T }
    ): Promise<MapInfo<T> | null> {
        let oldCache =
            typeof beatmapIdOrHash === "number"
                ? CacheManager.beatmapIdCache.get(beatmapIdOrHash)
                : CacheManager.beatmapHashCache.get(beatmapIdOrHash);

        if (oldCache && !options?.forceCheck) {
            if (options?.checkFile !== false) {
                const beatmapFile =
                    await BeatmapProcessorRESTManager.getBeatmapFile(
                        oldCache.beatmapId
                    );

                if (!beatmapFile) {
                    return null;
                }

                oldCache = MapInfo.from(
                    oldCache.toAPIResponse(),
                    new BeatmapDecoder().decode(beatmapFile.toString()).result
                );

                CacheManager.beatmapIdCache.set(oldCache.beatmapId, oldCache);
                CacheManager.beatmapHashCache.set(oldCache.hash, oldCache);
            }

            return oldCache;
        }

        const apiBeatmap =
            await BeatmapProcessorRESTManager.getBeatmap(beatmapIdOrHash);

        if (!apiBeatmap) {
            return null;
        }

        const newCache = MapInfo.from(apiBeatmap);

        if (options?.checkFile !== false) {
            await this.downloadBeatmap(newCache);
        }

        if (options?.cacheBeatmap !== false) {
            CacheManager.beatmapIdCache.set(newCache.beatmapId, newCache);
            CacheManager.beatmapHashCache.set(newCache.hash, newCache);
        }

        return newCache;
    }

    /**
     * Gets the list of beatmaps from a beatmapset.
     *
     * @param beatmapsetID The ID of the beatmapset.
     * @param checkFile Whether to check if beatmap file for each beatmap is downloaded, and downloads it if it's not downloaded. Defaults to `true`.
     * @returns An array of `MapInfo` instance representing each beatmap in the beatmapset.
     */
    static async getBeatmaps(
        beatmapsetID: number,
        checkFile: boolean = true
    ): Promise<MapInfo[]> {
        const apiBeatmaps =
            await BeatmapProcessorRESTManager.getBeatmapset(beatmapsetID);

        if (apiBeatmaps === null || apiBeatmaps.length === 0) {
            return [];
        }

        const beatmaps: MapInfo[] = [];

        for (const apiBeatmap of apiBeatmaps) {
            if (apiBeatmap.mode !== "0") {
                continue;
            }

            const beatmap = MapInfo.from(apiBeatmap);

            if (checkFile) {
                await this.downloadBeatmap(beatmap);
            }

            beatmaps.push(beatmap);
        }

        return beatmaps;
    }

    /**
     * Downloads the beatmap of a `MapInfo`.
     *
     * @param mapinfo The `MapInfo` whose beatmap will be downloaded.
     */
    static async downloadBeatmap(mapinfo: MapInfo<false>) {
        if (mapinfo.hasDownloadedBeatmap()) {
            return;
        }

        const beatmapFile = await BeatmapProcessorRESTManager.getBeatmapFile(
            mapinfo.beatmapId
        );

        if (!beatmapFile) {
            return;
        }

        mapinfo.setBeatmap(
            new BeatmapDecoder().decode(beatmapFile.toString()).result
        );
    }

    /**
     * Gets the latest cached beatmap in a channel.
     *
     * @param channelID The ID of the channel.
     * @returns The MD5 hash of the beatmap, `undefined` if not found.
     */
    static getChannelLatestBeatmap(channelID: Snowflake): string | undefined {
        return CacheManager.channelMapCache.get(channelID);
    }

    /**
     * Sets the latest cached beatmap in a channel.
     *
     * @param channelID The ID of the channel.
     * @param hash The MD5 hash of the beatmap.
     */
    static setChannelLatestBeatmap(channelID: Snowflake, hash: string): void {
        CacheManager.channelMapCache.set(channelID, hash);
    }

    /**
     * Gets beatmap IDs from a string.
     *
     * @param str The string to get the beatmap IDs from.
     * @returns All beatmap IDs from the string.
     */
    static getBeatmapID(str: string): number[] {
        const IDs: number[] = [];

        if (!str) {
            return IDs;
        }

        const strArray = str.split(/\s+/g);

        for (const s of strArray) {
            let id = parseInt(s);

            if (NumberHelper.isNumeric(s)) {
                IDs.push(id);
                continue;
            }

            if (
                !s.startsWith("https://osu.ppy.sh/") &&
                !s.startsWith("https://dev.ppy.sh/")
            ) {
                continue;
            }

            if (
                [
                    s.indexOf("#osu/"),
                    s.indexOf("/b/"),
                    s.indexOf("/beatmaps/"),
                ].every((v) => v === -1)
            ) {
                continue;
            }

            const split = s.split("/");

            const index =
                split.indexOf("beatmaps") + 1 ||
                split.indexOf("b") + 1 ||
                split.findIndex((v) => v.includes("#osu")) + 1;

            id = parseInt(split[index]);

            if (!isNaN(id)) {
                IDs.push(id);
            }
        }

        return IDs;
    }

    /**
     * Gets beatmapset IDs from a string.
     *
     * @param str The string to get the beatmapset IDs from.
     * @returns All beatmapset IDs from the string.
     */
    static getBeatmapsetID(str: string): number[] {
        const IDs: number[] = [];

        const strArray = str.split(/\s+/g);

        for (const s of strArray) {
            let id = parseInt(s);

            if (NumberHelper.isNumeric(s)) {
                IDs.push(id);
                continue;
            }

            if (
                !s.startsWith("https://osu.ppy.sh/") &&
                !s.startsWith("https://dev.ppy.sh/")
            ) {
                continue;
            }

            if (
                [s.indexOf("/beatmapsets/"), s.indexOf("/s/")].every(
                    (v) => v === -1
                )
            ) {
                continue;
            }

            const split = s.split("/");

            const index =
                split.indexOf("beatmapsets") + 1 || split.indexOf("s") + 1;

            id = parseInt(split[index]);

            if (!isNaN(id)) {
                IDs.push(id);
            }
        }

        return IDs;
    }

    /**
     * Attempts to retrieve a beatmap ID from a message.
     *
     * The function will attempt to retrieve a beatmap ID from the message embeds' author URL and URL.
     * If none are found, it will attempt to retrieve from the message's content.
     *
     * @param message The message.
     * @returns The beatmap ID, `null` if not found.
     */
    static getBeatmapIDFromMessage(message: Message): number | null {
        let beatmapId: number | null = null;

        for (const embed of message.embeds) {
            const id =
                this.getBeatmapID(embed.author?.url ?? "")[0] ??
                this.getBeatmapID(embed.url ?? "")[0];

            if (id) {
                beatmapId = id;

                break;
            }
        }

        if (!beatmapId) {
            for (const arg of message.content.split(/\s+/g)) {
                const id = this.getBeatmapID(arg)[0];

                if (id) {
                    beatmapId = id;

                    break;
                }
            }
        }

        return beatmapId;
    }

    /**
     * Gets the difficulty icon of a beatmap.
     *
     * @param rating The difficulty rating of the beatmap.
     * @returns A difficulty icon representing the beatmap's difficulty.
     */
    static getBeatmapDifficultyIcon(rating: number): Buffer {
        const canvas = createCanvas(128, 128);

        const c = canvas.getContext("2d");

        c.fillStyle = this.getBeatmapDifficultyColor(rating);

        c.beginPath();
        c.arc(canvas.width / 2, canvas.height / 2, 60, 0, 2 * Math.PI);
        c.fill();
        c.closePath();

        // Separate inner and outer circles
        c.globalCompositeOperation = "destination-out";
        c.beginPath();
        c.arc(canvas.width / 2, canvas.height / 2, 55, 0, 2 * Math.PI);
        c.fill();
        c.closePath();

        c.globalCompositeOperation = "source-over";
        c.beginPath();
        c.arc(canvas.width / 2, canvas.height / 2, 40, 0, 2 * Math.PI);
        c.fill();
        c.closePath();

        return canvas.toBuffer();
    }

    /**
     * Gets a color representing a difficulty value.
     *
     * @param rating The difficulty value.
     * @returns The color in hex code.
     */
    static getBeatmapDifficultyColor(rating: number): string {
        switch (true) {
            case rating < 0.1:
                return "#AAAAAA";
            case rating >= 9:
                return "#000000";
            default:
                return HelperFunctions.rgbToHex(
                    this.difficultyColorSpectrum(rating)
                );
        }
    }

    /**
     * Generates an `AttachmentBuilder` of a beatmap's difficulty icon.
     *
     * @param rating The difficulty rating of the beatmap.
     * @returns The generated `AttachmentBuilder`.
     */
    static getBeatmapDifficultyIconAttachment(
        rating: number
    ): AttachmentBuilder {
        return new AttachmentBuilder(this.getBeatmapDifficultyIcon(rating), {
            name: `osu-${rating.toFixed(2)}.png`,
        });
    }

    /**
     * Shows a beatmap's statistics based on applied statistics and option.
     *
     * - Option `0`: return map title and mods used if defined
     * - Option `1`: return song source and map download link to beatmap mirrors
     * - Option `2`: return circle, slider, and spinner count
     * - Option `3`: return CS, AR, OD, HP, and max score statistics for droid
     * - Option `4`: return CS, AR, OD, HP, and max score statistics for PC
     * - Option `5`: return BPM, map length, and max combo
     * - Option `6`: return last update date and map status
     * - Option `7`: return favorite count and play count
     *
     * @param beatmapInfo The beatmap info to show.
     * @param option The option to pick.
     * @param mods The mods to use.
     */
    static showStatistics(
        beatmapInfo: MapInfo,
        option: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
        mods?: ModMap
    ): string {
        switch (option) {
            case 0:
                return `${beatmapInfo.fullTitle}${mods && mods.size > 0 ? ` +${ModUtil.modsToOrderedString(mods)}` : ""}`;

            case 1: {
                let string = `${
                    beatmapInfo.source
                        ? `${bold("Source")}: ${beatmapInfo.source}\n`
                        : ""
                }${bold(
                    hyperlink(
                        "Beatmap Preview",
                        `https://osu-preview.jmir.ml/preview#${beatmapInfo.beatmapId}`
                    )
                )}\n${bold("Download")}: ${hyperlink(
                    "osu!",
                    `https://osu.ppy.sh/d/${beatmapInfo.beatmapSetId}`
                )}${
                    beatmapInfo.videoAvailable
                        ? ` ${hyperlink(
                              "(no video)",
                              `https://osu.ppy.sh/d/${beatmapInfo.beatmapSetId}n`
                          )}`
                        : ""
                } - ${hyperlink(
                    "Chimu",
                    `https://chimu.moe/en/d/${beatmapInfo.beatmapSetId}`
                )} - ${hyperlink(
                    "Sayobot",
                    `https://txy1.sayobot.cn/beatmaps/download/full/${beatmapInfo.beatmapSetId}`
                )}${
                    beatmapInfo.videoAvailable
                        ? ` ${hyperlink(
                              "(no video)",
                              `https://txy1.sayobot.cn/beatmaps/download/novideo/${beatmapInfo.beatmapSetId}`
                          )}`
                        : ""
                } - ${hyperlink(
                    "Beatconnect",
                    `https://beatconnect.io/b/${beatmapInfo.beatmapSetId}/`
                )} - ${hyperlink(
                    "Nerina",
                    `https://api.nerinyan.moe/d/${beatmapInfo.beatmapSetId}`
                )}${
                    beatmapInfo.storyboardAvailable
                        ? ` ${hyperlink("(no storyboard)", `https://api.nerinyan.moe/d/${beatmapInfo.beatmapSetId}?nsb=1`)}`
                        : ""
                }${
                    beatmapInfo.videoAvailable
                        ? ` ${hyperlink("(no video)", `https://api.nerinyan.moe/d/${beatmapInfo.beatmapSetId}?nv=1`)}`
                        : ""
                }${
                    beatmapInfo.storyboardAvailable &&
                    beatmapInfo.videoAvailable
                        ? ` ${hyperlink("(no storyboard, no video)", `https://api.nerinyan.moe/d/${beatmapInfo.beatmapSetId}?nsb=1&nv=1`)}`
                        : ""
                }${
                    beatmapInfo.approved >= RankedStatus.ranked &&
                    beatmapInfo.approved !== RankedStatus.qualified
                        ? ` - ${hyperlink(
                              "Ripple",
                              `https://storage.ripple.moe/d/${beatmapInfo.beatmapSetId}`
                          )}`
                        : ""
                }`;
                if (beatmapInfo.packs.length > 0) {
                    string += `\n${bold("Beatmap Pack")}: `;
                    for (let i = 0; i < beatmapInfo.packs.length; i++) {
                        string += hyperlink(
                            beatmapInfo.packs[i],
                            `https://osu.ppy.sh/beatmaps/packs/${beatmapInfo.packs[i]}`
                        );
                        if (i + 1 < beatmapInfo.packs.length) {
                            string += " - ";
                        }
                    }
                }
                string += `\n🖼️ ${
                    beatmapInfo.storyboardAvailable ? "✅" : "❎"
                } ${bold("|")} 🎞️ ${beatmapInfo.videoAvailable ? "✅" : "❎"}`;
                return string;
            }

            case 2:
                return `${bold("Circles")}: ${beatmapInfo.circles} - ${bold(
                    "Sliders"
                )}: ${beatmapInfo.sliders} - ${bold("Spinners")}: ${
                    beatmapInfo.spinners
                }`;

            case 3:
            case 4: {
                const modifiedDifficulty = this.getDifficultyWithMods(
                    beatmapInfo,
                    option === 3 ? Modes.droid : Modes.osu,
                    mods
                );

                const modifiedCS = NumberHelper.round(modifiedDifficulty.cs, 2);
                const modifiedAR = NumberHelper.round(modifiedDifficulty.ar, 2);
                const modifiedOD = NumberHelper.round(modifiedDifficulty.od, 2);
                const modifiedHP = NumberHelper.round(modifiedDifficulty.hp, 2);

                return `${bold("CS")}: ${beatmapInfo.cs}${
                    Precision.almostEqualsNumber(beatmapInfo.cs, modifiedCS)
                        ? ""
                        : ` (${modifiedCS})`
                } - ${bold("AR")}: ${beatmapInfo.ar}${
                    Precision.almostEqualsNumber(beatmapInfo.ar, modifiedAR)
                        ? ""
                        : ` (${modifiedAR})`
                } - ${bold("OD")}: ${beatmapInfo.od}${
                    Precision.almostEqualsNumber(beatmapInfo.od, modifiedOD)
                        ? ""
                        : ` (${modifiedOD})`
                } - ${bold("HP")}: ${beatmapInfo.hp}${
                    Precision.almostEqualsNumber(beatmapInfo.hp, modifiedHP)
                        ? ""
                        : ` (${modifiedHP})`
                }`;
            }

            case 5: {
                const speedMultiplier = mods
                    ? ModUtil.calculateRateWithMods(mods.values())
                    : 1;

                const convertedBPM = this.convertBPM(
                    beatmapInfo.bpm,
                    speedMultiplier
                );

                let string = `${bold("BPM")}: `;

                if (beatmapInfo.beatmap) {
                    const uninheritedTimingPoints =
                        beatmapInfo.beatmap.controlPoints.timing.points;

                    if (uninheritedTimingPoints.length === 1) {
                        string += `${beatmapInfo.bpm}${
                            !Precision.almostEqualsNumber(
                                beatmapInfo.bpm,
                                convertedBPM
                            )
                                ? ` (${convertedBPM})`
                                : ""
                        } - ${bold("Length")}: ${this.convertTime(
                            beatmapInfo.hitLength,
                            beatmapInfo.totalLength,
                            speedMultiplier
                        )} - ${bold("Max Combo")}: ${
                            beatmapInfo.maxCombo !== null
                                ? `${beatmapInfo.maxCombo}x`
                                : "Unknown"
                        }`;
                    } else {
                        let maxBPM = beatmapInfo.bpm;
                        let minBPM = beatmapInfo.bpm;
                        for (const t of uninheritedTimingPoints) {
                            const bpm = parseFloat(
                                (60000 / t.msPerBeat).toFixed(2)
                            );
                            maxBPM = Math.max(maxBPM, bpm);
                            minBPM = Math.min(minBPM, bpm);
                        }
                        maxBPM = Math.round(maxBPM);
                        minBPM = Math.round(minBPM);
                        const speedMulMinBPM = Math.round(
                            minBPM * speedMultiplier
                        );
                        const speedMulMaxBPM = Math.round(
                            maxBPM * speedMultiplier
                        );

                        string +=
                            Precision.almostEqualsNumber(
                                minBPM,
                                beatmapInfo.bpm
                            ) &&
                            Precision.almostEqualsNumber(
                                maxBPM,
                                beatmapInfo.bpm
                            )
                                ? `${beatmapInfo.bpm} `
                                : `${minBPM}-${maxBPM} (${beatmapInfo.bpm}) `;

                        if (
                            !Precision.almostEqualsNumber(
                                beatmapInfo.bpm,
                                convertedBPM
                            )
                        ) {
                            if (
                                !Precision.almostEqualsNumber(
                                    speedMulMinBPM,
                                    speedMulMaxBPM
                                )
                            ) {
                                string += `(${speedMulMinBPM}-${speedMulMaxBPM} (${convertedBPM})) `;
                            } else {
                                string += `(${convertedBPM}) `;
                            }
                        }

                        string += `- ${bold("Length")}: ${this.convertTime(
                            beatmapInfo.hitLength,
                            beatmapInfo.totalLength,
                            speedMultiplier
                        )} - ${bold("Max Combo")}: ${
                            beatmapInfo.maxCombo !== null
                                ? `${beatmapInfo.maxCombo}x`
                                : "Unknown"
                        }`;
                    }
                } else {
                    string += `${beatmapInfo.bpm}${
                        !Precision.almostEqualsNumber(
                            beatmapInfo.bpm,
                            convertedBPM
                        )
                            ? ` (${convertedBPM})`
                            : ""
                    } - ${bold("Length")}: ${this.convertTime(
                        beatmapInfo.hitLength,
                        beatmapInfo.totalLength,
                        speedMultiplier
                    )} - ${bold("Max Combo")}: ${
                        beatmapInfo.maxCombo !== null
                            ? `${beatmapInfo.maxCombo}x`
                            : "Unknown"
                    }`;
                }
                return string;
            }

            case 6:
                return `${bold(
                    "Last Update"
                )}: ${DateTimeFormatHelper.toDiscordTimestamp(beatmapInfo.lastUpdate)} | ${bold(
                    this.convertStatus(beatmapInfo.approved)
                )}`;

            case 7:
                return `❤️ ${bold(
                    beatmapInfo.favorites.toLocaleString()
                )} - ▶️ ${bold(beatmapInfo.plays.toLocaleString())}`;

            default:
                throw {
                    name: "NotSupportedError",
                    message: `This mode (${option}) is not supported`,
                };
        }
    }

    /**
     * Obtains a {@link BeatmapDifficulty} with mods applied to it. Can be used to display difficulty
     * statistics to the user.
     *
     * @param beatmap The beatmap to obtain the difficulty from.
     * @param mode The game mode.
     * @param mods The mods to apply. Defaults to No Mod.
     * @returns The {@link BeatmapDifficulty}.
     */
    static getDifficultyWithMods(
        beatmap: MapInfo,
        mode: Modes,
        mods?: ModMap
    ): BeatmapDifficulty {
        const difficulty = new BeatmapDifficulty();
        difficulty.cs = beatmap.cs;
        difficulty.ar = beatmap.ar;
        difficulty.od = beatmap.od;
        difficulty.hp = beatmap.hp;

        ModUtil.applyModsToBeatmapDifficulty(difficulty, mode, mods, true);

        if (mode === Modes.droid && mods?.has(ModPrecise)) {
            // Special case for OD. The Precise mod changes the hit window and not the OD itself, but we must
            // map the hit window back to the original hit window for the user to understand the difficulty
            // increase of the mod.
            const { greatWindow } = new PreciseDroidHitWindow(difficulty.od);

            difficulty.od = DroidHitWindow.greatWindowToOD(greatWindow);
        }

        return difficulty;
    }

    /**
     * Returns a color integer based on the beatmap's ranking status.
     *
     * Useful to make embed messages.
     */
    static getStatusColor(status: RankedStatus): number {
        switch (status) {
            case RankedStatus.graveyard:
                return 16711711; // Graveyard: red
            case RankedStatus.wip:
                return 9442302; // WIP: purple
            case RankedStatus.pending:
                return 16312092; // Pending: yellow
            case RankedStatus.ranked:
                return 2483712; // Ranked: green
            case RankedStatus.approved:
                return 16741376; // Approved: tosca
            case RankedStatus.qualified:
                return 5301186; // Qualified: light blue
            case RankedStatus.loved:
                return 16711796; // Loved: pink
            default:
                return 0;
        }
    }

    /**
     * Converts the beatmap's BPM if speed-changing mods are applied.
     */
    static convertBPM(bpm: number, speedMultiplier = 1): number {
        bpm *= speedMultiplier;

        return NumberHelper.round(bpm, 2);
    }

    /**
     * Converts the beatmap's status into a string.
     */
    private static convertStatus(status: RankedStatus): string {
        let s: keyof typeof RankedStatus = "approved";
        for (const stat in RankedStatus) {
            if (RankedStatus[<keyof typeof RankedStatus>stat] === status) {
                s = <keyof typeof RankedStatus>stat;
                break;
            }
        }
        return s !== "wip"
            ? s.charAt(0).toUpperCase() + s.slice(1)
            : s.toUpperCase();
    }

    /**
     * Converts the beatmap's length if speed-changing mods are applied.
     */
    static convertTime(
        hitLength: number,
        totalLength: number,
        speedMultiplier = 1
    ): string {
        hitLength /= speedMultiplier;
        totalLength /= speedMultiplier;

        return `${DateTimeFormatHelper.secondsToDDHHMMSS(hitLength)}${
            hitLength === hitLength
                ? ""
                : ` (${DateTimeFormatHelper.secondsToDDHHMMSS(hitLength)})`
        }/${DateTimeFormatHelper.secondsToDDHHMMSS(totalLength)}${
            totalLength === totalLength
                ? ""
                : ` (${DateTimeFormatHelper.secondsToDDHHMMSS(totalLength)})`
        }`;
    }
}
