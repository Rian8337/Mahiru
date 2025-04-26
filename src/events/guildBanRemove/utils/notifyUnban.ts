import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { CacheManager } from "@utils/managers/CacheManager";
import { AuditLogEvent, GuildBan } from "discord.js";
import { EventUtil } from "structures/core/EventUtil";

export const run: EventUtil["run"] = async (_, guildBan: GuildBan) => {
    const auditLogEntries = await guildBan.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberBanRemove,
    });

    const unbanLog = auditLogEntries.entries.first();

    if (!unbanLog) {
        return;
    }

    const user = unbanLog.target!;

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
        .setTitle("User Unbanned")
        .setThumbnail(guildBan.user.avatarURL()!)
        .addFields({
            name: `Unbanned user: ${guildBan.user.tag}`,
            value: `User ID: ${guildBan.user.id}`,
        });

    if (unbanLog.executor) {
        embed.setAuthor({
            name: unbanLog.executor.tag!,
            iconURL: unbanLog.executor.avatarURL()!,
        });
    }

    logChannel.send({ embeds: [embed] });
};

export const config: EventUtil["config"] = {
    description: "Responsible for notifying about unban actions.",
    togglePermissions: ["ManageGuild"],
    toggleScope: ["GLOBAL", "GUILD"],
};
