import { DatabaseManager } from "@database/DatabaseManager";
import { DatabaseGuildPunishmentConfig } from "structures/database/aliceDb/DatabaseGuildPunishmentConfig";
import { OperationResult } from "structures/core/OperationResult";
import { RoleTimeoutPermission } from "structures/moderation/RoleTimeoutPermission";
import { Manager } from "@utils/base/Manager";
import { ArrayHelper } from "@utils/helpers/ArrayHelper";
import { ObjectId } from "bson";
import {
    Collection,
    Guild,
    GuildBasedChannel,
    Role,
    Snowflake,
} from "discord.js";

/**
 * Represents a guild's punishment configuration.
 */
export class GuildPunishmentConfig extends Manager {
    /**
     * The ID of the guild.
     */
    guildID: Snowflake;

    /**
     * The ID of the guild's log channel.
     */
    logChannel: Snowflake;

    /**
     * Configuration for roles that are allowed to timeout members, mapped by role ID.
     */
    allowedTimeoutRoles: Collection<Snowflake, RoleTimeoutPermission>;

    /**
     * Roles that cannot be timeouted.
     */
    immuneTimeoutRoles: Snowflake[];

    /**
     * The ID of the role that is the permanent timeout role for the guild.
     */
    permanentTimeoutRole?: Snowflake;

    /**
     * The BSON object ID of this document in the database.
     */
    readonly _id?: ObjectId;

    private readonly db =
        DatabaseManager.aliceDb.collections.guildPunishmentConfig;

    constructor(
        data: DatabaseGuildPunishmentConfig = DatabaseManager.aliceDb
            ?.collections.guildPunishmentConfig.defaultDocument ?? {}
    ) {
        super();

        this._id = data._id;
        this.guildID = data.guildID;
        this.logChannel = data.logChannel;
        this.allowedTimeoutRoles = ArrayHelper.arrayToCollection(
            data.allowedTimeoutRoles ?? [],
            "id"
        );
        this.immuneTimeoutRoles = data.immuneTimeoutRoles ?? [];
        this.permanentTimeoutRole = data.permanentTimeoutRole;
    }

    /**
     * Gets the guild's log channel.
     *
     * @param guild The guild instance.
     * @returns The guild's log channel, `null` if not found.
     */
    getGuildLogChannel(guild: Guild): Promise<GuildBasedChannel | null> {
        return guild.channels.fetch(this.logChannel);
    }

    /**
     * Obtains the permanent timeout role for this guild.
     *
     * @param guild The guild instance.
     * @returns The permanent timeout role, `null` if not found.
     */
    getPermanentTimeoutRole(guild: Guild): Promise<Role | null> {
        if (!this.permanentTimeoutRole) {
            return Promise.resolve(null);
        }

        return guild.roles.fetch(this.permanentTimeoutRole);
    }

    /**
     * Sets the permanent timeout role for this guild.
     *
     * @param id The ID of the role to set as the permanent timeout role. Set to `null` to remove the permanent timeout role.
     * @returns An object containing information about the operation.
     */
    async setPermanentTimeoutRole(
        id: Snowflake | null
    ): Promise<OperationResult> {
        if (this.permanentTimeoutRole === (id ?? undefined)) {
            return this.createOperationResult(true);
        }

        if (id) {
            return this.db.updateOne(
                { guildID: this.guildID },
                { $set: { permanentTimeoutRole: id } }
            );
        } else {
            return this.db.updateOne(
                { guildID: this.guildID },
                { $unset: { permanentTimeoutRole: "" } }
            );
        }
    }

    /**
     * Grants timeout immunity for a role.
     *
     * @param roleId The ID of the role.
     * @returns An object containing information about the operation.
     */
    async grantTimeoutImmunity(roleId: Snowflake): Promise<OperationResult> {
        if (this.immuneTimeoutRoles.find((r) => r === roleId)) {
            return this.createOperationResult(true);
        }

        this.immuneTimeoutRoles.push(roleId);

        return this.db.updateOne(
            { guildID: this.guildID },
            {
                $addToSet: {
                    immuneTimeoutRoles: roleId,
                },
            }
        );
    }

    /**
     * Revokes timeout immunity from a role.
     *
     * @param roleId The ID of the role.
     * @returns An object containing information about the operation.
     */
    async revokeTimeoutImmunity(roleId: Snowflake): Promise<OperationResult> {
        const index = this.immuneTimeoutRoles.findIndex((r) => r === roleId);

        if (index === -1) {
            return this.createOperationResult(true);
        }

        this.immuneTimeoutRoles.splice(index, 1);

        return this.db.updateOne(
            { guildID: this.guildID },
            {
                $pull: {
                    immuneTimeoutRoles: roleId,
                },
            }
        );
    }

    /**
     * Grants timeout permission for a role.
     *
     * @param roleId The ID of the role.
     * @param maxTime The maximum time the role is allowed to timeout for. -1 means the role can timeout indefinitely.
     */
    async grantTimeoutPermission(
        roleId: Snowflake,
        maxTime: number
    ): Promise<OperationResult> {
        const roleTimeoutPermission = this.allowedTimeoutRoles.get(roleId);

        if (roleTimeoutPermission?.maxTime === maxTime) {
            return this.createOperationResult(true);
        }

        this.allowedTimeoutRoles.set(roleId, { id: roleId, maxTime: maxTime });

        return this.db.updateOne(
            { guildID: this.guildID },
            {
                $set: {
                    allowedTimeoutRoles: [...this.allowedTimeoutRoles.values()],
                },
            }
        );
    }

    /**
     * Revokes timeout permission from a role.
     *
     * @param roleId The ID of the role.
     * @returns An object containing information about the operation.
     */
    async revokeTimeoutPermission(roleId: Snowflake): Promise<OperationResult> {
        if (!this.allowedTimeoutRoles.delete(roleId)) {
            return this.createOperationResult(true);
        }

        return this.db.updateOne(
            { guildID: this.guildID },
            {
                $set: {
                    allowedTimeoutRoles: [...this.allowedTimeoutRoles.values()],
                },
            }
        );
    }
}
