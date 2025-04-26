import { Constants } from "@core/Constants";
import { LoungeLockManager } from "@utils/managers/LoungeLockManager";
import { AuditLogEvent, GuildBan, User } from "discord.js";
import { EventUtil } from "structures/core/EventUtil";

export const run: EventUtil["run"] = async (_, guildBan: GuildBan) => {
    if (guildBan.guild.id !== Constants.mainServer) {
        return;
    }

    const auditLogEntries = await guildBan.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberBanAdd,
    });

    const banLog = auditLogEntries.entries.first();

    if (!banLog) {
        return;
    }

    const target = banLog.target as User;

    if (target.id !== guildBan.user.id) {
        return;
    }

    await LoungeLockManager.lock(
        target.id,
        "Banned from server",
        Number.POSITIVE_INFINITY
    );
};

export const config: EventUtil["config"] = {
    description:
        "Responsible for locking users from lounge if they are banned from the main server.",
    togglePermissions: ["BotOwner"],
    toggleScope: ["GLOBAL"],
};
