import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { EventUtil } from "@structures/core/EventUtil";
import { CacheManager } from "@utils/managers/CacheManager";
import { GuildMember } from "discord.js";

export const run: EventUtil["run"] = async (_, member: GuildMember) => {
    if (member.guild.id !== Constants.mainServer) {
        return;
    }

    const guildConfig = CacheManager.guildPunishmentConfigs.get(
        member.guild.id
    );

    if (!guildConfig?.permanentTimeoutRole) {
        return;
    }

    if (!member.roles.cache.has(guildConfig.permanentTimeoutRole)) {
        return;
    }

    await DatabaseManager.aliceDb.collections.indefiniteTimeout.addUser(
        member.id
    );
};

export const config: EventUtil["config"] = {
    description:
        "Responsible for saving indefinite timeouts when a user leaves the server.",
    togglePermissions: ["BotOwner"],
    toggleScope: ["GUILD"],
};
