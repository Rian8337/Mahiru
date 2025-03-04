import { DatabaseManager } from "@database/DatabaseManager";
import { WarningCollectionManager } from "@database/managers/aliceDb/WarningCollectionManager";
import { Warning } from "@database/utils/aliceDb/Warning";
import { OperationResult } from "structures/core/OperationResult";
import { Language } from "@localization/base/Language";
import { WarningManagerLocalization } from "@localization/utils/managers/WarningManager/WarningManagerLocalization";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { NumberHelper } from "@utils/helpers/NumberHelper";
import { StringHelper } from "@utils/helpers/StringHelper";
import {
    GuildMember,
    EmbedBuilder,
    RepliableInteraction,
    Snowflake,
    bold,
    channelMention,
    userMention,
} from "discord.js";
import { PunishmentManager } from "./PunishmentManager";

/**
 * A manager for warnings.
 */
export abstract class WarningManager extends PunishmentManager {
    /**
     * The database collection that is responsible for storing warnings.
     */
    private static get warningDb(): WarningCollectionManager {
        return DatabaseManager.aliceDb.collections.userWarning;
    }

    /**
     * Issues a warning to a guild member.
     *
     * @param interaction The interaction with the user that issued the warning.
     * @param member The guild member the warning is issued to.
     * @param points The amount of warning points to be issued to the guild member.
     * @param duration The duration the warning will stay valid for, in seconds.
     * @param reason The reason for warning the user.
     * @param channelId The channel where the user was warned. Defaults to the interaction's channel.
     */
    static async issue(
        interaction: RepliableInteraction,
        member: GuildMember,
        points: number,
        duration: number,
        reason: string,
        channelId: Snowflake = interaction.channelId!
    ): Promise<OperationResult> {
        if (!interaction.channel?.isSendable()) {
            return this.createOperationResult(
                false,
                "The channel is not sendable."
            );
        }

        const localization = this.getLocalization(
            CommandHelper.getLocale(interaction)
        );

        if (await this.userIsImmune(member)) {
            return this.createOperationResult(
                false,
                localization.getTranslation("userIsImmune")
            );
        }

        if (isNaN(duration)) {
            return this.createOperationResult(
                false,
                localization.getTranslation("invalidDuration")
            );
        }

        if (!NumberHelper.isNumberInRange(duration, 10800, 28 * 86400, true)) {
            return this.createOperationResult(
                false,
                localization.getTranslation("durationOutOfRange")
            );
        }

        if (!(await this.userCanWarn(<GuildMember>interaction.member))) {
            return this.createOperationResult(
                false,
                localization.getTranslation("notEnoughPermissionToWarn")
            );
        }

        if (reason.length > 1500) {
            return this.createOperationResult(
                false,
                localization.getTranslation("reasonTooLong")
            );
        }

        const guildConfig = await this.punishmentDb.getGuildConfig(
            member.guild
        );

        const punishmentManagerLocalization =
            this.getPunishmentManagerLocalization(localization.language);

        if (!guildConfig) {
            return this.createOperationResult(
                false,
                punishmentManagerLocalization.getTranslation(
                    this.logChannelNotFoundReject
                )
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

        const warningId = await this.warningDb.getNewGlobalWarningId(
            member.guild.id
        );

        const logLocalization = new WarningManagerLocalization("en");

        const warningEmbed = new EmbedBuilder()
            .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.avatarURL()!,
            })
            .setTitle(logLocalization.getTranslation("warningIssued"))
            .setFooter({
                text: `${logLocalization.getTranslation("warningId")}: ${
                    warningId.split("-")[1]
                } | ${logLocalization.getTranslation("userId")}: ${
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
                    )}: ${DateTimeFormatHelper.secondsToDHMS(
                        duration,
                        logLocalization.language
                    )}`
                )}\n` +
                    `${bold(
                        `${logLocalization.getTranslation("points")}: ${points}`
                    )}\n\n` +
                    `=========================\n\n` +
                    `${bold(logLocalization.getTranslation("reason"))}:\n` +
                    reason
            );

        const userLocalization = this.getLocalization(
            CommandHelper.getUserPreferredLocale(member.id)
        );

        const userWarningEmbed = new EmbedBuilder()
            .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.avatarURL()!,
            })
            .setTitle(userLocalization.getTranslation("warningIssued"))
            .setFooter({
                text: `${userLocalization.getTranslation("warningId")}: ${
                    warningId.split("-")[1]
                } | ${userLocalization.getTranslation("userId")}: ${
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
                    )}: ${DateTimeFormatHelper.secondsToDHMS(
                        duration,
                        userLocalization.language
                    )}`
                )}\n\n` +
                    `${bold(
                        `${userLocalization.getTranslation(
                            "points"
                        )}: ${points}`
                    )}\n\n` +
                    `=========================\n\n` +
                    `${bold(userLocalization.getTranslation("reason"))}:\n` +
                    reason
            );

        const currentTime = Math.floor(Date.now() / 1000);

        const result = await this.warningDb.insert({
            globalId: warningId,
            discordId: member.id,
            guildId: interaction.guildId!,
            channelId: channelId,
            issuerId: interaction.user.id,
            creationDate: currentTime,
            expirationDate: currentTime + duration,
            points: points,
            reason: reason,
        });

        if (result.success) {
            try {
                await this.notifyMember(
                    member,
                    StringHelper.formatString(
                        userLocalization.getTranslation(
                            "warnIssueUserNotification"
                        ),
                        reason
                    ),
                    userWarningEmbed
                );
            } catch {
                interaction.channel.send({
                    content: MessageCreator.createWarn(
                        "A user has been warned, but their DMs are locked."
                    ),
                });
            }

            await logChannel.send({ embeds: [warningEmbed] });
        }

        return result;
    }

    /**
     * Unissues a warning from a guild member.
     *
     * @param interaction The interaction with the user that unissued the warning.
     * @param warning The warning to unissue.
     * @param reason The reason for unissuing the warning.
     */
    static async unissue(
        interaction: RepliableInteraction<"cached">,
        warning: Warning,
        reason: string
    ): Promise<OperationResult> {
        if (!interaction.inCachedGuild()) {
            return this.createOperationResult(false, "User is not in a guild.");
        }

        const localization = this.getLocalization(
            CommandHelper.getLocale(interaction)
        );

        if (reason.length > 1500) {
            return this.createOperationResult(
                false,
                localization.getTranslation("reasonTooLong")
            );
        }

        if (!(await this.userCanWarn(<GuildMember>interaction.member))) {
            return this.createOperationResult(
                false,
                localization.getTranslation("notEnoughPermissionToWarn")
            );
        }

        const member = await interaction.guild.members
            .fetch(warning.discordId)
            .catch(() => null);

        if (!member) {
            return this.createOperationResult(
                false,
                localization.getTranslation("userNotFoundInServer")
            );
        }

        const guildConfig = await this.punishmentDb.getGuildConfig(
            member.guild
        );

        const punishmentManagerLocalization =
            this.getPunishmentManagerLocalization(localization.language);

        if (!guildConfig) {
            return this.createOperationResult(
                false,
                punishmentManagerLocalization.getTranslation(
                    this.logChannelNotFoundReject
                )
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

        const warningEmbed = new EmbedBuilder()
            .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.avatarURL()!,
            })
            .setTitle(localization.getTranslation("warningUnissued"))
            .setFooter({
                text: `${localization.getTranslation("warningId")}: ${
                    warning.guildSpecificId
                } | ${localization.getTranslation("userId")}: ${
                    member.id
                } | ${localization.getTranslation(
                    "channelId"
                )}: ${interaction.channelId!}`,
            })
            .setTimestamp(new Date())
            .setDescription(
                `${bold(
                    `${StringHelper.formatString(
                        localization.getTranslation("warningIssueInChannel"),
                        channelMention(warning.channelId)
                    )}`
                )}\n\n` +
                    `${bold(
                        localization.getTranslation("warnedUser")
                    )}: ${userMention(warning.discordId)} (${
                        warning.discordId
                    })\n` +
                    `${bold(localization.getTranslation("points"))}: ${
                        warning.points
                    }\n` +
                    `${bold(localization.getTranslation("warningReason"))}: ${
                        warning.reason
                    }\n\n` +
                    `=========================\n\n` +
                    `${bold(
                        localization.getTranslation("warningUnissueReason")
                    )}:\n` +
                    reason
            );

        const userLocalization = this.getLocalization(
            CommandHelper.getUserPreferredLocale(member.id)
        );

        const userWarningEmbed = new EmbedBuilder()
            .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.avatarURL()!,
            })
            .setTitle(userLocalization.getTranslation("warningUnissued"))
            .setFooter({
                text: `${userLocalization.getTranslation("warningId")}: ${
                    warning.guildSpecificId
                } | ${userLocalization.getTranslation("userId")}: ${
                    member.id
                } | ${userLocalization.getTranslation(
                    "channelId"
                )}: ${interaction.channelId!}`,
            })
            .setTimestamp(new Date())
            .setDescription(
                `${bold(
                    `${StringHelper.formatString(
                        userLocalization.getTranslation(
                            "warningIssueInChannel"
                        ),
                        channelMention(warning.channelId)
                    )}`
                )}\n\n` +
                    `${bold(userLocalization.getTranslation("points"))}: ${
                        warning.points
                    }\n` +
                    `${bold(
                        userLocalization.getTranslation("warningReason")
                    )}: ${warning.reason}\n` +
                    `=========================\n\n` +
                    `${bold(
                        userLocalization.getTranslation("warningUnissueReason")
                    )}:\n` +
                    reason
            );

        const result = await this.warningDb.deleteOne({
            globalId: warning.globalId,
        });

        if (result.success) {
            try {
                await this.notifyMember(
                    member,
                    StringHelper.formatString(
                        localization.getTranslation(
                            "warnUnissueUserNotification"
                        ),
                        warning.globalId
                    ),
                    userWarningEmbed
                );
                // eslint-disable-next-line no-empty
            } catch {}

            await logChannel.send({ embeds: [warningEmbed] });
        }

        return result;
    }

    /**
     * Transfers warnings from one user to another.
     *
     * @param interaction The interaction with the user that transferred the warnings.
     * @param fromUserId The ID of the user to transfer warnings from.
     * @param toUserId The ID of the user to transfer warnings to.
     * @param reason The reason for transferring warnings.
     * @returns An object containing information about the operation.
     */
    static async transfer(
        interaction: RepliableInteraction<"cached">,
        fromUserId: Snowflake,
        toUserId: Snowflake,
        reason?: string | null
    ): Promise<OperationResult> {
        const localization = this.getLocalization(
            CommandHelper.getLocale(interaction)
        );

        const guildConfig = await this.punishmentDb.getGuildConfig(
            interaction.guildId
        );

        const punishmentManagerLocalization =
            this.getPunishmentManagerLocalization(localization.language);

        if (!guildConfig) {
            return this.createOperationResult(
                false,
                punishmentManagerLocalization.getTranslation(
                    this.logChannelNotFoundReject
                )
            );
        }

        const logChannel = await guildConfig.getGuildLogChannel(
            interaction.guild
        );

        if (!logChannel?.isTextBased()) {
            return this.createOperationResult(
                false,
                punishmentManagerLocalization.getTranslation(
                    this.logChannelNotValidReject
                )
            );
        }

        const logEmbed = new EmbedBuilder()
            .setAuthor({
                name: interaction.user.tag,
                iconURL: interaction.user.avatarURL()!,
            })
            .setTitle(localization.getTranslation("warningTransferred"))
            .setDescription(
                `${bold(
                    localization.getTranslation("fromUser")
                )}: ${userMention(fromUserId)} (${fromUserId})\n` +
                    `${bold(
                        localization.getTranslation("toUser")
                    )}: ${userMention(toUserId)} (${toUserId})\n\n` +
                    `=========================\n\n` +
                    `${bold(localization.getTranslation("reason"))}:\n` +
                    reason
            );

        const result =
            await DatabaseManager.aliceDb.collections.userWarning.transferWarnings(
                interaction.guildId!,
                fromUserId,
                toUserId
            );

        if (result.success) {
            await logChannel.send({ embeds: [logEmbed] });
        }

        return result;
    }

    /**
     * Checks if a guild member can warn a user.
     *
     * @param member The guild member.
     * @returns A boolean indicating whether the guild member can warn a user.
     */
    static userCanWarn(member: GuildMember): Promise<boolean> {
        return this.userCanTimeout(member, 1);
    }

    /**
     * Notifies a guild member about their warning status.
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
     * @param language The language to localize to.
     */
    private static getLocalization(
        language: Language
    ): WarningManagerLocalization {
        return new WarningManagerLocalization(language);
    }
}
