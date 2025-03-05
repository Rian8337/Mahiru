import { GuildBan, AuditLogEvent } from "discord.js";
import { EventUtil } from "structures/core/EventUtil";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { CacheManager } from "@utils/managers/CacheManager";

export const run: EventUtil["run"] = async (_, guildBan: GuildBan) => {
    const auditLogEntries = await guildBan.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberBanAdd,
    });

    const banLog = auditLogEntries.entries.first();

    if (!banLog) {
        return;
    }

    const user = banLog.target!;

    if (user.id !== guildBan.user.id) {
        return;
    }

    const guildConfig = CacheManager.guildPunishmentConfigs.get(
        guildBan.guild.id
    );

    if (!guildConfig) {
        return;
    }

    const logChannel = await guildConfig.getGuildLogChannel(guildBan.guild);

    if (!logChannel?.isTextBased()) {
        return;
    }

    const embed = EmbedCreator.createNormalEmbed({ timestamp: true });

    embed
        .setTitle("User Banned")
        .setThumbnail(user.avatarURL()!)
        .addFields(
            {
                name: `Banned user: ${user.tag}`,
                value: `User ID: ${user.id}`,
            },
            {
                name: "=========================",
                value: `Reason: ${banLog.reason ?? "Not specified."}`,
            }
        );

    if (banLog.executor) {
        embed.setAuthor({
            name: banLog.executor.tag,
            iconURL: banLog.executor.avatarURL()!,
        });
    }

    logChannel.send({ embeds: [embed] });
};

export const config: EventUtil["config"] = {
    description: "Responsible for notifying about ban actions.",
    togglePermissions: ["ManageGuild"],
    toggleScope: ["GLOBAL", "GUILD"],
};
