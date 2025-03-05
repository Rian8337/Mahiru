import { Manager } from "@utils/base/Manager";
import { GuildPunishmentConfigCollectionManager } from "@database/managers/aliceDb/GuildPunishmentConfigCollectionManager";
import {
    PunishmentManagerLocalization,
    PunishmentManagerStrings,
} from "@localization/utils/managers/PunishmentManager/PunishmentManagerLocalization";
import { Language } from "@localization/base/Language";
import { GuildMember, PermissionsBitField } from "discord.js";
import { DatabaseManager } from "@database/DatabaseManager";
import { GuildPunishmentConfig } from "@database/utils/aliceDb/GuildPunishmentConfig";

/**
 * A manager for punishments handed to users.
 */
export abstract class PunishmentManager extends Manager {
    /**
     * The database collection that is responsible for holding guild
     * punishment configurations.
     */
    protected static get punishmentDb(): GuildPunishmentConfigCollectionManager {
        return DatabaseManager.aliceDb.collections.guildPunishmentConfig;
    }

    /**
     * Default rejection message if a server's log channel is not found.
     */
    protected static readonly logChannelNotFoundReject: keyof PunishmentManagerStrings =
        "cannotFindLogChannel";

    /**
     * Default rejection message if a server's log channel is not a text channel.
     */
    protected static readonly logChannelNotValidReject: keyof PunishmentManagerStrings =
        "invalidLogChannel";

    /**
     * Checks if a guild member can timeout a user with specified duration.
     *
     * @param member The guild member executing the timeout.
     * @param duration The duration the guild member wants to timeout for, in seconds.
     * @param guildConfig Existing guild configuration, if any.
     * @returns Whether the guild member can timeout the user.
     */
    static async userCanTimeout(
        member: GuildMember,
        duration: number,
        guildConfig?: GuildPunishmentConfig | null
    ): Promise<boolean> {
        if (member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return true;
        }

        guildConfig ??=
            await DatabaseManager.aliceDb.collections.guildPunishmentConfig.getGuildConfig(
                member.guild,
                { projection: { _id: 0, allowedTimeoutRoles: 1 } }
            );

        if (!guildConfig) {
            return false;
        }

        let maxDuration = Number.NEGATIVE_INFINITY;

        for (const allowedTimeoutRole of guildConfig.allowedTimeoutRoles.values()) {
            if (!member.roles.cache.has(allowedTimeoutRole.id)) {
                continue;
            }

            if (allowedTimeoutRole.maxTime < 0) {
                return true;
            }

            maxDuration = Math.max(maxDuration, allowedTimeoutRole.maxTime);

            // End loop here if duration is fulfilled
            if (duration <= maxDuration) {
                return true;
            }
        }

        return false;
    }

    /**
     * Checks if a guild member is immune.
     *
     * @param member The guild member to check.
     * @param guildConfig Existing guild configuration, if any.
     * @returns Whether the guild member is immune.
     */
    static async userIsImmune(
        member: GuildMember,
        guildConfig?: GuildPunishmentConfig | null
    ): Promise<boolean> {
        if (
            member.permissions.has(PermissionsBitField.Flags.Administrator) ||
            member.user.bot
        ) {
            return true;
        }

        guildConfig ??=
            await DatabaseManager.aliceDb.collections.guildPunishmentConfig.getGuildConfig(
                member.guild,
                { projection: { _id: 0, immuneTimeoutRoles: 1 } }
            );

        if (!guildConfig) {
            return false;
        }

        return member.roles.cache.hasAny(...guildConfig.immuneTimeoutRoles);
    }

    /**
     * Gets the localization of this manager.
     *
     * @param language The language to localize.
     */
    protected static getPunishmentManagerLocalization(
        language: Language
    ): PunishmentManagerLocalization {
        return new PunishmentManagerLocalization(language);
    }
}
