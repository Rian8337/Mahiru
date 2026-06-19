import { DatabaseManager } from "@database/DatabaseManager";
import { EventUtil } from "@structures/core/EventUtil";
import { GuildMember } from "discord.js";

export const run: EventUtil["run"] = async (_, member: GuildMember) => {
    if (!member.premiumSince) {
        return;
    }

    const boosterRole =
        await DatabaseManager.aliceDb.collections.boosterRole.getFromDiscordId(
            member.id,
        );

    if (!boosterRole) {
        return;
    }

    await DatabaseManager.aliceDb.collections.boosterRole.deleteFromDiscordId(
        member.id,
    );

    await member.guild.roles.delete(
        boosterRole.roleId,
        "Booster role removed due to user no longer boosting.",
    );
};

export const config: EventUtil["config"] = {
    description: "Responsible for checking booster roles.",
    togglePermissions: ["BotOwner"],
    toggleScope: ["GUILD"],
};
