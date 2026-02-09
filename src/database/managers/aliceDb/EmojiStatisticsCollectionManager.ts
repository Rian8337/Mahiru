import { DatabaseCollectionManager } from "@database/managers/DatabaseCollectionManager";
import { EmojiStatistics } from "@database/utils/aliceDb/EmojiStatistics";
import { DatabaseEmojiStatistics } from "structures/database/aliceDb/DatabaseEmojiStatistics";
import { Collection as DiscordCollection, Guild, Snowflake } from "discord.js";
import { FindOptions } from "mongodb";

/**
 * A manager for the `emojistatistics` collection.
 */
export class EmojiStatisticsCollectionManager extends DatabaseCollectionManager<
    DatabaseEmojiStatistics,
    EmojiStatistics
> {
    protected override readonly utilityInstance: new (
        data: DatabaseEmojiStatistics,
    ) => EmojiStatistics = EmojiStatistics;

    override get defaultDocument(): DatabaseEmojiStatistics {
        return {
            guildId: "",
            emojiId: "",
            count: 0,
        };
    }

    /**
     * Gets the emoji statistics of a guild.
     *
     * @param guild The guild.
     * @param options Options for finding the statistics.
     * @returns The emoji statistics of the guild, with each emoji statistics mapped by the emoji's ID.
     */
    getGuildStatistics(
        guild: Guild,
        options?: FindOptions,
    ): Promise<DiscordCollection<Snowflake, EmojiStatistics> | null>;

    /**
     * Gets the emoji statistics of a guild.
     *
     * @param guildId The ID of the guild.
     * @param options Options for finding the statistics.
     * @returns The emoji statistics of the guild, with each emoji statistics mapped by the emoji's ID.
     */
    getGuildStatistics(
        guildId: Snowflake,
        options?: FindOptions,
    ): Promise<DiscordCollection<Snowflake, EmojiStatistics> | null>;

    /**
     * Gets the emoji statistics of a guild.
     *
     * @param guildId The ID of the guild.
     * @param options Options for finding the statistics.
     * @returns The emoji statistics of the guild, with each emoji statistics mapped by the emoji's ID.
     */
    getGuildStatistics(
        guildOrId: Guild | Snowflake,
        options?: FindOptions,
    ): Promise<DiscordCollection<Snowflake, EmojiStatistics> | null> {
        return this.get(
            "emojiId",
            { guildId: guildOrId instanceof Guild ? guildOrId.id : guildOrId },
            this.processFindOptions(options),
        );
    }

    /**
     * Gets the emoji statistics of an emoji.
     *
     * @param emojiId The ID of the emoji.
     * @param options Options for finding the statistics.
     * @returns The emoji statistics of the emoji, `null` if not found.
     */
    getEmojiStatistics(
        emojiId: Snowflake,
        options?: FindOptions,
    ): Promise<EmojiStatistics | null> {
        return this.getOne({ emojiId }, options);
    }
}
