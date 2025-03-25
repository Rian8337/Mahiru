import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { EventUtil } from "@structures/core/EventUtil";
import { CacheManager } from "@utils/managers/CacheManager";
import { GuildMember } from "discord.js";

export const run: EventUtil["run"] = async (_, member: GuildMember) => {
    if (member.guild.id !== Constants.mainServer) {
        return;
    }

    if (!CacheManager.guildPunishmentConfigs.has(member.guild.id)) {
        return;
    }

    const guildConfig = CacheManager.guildPunishmentConfigs.get(
        member.guild.id
    );

    if (!guildConfig?.permanentTimeoutRole) {
        return;
    }

    if (!CacheManager.indefiniteTimeouts.has(member.id)) {
        return;
    }

    await member.roles.add(
        guildConfig.permanentTimeoutRole,
        "Indefinite timeout reapply"
    );

    await DatabaseManager.aliceDb.collections.indefiniteTimeout.removeUser(
        member.id
    );
};

export const config: EventUtil["config"] = {
    description:
        "Responsible for reapplying indefinite timeouts upon user join.",
    togglePermissions: ["BotOwner"],
    toggleScope: ["GUILD"],
};
