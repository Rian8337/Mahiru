import {
    ChannelCooldownKey,
    GlobalCooldownKey,
} from "structures/core/CooldownKey";
import { LimitedCapacityCollection } from "@utils/LimitedCapacityCollection";
import { Collection, Snowflake } from "discord.js";
import { MapInfo } from "@rian8337/osu-base";
import { Language } from "@localization/base/Language";
import { TriviaQuestionCachedAnswer } from "@structures/trivia/TriviaQuestionCachedAnswer";
import { TriviaMapCachedAnswer } from "@structures/trivia/TriviaMapCachedAnswer";
import { LiveDroidDifficultyAttributesCacheManager } from "@utils/difficultyattributescache/LiveDroidDifficultyAttributesCacheManager";
import { LiveOsuDifficultyAttributesCacheManager } from "@utils/difficultyattributescache/LiveOsuDifficultyAttributesCacheManager";
import { RebalanceDroidDifficultyAttributesCacheManager } from "@utils/difficultyattributescache/RebalanceDroidDifficultyAttributesCacheManager";
import { RebalanceOsuDifficultyAttributesCacheManager } from "@utils/difficultyattributescache/RebalanceOsuDifficultyAttributesCacheManager";
import { AnniversaryTriviaQuestion } from "@database/utils/aliceDb/AnniversaryTriviaQuestion";
import { GuildPunishmentConfig } from "@database/utils/aliceDb/GuildPunishmentConfig";

/**
 * A manager that holds anything that is cached.
 */
export abstract class CacheManager {
    /**
     * The beatmaps that have been cached, mapped by beatmap ID.
     */
    static readonly beatmapIdCache = new LimitedCapacityCollection<
        number,
        MapInfo
    >(150, 600);

    /**
     * The beatmaps that have been cached, mapped by beatmap hash.
     */
    static readonly beatmapHashCache = new LimitedCapacityCollection<
        string,
        MapInfo
    >(150, 600);

    /**
     * The beatmap cache of each channel, mapped by channel ID.
     */
    static readonly channelMapCache = new LimitedCapacityCollection<
        Snowflake,
        string
    >(100, 1800);

    /**
     * The command cooldowns that are currently active.
     */
    static readonly activeCommandCooldowns = new Set<
        ChannelCooldownKey | GlobalCooldownKey
    >();

    /**
     * The users/channels that still have a math game active.
     *
     * This is used to prevent users from starting more than one game at once.
     */
    static readonly stillHasMathGameActive = new Set<Snowflake>();

    /**
     * The channels that still have a trivia question active.
     */
    static readonly stillHasQuestionTriviaActive = new Set<Snowflake>();

    /**
     * Answers for a trivia question in a channel, mapped by channel ID,
     * and each answer mapped by the answerer's ID.
     */
    static readonly questionTriviaFillInTheBlankAnswers = new Collection<
        Snowflake,
        Collection<Snowflake, TriviaQuestionCachedAnswer>
    >();

    /**
     * Answers for a trivia question in a channel, mapped by channel ID,
     * and each answer mapped by the answerer's ID.
     */
    static readonly mapTriviaAnswers = new Collection<
        Snowflake,
        Collection<Snowflake, TriviaMapCachedAnswer>
    >();

    /**
     * The users that still has a verification menu open.
     *
     * This is used to prevent collector creation spam.
     */
    static readonly userHasActiveVerificationMenu = new Set<Snowflake>();

    /**
     * The locales that a user has, mapped by user ID.
     */
    static readonly userLocale = new Collection<Snowflake, Language>();

    /**
     * The locales that a guild has, mapped by guild ID.
     */
    static readonly guildLocale = new Collection<Snowflake, Language>();

    /**
     * The locales that a guild text channel has, mapped by channel ID.
     */
    static readonly channelLocale = new Collection<Snowflake, Language>();

    /**
     * The timers for a multiplayer room, mapped by channel ID.
     */
    static readonly multiplayerTimers = new Collection<
        Snowflake,
        NodeJS.Timeout[]
    >();

    /**
     * Cache for difficulty attributes.
     */
    static readonly difficultyAttributesCache = {
        live: {
            droid: new LiveDroidDifficultyAttributesCacheManager(),
            osu: new LiveOsuDifficultyAttributesCacheManager(),
        },
        rebalance: {
            droid: new RebalanceDroidDifficultyAttributesCacheManager(),
            osu: new RebalanceOsuDifficultyAttributesCacheManager(),
        },
    };

    /**
     * IDs of buttons that will not be listened by the `runButton` event utility.
     */
    static readonly exemptedButtonCustomIds = new Set<string>();

    /**
     * The anniversary trivia questions.
     */
    static readonly anniversaryTriviaQuestions = new Collection<
        number,
        AnniversaryTriviaQuestion
    >();

    /**
     * The guild punishment configurations, mapped by guild ID.
     */
    static readonly guildPunishmentConfigs = new Collection<
        Snowflake,
        GuildPunishmentConfig
    >();
}
