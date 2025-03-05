import {
    Guild,
    EmbedBuilder,
    Snowflake,
    TextChannel,
    bold,
    userMention,
    Role,
} from "discord.js";
import { DatabaseManager } from "@database/DatabaseManager";
import { OperationResult } from "structures/core/OperationResult";
import { Constants } from "@core/Constants";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { PunishmentManager } from "./PunishmentManager";
import { LoungeLockCollectionManager } from "@database/managers/aliceDb/LoungeLockCollectionManager";
import { LoungeLockManagerLocalization } from "@localization/utils/managers/LoungeLockManager/LoungeLockManagerLocalization";
import { Language } from "@localization/base/Language";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CacheManager } from "./CacheManager";

/**
 * A manager for lounge locks.
 */
export abstract class LoungeLockManager extends PunishmentManager {
    /**
     * The server the channel is located in.
     */
    private static mainServer: Guild;

    /**
     * The database collection that is responsible for storing lounge lock data.
     */
    private static loungeLockDb: LoungeLockCollectionManager;

    /**
     * The lounge channel of the main server.
     */
    static loungeChannel: TextChannel;

    /**
     * The lounge role.
     */
    private static loungeRole: Role | null;

    /**
     * Initializes the manager.
     */
    static override async init(): Promise<void> {
        this.loungeLockDb = DatabaseManager.aliceDb.collections.loungeLock;
        this.mainServer = await this.client.guilds.fetch(Constants.mainServer);
        this.loungeRole = await this.mainServer.roles.fetch(
            Constants.loungeRole
        );
        this.loungeChannel = <TextChannel>(
            await this.mainServer.channels.fetch(Constants.loungeChannel)
        );
    }

    /**
     * Locks a user from lounge or extends its duration.
     *
     * @param userId The ID of the user.
     * @param reason The reason for locking the user.
     * @param duration The duration of the lock or the extension, in seconds. For permanent locks, use `Number.POSITIVE_INFINITY` or -1.
     * @param language The locale of the user who attempted to lock the user. Defaults to English.
     * @returns An object containing information about the operation.
     */
    static async lock(
        userId: Snowflake,
        reason: string,
        duration: number,
        language: Language = "en"
    ): Promise<OperationResult> {
        if (duration < 0) {
            duration = Number.POSITIVE_INFINITY;
        }

        const lockInfo = await this.loungeLockDb.getUserLockInfo(userId);

        const guildConfig = CacheManager.guildPunishmentConfigs.get(
            this.mainServer.id
        );

        const punishmentManagerLocalization =
            this.getPunishmentManagerLocalization(language);

        if (!guildConfig) {
            return this.createOperationResult(
                false,
                punishmentManagerLocalization.getTranslation(
                    this.logChannelNotFoundReject
                )
            );
        }

        const logChannel = await guildConfig.getGuildLogChannel(
            this.mainServer
        );

        if (!logChannel?.isTextBased()) {
            return this.createOperationResult(
                false,
                punishmentManagerLocalization.getTranslation(
                    this.logChannelNotValidReject
                )
            );
        }

        const logEmbed = EmbedCreator.createNormalEmbed({ timestamp: true });

        if (lockInfo) {
            // Extend lock and update reason
            await lockInfo.extend(duration, reason);

            logEmbed
                .setColor("#c7c03c")
                .setTitle("Lounge Lock Extended")
                .setDescription(
                    `${bold("User")}: ${userMention(userId)}\n` +
                        `${bold("Updated Reason")}: ${reason}\n` +
                        `${bold("New Expiration Date")}: ${
                            !Number.isFinite(
                                lockInfo.expiration + duration * 1000
                            )
                                ? "Never"
                                : new Date(
                                      lockInfo.expiration + duration * 1000
                                  ).toUTCString()
                        }`
                );
        } else {
            // Insert new lock
            await this.loungeLockDb.insertNewLock(userId, duration, reason);

            if (this.loungeRole) {
                const member = await this.mainServer.members
                    .fetch(userId)
                    .catch(() => null);

                if (member) {
                    await member.roles.remove(this.loungeRole);
                }
            }

            logEmbed
                .setColor("#a5de6f")
                .setTitle("Lounge Lock Added")
                .setDescription(
                    `${bold("User")}: ${userMention(userId)}\n` +
                        `${bold("Reason")}: ${reason}\n` +
                        `${bold("Expiration Date")}: ${
                            !Number.isFinite(duration * 1000)
                                ? "Never"
                                : new Date(
                                      Date.now() + duration * 1000
                                  ).toUTCString()
                        }`
                );
        }

        await logChannel.send({ embeds: [logEmbed] });
        await this.notifyMember(
            userId,
            this.getLocalization(language).getTranslation(
                "lockUserNotification"
            ),
            logEmbed
        );

        return this.createOperationResult(true);
    }

    /**
     * Unlocks a user from lounge.
     *
     * @param userId The ID of the user.
     * @param reason The reason for unlocking the user.
     * @returns An object containing information about the operation.
     */
    static async unlock(
        userId: Snowflake,
        reason: string,
        language: Language = "en"
    ): Promise<OperationResult> {
        const lockInfo = await this.loungeLockDb.getUserLockInfo(userId);

        const localization = this.getLocalization(language);

        const punishmentManagerLocalization =
            this.getPunishmentManagerLocalization(language);

        if (!lockInfo) {
            return this.createOperationResult(
                false,
                localization.getTranslation("userNotLocked")
            );
        }

        const guildConfig = CacheManager.guildPunishmentConfigs.get(
            this.mainServer.id
        );

        if (!guildConfig) {
            return this.createOperationResult(
                false,
                punishmentManagerLocalization.getTranslation(
                    this.logChannelNotFoundReject
                )
            );
        }

        const logChannel = await guildConfig.getGuildLogChannel(
            this.mainServer
        );

        if (!logChannel) {
            return this.createOperationResult(
                false,
                punishmentManagerLocalization.getTranslation(
                    this.logChannelNotFoundReject
                )
            );
        }

        if (!logChannel?.isTextBased()) {
            return this.createOperationResult(
                false,
                punishmentManagerLocalization.getTranslation(
                    this.logChannelNotValidReject
                )
            );
        }

        const logEmbed = EmbedCreator.createNormalEmbed({ timestamp: true });

        logEmbed
            .setColor("#3ba7b8")
            .setTitle("Lounge Lock Removed")
            .setDescription(
                `${bold("User")}: ${userMention(userId)}\n
                ${bold("Reason")}: ${reason}`
            );

        await lockInfo.unlock();

        await logChannel.send({ embeds: [logEmbed] });
        await this.notifyMember(
            userId,
            localization.getTranslation("unlockUserNotification"),
            logEmbed
        );

        return this.createOperationResult(true);
    }

    /**
     * Notifies a guild member about their lounge lock status.
     *
     * @param member The member to notify.
     * @param content The content of the notification.
     * @param embed The embed for notification.
     */
    private static async notifyMember(
        userId: Snowflake,
        content: string,
        embed: EmbedBuilder
    ): Promise<void> {
        const user = await this.client.users.fetch(userId).catch(() => null);

        if (user) {
            await user.send({
                content: MessageCreator.createWarn(content),
                embeds: [embed],
            });
        }
    }

    /**
     * Gets the localization of this manager.
     *
     * @param language The language to localize.
     */
    private static getLocalization(
        language: Language
    ): LoungeLockManagerLocalization {
        return new LoungeLockManagerLocalization(language);
    }
}
