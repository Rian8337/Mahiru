import {
    GuildMember,
    EmbedBuilder,
    RepliableInteraction,
    Snowflake,
    bold,
    channelMention,
} from "discord.js";
import { OperationResult } from "structures/core/OperationResult";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { PunishmentManager } from "./PunishmentManager";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { LoungeLockManager } from "./LoungeLockManager";
import { NumberHelper } from "@utils/helpers/NumberHelper";
import { Constants } from "@core/Constants";
import { Language } from "@localization/base/Language";
import { TimeoutManagerLocalization } from "@localization/utils/managers/TimeoutManager/TimeoutManagerLocalization";
import { StringHelper } from "@utils/helpers/StringHelper";
import { CommandHelper } from "@utils/helpers/CommandHelper";

/**
 * A manager for timeouts.
 */
export abstract class TimeoutManager extends PunishmentManager {
    /**
     * Adds a timeout.
     *
     * This will also send a log to the guild's log channel.
     *
     * @param interaction The interaction that triggered the timeout.
     * @param member The guild member to timeout.
     * @param reason Reason for timeout.
     * @param duration The duration to timeout the user for, in seconds.
     * @param language The locale of the user who attempted to mute the guild member.
     * @param channelId The channel where the user was timeouted. Defaults to the interaction's channel.
     * @returns An object containing information about the operation.
     */
    static async addTimeout(
        interaction: RepliableInteraction<"cached">,
        member: GuildMember,
        reason: string,
        duration: number,
        language: Language = "en",
        channelId: Snowflake = interaction.channelId!
    ): Promise<OperationResult> {
        const localization = this.getLocalization(language);

        const guildConfig = await this.punishmentDb.getGuildConfig(
            member.guild
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

        if (this.isUserTimeouted(member, guildConfig.permanentTimeoutRole)) {
            return this.createOperationResult(
                false,
                localization.getTranslation("userAlreadyTimeouted")
            );
        }

        if (await this.userIsImmune(member, guildConfig)) {
            return this.createOperationResult(
                false,
                localization.getTranslation("userImmuneToTimeout")
            );
        }

        if (isNaN(duration)) {
            return this.createOperationResult(
                false,
                localization.getTranslation("invalidTimeoutDuration")
            );
        }

        if (
            duration !== Number.POSITIVE_INFINITY &&
            !NumberHelper.isNumberInRange(duration, 30, 28 * 86400, true)
        ) {
            return this.createOperationResult(
                false,
                localization.getTranslation("timeoutDurationOutOfRange")
            );
        }

        if (
            !(await this.userCanTimeout(
                interaction.member,
                duration,
                guildConfig
            ))
        ) {
            return this.createOperationResult(
                false,
                StringHelper.formatString(
                    localization.getTranslation("notEnoughPermissionToTimeout"),
                    Number.isFinite(duration)
                        ? DateTimeFormatHelper.secondsToDHMS(duration, language)
                        : "indefinitely"
                )
            );
        }

        if (reason.length > 1500) {
            return this.createOperationResult(
                false,
                localization.getTranslation("timeoutReasonTooLong")
            );
        }

        const logChannel = await guildConfig.getGuildLogChannel(member.guild);

        if (!logChannel?.isTextBased()) {
            return this.createOperationResult(
                false,
                punishmentManagerLocalization.getTranslation(
                    this.logChannelNotValidReject
                )
            );
        }

        if (Number.isFinite(duration)) {
            await member.timeout(duration * 1000, reason);
        } else {
            if (!guildConfig.permanentTimeoutRole) {
                return this.createOperationResult(
                    false,
                    localization.getTranslation("permanentTimeoutRoleNotFound")
                );
            }

            await member.roles.add(guildConfig.permanentTimeoutRole, reason);
        }

        const logLocalization = new TimeoutManagerLocalization("en");

        const timeoutEmbed = new EmbedBuilder()
            .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.avatarURL()!,
            })
            .setTitle(logLocalization.getTranslation("timeoutExecuted"))
            .setFooter({
                text: `${logLocalization.getTranslation("userId")}: ${
                    member.id
                } | ${logLocalization.getTranslation(
                    "channelId"
                )}: ${channelId}`,
            })
            .setTimestamp(new Date())
            .setDescription(
                `${bold(
                    `${member} ${StringHelper.formatString(
                        logLocalization.getTranslation("inChannel"),
                        channelMention(channelId)
                    )}: ${
                        Number.isFinite(duration)
                            ? DateTimeFormatHelper.secondsToDHMS(
                                  duration,
                                  language
                              )
                            : "Indefinite"
                    }`
                )}\n\n` +
                    `=========================\n\n` +
                    `${bold(logLocalization.getTranslation("reason"))}:\n` +
                    reason
            );

        const userLocalization = this.getLocalization(
            CommandHelper.getUserPreferredLocale(member.id)
        );

