import { DatabaseCollectionManager } from "@database/managers/DatabaseCollectionManager";
import { GuildPunishmentConfig } from "@database/utils/aliceDb/GuildPunishmentConfig";
import { DatabaseGuildPunishmentConfig } from "structures/database/aliceDb/DatabaseGuildPunishmentConfig";
import { OperationResult } from "structures/core/OperationResult";
import { Guild, Snowflake } from "discord.js";
import { FindOptions } from "mongodb";
import { CacheManager } from "@utils/managers/CacheManager";

/**
 * A manager for the `punishmentconfig` collection.
 */
export class GuildPunishmentConfigCollectionManager extends DatabaseCollectionManager<
    DatabaseGuildPunishmentConfig,
    GuildPunishmentConfig
> {
    protected override readonly utilityInstance: new (
        data: DatabaseGuildPunishmentConfig
    ) => GuildPunishmentConfig = GuildPunishmentConfig;

    override get defaultDocument(): DatabaseGuildPunishmentConfig {
        return {
            allowedTimeoutRoles: [],
            guildID: "",
            immuneTimeoutRoles: [],
            logChannel: "",
        };
    }

    /**
     * Gets a guild's punishment configuration.
     *
     * @param guild The guild to get the punishment configuration from.
     * @param options Options for retrieving the configuration.
     * @returns The guild's punishment configuration. `null` if the configuration is not found.
     */
    getGuildConfig(
        guild: Guild,
        options?: FindOptions<DatabaseGuildPunishmentConfig>
    ): Promise<GuildPunishmentConfig | null>;

    /**
     * Gets a guild's punishment configuration.
     *
     * @param guildId The ID of the guild to get the punishment configuration from.
     * @param options Options for retrieving the configuration.
     * @returns The guild's punishment configuration. `null` if the configuration is not found.
     */
    getGuildConfig(
        guildId: Snowflake,
        options?: FindOptions<DatabaseGuildPunishmentConfig>
    ): Promise<GuildPunishmentConfig | null>;

    getGuildConfig(
        guildOrGuildId: Snowflake | Guild,
        options?: FindOptions<DatabaseGuildPunishmentConfig>
    ): Promise<GuildPunishmentConfig | null> {
        return this.getOne(
            {
                guildID:
                    guildOrGuildId instanceof Guild
                        ? guildOrGuildId.id
                        : guildOrGuildId,
            },
            options
        );
    }

    /**
     * Sets a guild's punishment log channel.
     *
     * @param guildId The ID of the guild.
     * @param channelId The ID of the channel.
     * @returns An object containing information about the database operation.
     */
    setGuildLogChannel(
        guildId: Snowflake,
        channelId: Snowflake
    ): Promise<OperationResult> {
        const cache = CacheManager.guildPunishmentConfigs.get(guildId);

        if (cache) {
            cache.logChannel = channelId;
        } else {
            CacheManager.guildPunishmentConfigs.set(
                guildId,
                new GuildPunishmentConfig({
                    guildID: guildId,
                    logChannel: channelId,
                    allowedTimeoutRoles: [],
                    immuneTimeoutRoles: [],
                })
            );
        }

        return this.updateOne(
            { guildID: guildId },
            {
                $set: { logChannel: channelId },
                $setOnInsert: {
                    allowedTimeoutRoles: [],
                    immuneTimeoutRoles: [],
                },
            },
            { upsert: true }
        );
    }

    /**
     * Unsets a guild's punishment log channel.
     *
     * @param guildId The ID of the guild.
     * @returns An object containing information about the database operation.
     */
    unsetGuildLogChannel(guildId: Snowflake): Promise<OperationResult> {
        const cache = CacheManager.guildPunishmentConfigs.get(guildId);

        if (cache) {
            cache.logChannel = "";
        }

        return this.updateOne(
            { guildID: guildId },
            { $unset: { logChannel: "" } }
        );
    }
}
