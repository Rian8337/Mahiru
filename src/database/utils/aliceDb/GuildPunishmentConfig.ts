import { DatabaseManager } from "@database/DatabaseManager";
import { DatabaseGuildPunishmentConfig } from "structures/database/aliceDb/DatabaseGuildPunishmentConfig";
import { OperationResult } from "structures/core/OperationResult";
import { RoleTimeoutPermission } from "structures/moderation/RoleTimeoutPermission";
import { Manager } from "@utils/base/Manager";
import { ArrayHelper } from "@utils/helpers/ArrayHelper";
import { ObjectId } from "bson";
import {
    ChannelType,
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
     * @param role The role to set as the permanent timeout role.
     * @returns An object containing information about the operation.
     */
    async setPermanentTimeoutRole(role: Role): Promise<OperationResult> {
        if (this.permanentTimeoutRole === role.id) {
            return this.createOperationResult(true);
        }

        let result: OperationResult;

        if (role) {
            result = await this.db.updateOne(
                { guildID: this.guildID },
                { $set: { permanentTimeoutRole: role.id } }
            );
        } else {
            result = await this.db.updateOne(
                { guildID: this.guildID },
                { $unset: { permanentTimeoutRole: "" } }
            );
        }

        if (result.failed()) {
            return result;
        }

        // Set per-channel permissions for the role and delete the old role's permissions
        const guildChannels = await role.guild.channels.fetch();

        for (const channel of guildChannels.values()) {
            if (
                channel?.type !== ChannelType.GuildForum &&
                channel?.type !== ChannelType.GuildVoice &&
                channel?.type !== ChannelType.GuildText
            ) {
                continue;
            }

            await channel.permissionOverwrites.edit(
                role,
                {
                    AddReactions: false,
                    SendMessages: false,
                    SendMessagesInThreads: false,
                    Connect: false,
                    Speak: false,
                },
                { reason: "New permanent timeout role" }
            );

            if (this.permanentTimeoutRole) {
                await channel.permissionOverwrites.delete(
                    this.permanentTimeoutRole,
                    "New permanent timeout role"
                );
            }
        }

        this.permanentTimeoutRole = role?.id;

        return result;
    }

    /**
     * Removes the permanent timeout role from this guild.
     *
     * @param guild The guild instance.
     * @returns An object containing information about the operation.
     */
    async removePermanentTimeoutRole(guild: Guild): Promise<OperationResult> {
        if (!this.permanentTimeoutRole) {
            return this.createOperationResult(true);
        }

        const role = await guild.roles.fetch(this.permanentTimeoutRole);

        if (!role) {
            return this.createOperationResult(true);
        }

        const result = await this.db.updateOne(
            { guildID: this.guildID },
            { $unset: { permanentTimeoutRole: "" } }
        );

        if (result.failed()) {
            return result;
        }

        // Delete the role's permissions in all channels
        const guildChannels = await guild.channels.fetch();

        for (const channel of guildChannels.values()) {
            await channel?.permissionOverwrites.delete(
                role,
                "Removed permanent timeout role"
            );
        }

        return result;
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
