import { DatabaseManager } from "@database/DatabaseManager";
import { DatabaseCollectionManager } from "@database/managers/DatabaseCollectionManager";
import { GuildSettings } from "@database/utils/aliceDb/GuildSettings";
import { OperationResult } from "structures/core/OperationResult";
import { DatabaseGuildSettings } from "structures/database/aliceDb/DatabaseGuildSettings";
import { Language } from "@localization/base/Language";
import { CacheManager } from "@utils/managers/CacheManager";
import { Snowflake } from "discord.js";
import { FindOptions } from "mongodb";

/**
 * A manager for the `guildsettings` collection.
 */
export class GuildSettingsCollectionManager extends DatabaseCollectionManager<
    DatabaseGuildSettings,
    GuildSettings
> {
    protected override readonly utilityInstance: new (
        data: DatabaseGuildSettings,
    ) => GuildSettings = GuildSettings;

    override get defaultDocument(): DatabaseGuildSettings {
        return {
            channelSettings: [],
            disabledCommands: [],
            disabledEventUtils: [],
            id: "",
            preferredLocale: "en",
        };
    }

    /**
     * Gets the settings of a guild.
     *
     * @param guildId The ID of the guild.
     * @param options Options for the retrieval of the guild settings.
     * @returns The guild setting, `null` if not found.
     */
    async getGuildSetting(
        guildId: Snowflake,
        options?: FindOptions,
    ): Promise<GuildSettings | null> {
        return this.getOne({ id: guildId }, options);
    }

    /**
     * Gets the settings of a guild with a channel.
     *
     * @param channelId The ID of the channel.
     * @param options Options for the retrieval of the guild settings.
     * @returns The guild setting, `null` if not found.
     */
    getGuildSettingWithChannel(
        channelId: Snowflake,
        options?: FindOptions,
    ): Promise<GuildSettings | null> {
        return this.getOne({ "channelSettings.id": channelId }, options);
    }

    /**
     * Sets a server's preferred locale.
     *
     * @param guildId The ID of the guild.
     * @param language The language to set the preferred locale to.
     * @returns An object containing information about the operation.
     */
    async setServerLocale(
        guildId: Snowflake,
        language: Language,
    ): Promise<OperationResult> {
        const guildSetting = await this.getGuildSetting(guildId, {
            projection: {
                _id: 0,
                preferredLocale: 1,
            },
        });

        CacheManager.guildLocale.set(guildId, language);

        if (!guildSetting) {
            if (language === "en") {
                CacheManager.guildLocale.delete(guildId);

                return this.createOperationResult(true);
            }

            return DatabaseManager.aliceDb.collections.guildSettings.insert({
                id: guildId,
                preferredLocale: language,
            });
        }

        if (guildSetting.preferredLocale === language) {
            return this.createOperationResult(true);
        }

        return DatabaseManager.aliceDb.collections.guildSettings.updateOne(
            { id: guildId },
            {
                $set: {
                    preferredLocale: language,
                },
            },
        );
    }

    /**
     * Sets a channel's preferred locale.
     *
     * @param guildId The ID of the guild the channel is in.
     * @param channelId The ID of the channel.
     * @param language The language to set the preferred locale to.
     * @returns An object containing information about the operation.
     */
    async setChannelLocale(
        guildId: Snowflake,
        channelId: Snowflake,
        language: Language,
    ): Promise<OperationResult> {
        const guildSetting = await this.getGuildSetting(guildId, {
            projection: {
                _id: 0,
                channelSettings: 1,
            },
        });

        CacheManager.channelLocale.set(channelId, language);

        if (!guildSetting) {
            if (language === "en") {
                CacheManager.channelLocale.delete(channelId);

                return this.createOperationResult(true);
            }

            return DatabaseManager.aliceDb.collections.guildSettings.insert({
                id: guildId,
                channelSettings: [
                    {
                        id: channelId,
                        disabledCommands: [],
                        disabledEventUtils: [],
                        preferredLocale: language,
                    },
                ],
            });
        }

        const channelSetting = guildSetting.channelSettings.get(channelId);

        if (!channelSetting) {
            if (language === "en") {
                CacheManager.channelLocale.delete(channelId);

                return this.createOperationResult(true);
            }

            return DatabaseManager.aliceDb.collections.guildSettings.updateOne(
                { id: guildId },
                {
                    $push: {
                        channelSettings: {
                            id: channelId,
                            disabledCommands: [],
                            disabledEventUtils: [],
                            preferredLocale: language,
                        },
                    },
                },
            );
        }

        if (channelSetting.preferredLocale === language) {
            // Don't need to make a call to database
            return this.createOperationResult(true);
        }

        channelSetting.preferredLocale = language;

        guildSetting.channelSettings.set(channelId, channelSetting);

        return DatabaseManager.aliceDb.collections.guildSettings.updateOne(
            { id: guildId },
            {
                $set: {
                    "channelSettings.$[channelFilter].preferredLocale":
                        language,
                },
            },
            {
                arrayFilters: [{ "channelFilter.id": channelId }],
            },
        );
    }

    protected override processFindOptions(
        options?: FindOptions,
    ): FindOptions | undefined {
        if (options?.projection) {
            options.projection.id = 1;
        }

        return super.processFindOptions(options);
    }
}
