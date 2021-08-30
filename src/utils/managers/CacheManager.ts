import { CooldownKey } from "@alice-types/core/CooldownKey";
import { LimitedCapacityCollection } from "@alice-utils/LimitedCapacityCollection";
import { Snowflake } from "discord.js";
import { MapInfo } from "osu-droid";

/**
 * A manager that holds anything that is cached.
 */
export abstract class CacheManager {
    /**
     * The beatmaps that have been cached, mapped by beatmap ID.
     */
    static readonly beatmapCache: LimitedCapacityCollection<number, MapInfo> = new LimitedCapacityCollection(200);

    /**
     * The beatmap cache of each channel, mapped by channel ID.
     */
    static readonly channelMapCache: LimitedCapacityCollection<Snowflake, string> = new LimitedCapacityCollection(100);

    /**
     * The command cooldowns that are currently active.
     */
    static readonly activeCommandCooldowns: Set<CooldownKey> = new Set();
}