        const userTimeoutEmbed = new EmbedBuilder()
            .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.avatarURL()!,
            })
            .setTitle(userLocalization.getTranslation("timeoutExecuted"))
            .setFooter({
                text: `${userLocalization.getTranslation("userId")}: ${
                    member.id
                } | ${userLocalization.getTranslation(
                    "channelId"
                )}: ${channelId}`,
            })
            .setTimestamp(new Date())
            .setDescription(
                `${bold(
                    `${member} ${StringHelper.formatString(
                        userLocalization.getTranslation("inChannel"),
                        channelMention(channelId)
                    )}: ${
                        Number.isFinite(duration)
                            ? DateTimeFormatHelper.secondsToDHMS(
                                  duration,
                                  userLocalization.language
                              )
                            : "Indefinite"
                    }`
                )}\n\n` +
                    `=========================\n\n` +
                    `${bold(userLocalization.getTranslation("reason"))}:\n` +
                    reason
            );

        try {
            await this.notifyMember(
                member,
                userLocalization.getTranslation("timeoutUserNotification"),
                userTimeoutEmbed
            );
        } catch {
            // Ignore member notify failing.
        }

        await logChannel.send({ embeds: [timeoutEmbed] });

        if (
            duration >= 6 * 3600 &&
            interaction.guildId === Constants.mainServer
        ) {
            await LoungeLockManager.lock(
                member.id,
                "Timeouted for 6 hours or longer",
                30 * 24 * 3600
            );
        }

        return this.createOperationResult(true);
    }

    /**
     * Removes a timeout.
     *
     * @param member The guild member to untimeout.
     * @param interaction The interaction that triggered the untimeout, if any.
     * @param reason The reason for untimeouting.
     * @param language The locale of the user who attempted to remove the guild member's timeout. Defaults to English.
     * @returns An object containing information about the operation.
     */
    static async removeTimeout(
        member: GuildMember,
        interaction: RepliableInteraction<"cached">,
        reason: string,
        language: Language = "en"
    ): Promise<OperationResult> {
        const localization = this.getLocalization(language);

        const guildConfig = await this.punishmentDb.getGuildConfig(
            member.guild
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

        if (!this.isUserTimeouted(member, guildConfig.permanentTimeoutRole)) {
            return this.createOperationResult(
                false,
                localization.getTranslation("userNotTimeouted")
            );
        }

        if (reason.length > 1500) {
            return this.createOperationResult(
                false,
                localization.getTranslation("untimeoutReasonTooLong")
            );
        }

        const logChannel = await guildConfig.getGuildLogChannel(member.guild);

        if (!logChannel?.isTextBased()) {
            return this.createOperationResult(
                false,
                punishmentManagerLocalization.getTranslation(
                    this.logChannelNotValidReject
                )
            );
        }

        if (member.communicationDisabledUntilTimestamp !== null) {
            await member.timeout(null, reason);
        } else {
            if (!guildConfig.permanentTimeoutRole) {
                return this.createOperationResult(
                    false,
                    localization.getTranslation("permanentTimeoutRoleNotFound")
                );
            }

            await member.roles.remove(guildConfig.permanentTimeoutRole, reason);
        }

        const logLocalization = new TimeoutManagerLocalization("en");

        const untimeoutEmbed = new EmbedBuilder()
            .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.avatarURL()!,
            })
            .setTitle(logLocalization.getTranslation("untimeoutExecuted"))
            .setFooter({
                text: `${logLocalization.getTranslation("userId")}: ${
                    member.id
                } | ${logLocalization.getTranslation("channelId")}: ${
                    interaction.channel?.id
                }`,
            })
            .setTimestamp(new Date())
            .setDescription(
                `${bold(
                    `${member} ${StringHelper.formatString(
                        logLocalization.getTranslation("inChannel"),
                        interaction.channel!.toString()
                    )}`
                )}\n\n` +
                    `=========================\n\n` +
                    `${bold(logLocalization.getTranslation("reason"))}:\n` +
                    reason
            );

        const userLocalization = this.getLocalization(
            CommandHelper.getUserPreferredLocale(member.id)
        );

        const userUntimeoutEmbed = new EmbedBuilder()
            .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.avatarURL()!,
            })
            .setTitle(userLocalization.getTranslation("untimeoutExecuted"))
            .setFooter({
                text: `${userLocalization.getTranslation("userId")}: ${
                    member.id
                } | ${userLocalization.getTranslation("channelId")}: ${
                    interaction.channel?.id
                }`,
            })
            .setTimestamp(new Date())
            .setDescription(
                `${bold(
                    `${member} ${StringHelper.formatString(
                        userLocalization.getTranslation("inChannel"),
                        interaction.channel!.toString()
                    )}`
                )}\n\n` +
                    `=========================\n\n` +
                    `${bold(userLocalization.getTranslation("reason"))}:\n` +
                    reason
            );

        await logChannel.send({ embeds: [untimeoutEmbed] });

        try {
            await this.notifyMember(
                member,
                userLocalization.getTranslation("untimeoutUserNotification"),
                userUntimeoutEmbed
            );
        } catch {
            // Ignore member notify failing.
        }

        return this.createOperationResult(true);
    }

    /**
     * Checks if a guild member is timeouted.
     *
     * @param member The member.
     * @param permanentTimeoutRoleId The ID of the permanent timeout role, if any.
     * @returns Whether the guild member is timeouted.
     */
    static isUserTimeouted(
        member: GuildMember,
        permanentTimeoutRoleId?: Snowflake
    ): boolean {
        let isMuted =
            member.communicationDisabledUntilTimestamp !== null &&
            member.communicationDisabledUntilTimestamp > Date.now();

        if (permanentTimeoutRoleId) {
            isMuted ||= member.roles.cache.has(permanentTimeoutRoleId);
        }

        return isMuted;
    }

    /**
     * Notifies a guild member about their timeout status.
     *
     * @param member The member to notify.
     * @param content The content of the notification.
     * @param embed The embed for notification.
     */
    private static async notifyMember(
        member: GuildMember,
        content: string,
        embed: EmbedBuilder
    ): Promise<void> {
        await member.send({
            content: MessageCreator.createWarn(content),
            embeds: [embed],
        });
    }

    /**
     * Gets the localization of this manager utility.
     *
     * @param language The language to localize.
     */
    private static getLocalization(
        language: Language
    ): TimeoutManagerLocalization {
        return new TimeoutManagerLocalization(language);
    }
}
