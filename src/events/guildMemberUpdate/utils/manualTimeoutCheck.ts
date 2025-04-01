import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { EventUtil } from "structures/core/EventUtil";
import { ManualTimeoutCheckLocalization } from "@localization/events/guildMemberUpdate/manualTimeoutCheck/ManualTimeoutCheckLocalization";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { LoungeLockManager } from "@utils/managers/LoungeLockManager";
import {
    GuildMember,
    EmbedBuilder,
    AuditLogEvent,
    bold,
    User,
} from "discord.js";
import { CacheManager } from "@utils/managers/CacheManager";

export const run: EventUtil["run"] = async (
    client,
    oldMember: GuildMember,
    newMember: GuildMember
) => {
    const localization = new ManualTimeoutCheckLocalization("en");
    const userLocalization = new ManualTimeoutCheckLocalization(
        CommandHelper.getLocale(newMember.user)
    );

    const guildConfig = CacheManager.guildPunishmentConfigs.get(
        newMember.guild.id
    );

    if (!guildConfig) {
        return;
    }

    const logChannel = await guildConfig.getGuildLogChannel(newMember.guild);

    if (!logChannel?.isTextBased()) {
        return;
    }

    if (
        (!oldMember.communicationDisabledUntil &&
            newMember.communicationDisabledUntil) ||
        (guildConfig.permanentTimeoutRole &&
            !oldMember.roles.cache.has(guildConfig.permanentTimeoutRole) &&
            newMember.roles.cache.has(guildConfig.permanentTimeoutRole))
    ) {
        // Member was timeouted
        const auditLogEntries = await newMember.guild.fetchAuditLogs({
            limit: 1,
            type:
                !oldMember.communicationDisabledUntil &&
                newMember.communicationDisabledUntil
                    ? AuditLogEvent.MemberUpdate
                    : AuditLogEvent.MemberRoleUpdate,
        });

        const auditLog = auditLogEntries.entries.first();

        if (!auditLog?.executor || auditLog.executor.id === client.user.id) {
            return;
        }

        let timeDifference = Number.POSITIVE_INFINITY;

        if (
            !oldMember.communicationDisabledUntil &&
            newMember.communicationDisabledUntil
        ) {
            const firstAuditLog = auditLog.changes.find(
                (v) => v.key === "communication_disabled_until"
            );

            if (!firstAuditLog) {
                return;
            }

            const timeoutDate = new Date(firstAuditLog.new!);

            timeDifference = Math.ceil(
                DateTimeFormatHelper.getTimeDifference(timeoutDate) / 1000
            );
        }

        const timeoutEmbed = new EmbedBuilder()
            .setAuthor({
                name: auditLog.executor.tag,
                iconURL: auditLog.executor.avatarURL()!,
            })
            .setTitle(localization.getTranslation("timeoutExecuted"))
            .setFooter({
                text: `${localization.getTranslation("userId")}: ${
                    newMember.id
                }`,
            })
            .setTimestamp(new Date())
            .setDescription(
                `${bold(
                    `${newMember}: ${
                        Number.isFinite(timeDifference)
                            ? DateTimeFormatHelper.secondsToDHMS(
                                  timeDifference,
                                  localization.language
                              )
                            : "Indefinite"
                    }`
                )}\n\n` +
                    `=========================\n\n` +
                    `${bold(localization.getTranslation("reason"))}:\n` +
                    (auditLog.reason ??
                        localization.getTranslation("notSpecified"))
            );

        const userTimeoutEmbed = new EmbedBuilder()
            .setAuthor({
                name: newMember.user.tag,
                iconURL: newMember.user.avatarURL()!,
            })
            .setTitle(userLocalization.getTranslation("timeoutExecuted"))
            .setFooter({
                text: `${userLocalization.getTranslation("userId")}: ${
                    newMember.id
                }`,
            })
            .setTimestamp(new Date())
            .setDescription(
                `${bold(
                    `${newMember}: ${
                        Number.isFinite(timeDifference)
                            ? DateTimeFormatHelper.secondsToDHMS(
                                  timeDifference,
                                  userLocalization.language
                              )
                            : "Indefinite"
                    }`
                )}\n\n` +
                    `=========================\n\n` +
                    `${bold(userLocalization.getTranslation("reason"))}:\n` +
                    (auditLog.reason ??
                        userLocalization.getTranslation("notSpecified"))
            );

        try {
            newMember.send({
                content: MessageCreator.createWarn(
                    userLocalization.getTranslation("timeoutUserNotification"),
                    DateTimeFormatHelper.secondsToDHMS(
                        timeDifference,
                        userLocalization.language
                    ),
                    auditLog.reason ??
                        userLocalization.getTranslation("notSpecified")
                ),
                embeds: [userTimeoutEmbed],
            });
            // eslint-disable-next-line no-empty
        } catch {}

        if (
            timeDifference >= 6 * 3600 &&
            newMember.guild.id === Constants.mainServer
        ) {
            await LoungeLockManager.lock(
                newMember.id,
                "Timeouted for 6 hours or longer",
                30 * 24 * 3600
            );
        }

        await logChannel.send({ embeds: [timeoutEmbed] });
    } else if (
        (oldMember.communicationDisabledUntil &&
            !newMember.communicationDisabledUntil) ||
        (guildConfig.permanentTimeoutRole &&
            oldMember.roles.cache.has(guildConfig.permanentTimeoutRole) &&
            !newMember.roles.cache.has(guildConfig.permanentTimeoutRole))
    ) {
        // Member was untimeouted
        const auditLogEntries = await newMember.guild.fetchAuditLogs({
            limit: 1,
            type:
                oldMember.communicationDisabledUntil &&
                !newMember.communicationDisabledUntil
                    ? AuditLogEvent.MemberUpdate
                    : AuditLogEvent.MemberRoleUpdate,
        });

        const auditLog = auditLogEntries.entries.first();

        if (!auditLog?.executor || auditLog.executor.id === client.user.id) {
            return;
        }

        const untimeoutEmbed = new EmbedBuilder()
            .setAuthor({
                name: auditLog.executor.tag,
                iconURL: auditLog.executor.avatarURL()!,
            })
            .setTitle(localization.getTranslation("untimeoutExecuted"))
            .setFooter({
                text: `${localization.getTranslation("userId")}: ${
                    newMember.id
                }`,
            })
            .setTimestamp(new Date())
            .setDescription(
                `${bold(localization.getTranslation("userId"))}:\n` +
                    (auditLog.target?.id ??
                        localization.getTranslation("notSpecified"))
            );

        const userUntimeoutEmbed = new EmbedBuilder()
            .setAuthor({
                name: auditLog.executor.tag,
                iconURL: auditLog.executor.avatarURL()!,
            })
            .setTitle(userLocalization.getTranslation("untimeoutExecuted"))
            .setFooter({
                text: `${userLocalization.getTranslation("userId")}: ${
                    newMember.id
                }`,
            })
            .setTimestamp(new Date())
            .setDescription(
                `${bold(userLocalization.getTranslation("userId"))}:\n` +
                    (auditLog.reason ??
                        userLocalization.getTranslation("notSpecified"))
            );

        try {
            newMember.send({
                content: MessageCreator.createWarn(
                    userLocalization.getTranslation(
                        "untimeoutUserNotification"
                    ),
                    auditLog.reason ??
                        localization.getTranslation("notSpecified")
                ),
                embeds: [userUntimeoutEmbed],
            });
            // eslint-disable-next-line no-empty
        } catch {}

        await logChannel.send({ embeds: [untimeoutEmbed] });
    }
};

export const config: EventUtil["config"] = {
    description: "Responsible for logging manually given/taken timeouts.",
    togglePermissions: ["BotOwner"],
    toggleScope: ["GLOBAL"],
};
