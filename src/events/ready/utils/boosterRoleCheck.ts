import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { EventUtil } from "@structures/core/EventUtil";

export const run: EventUtil["run"] = async (client) => {
    const guild = await client.guilds.fetch(Constants.mainServer);

    await guild.emojis.fetch();

    const boosterRoles =
        await DatabaseManager.aliceDb.collections.boosterRole.get("discordId");

    for (const [discordId, boosterRole] of boosterRoles) {
        const member = await guild.members.fetch(discordId).catch(() => null);

        if (!member?.premiumSince) {
            await DatabaseManager.aliceDb.collections.boosterRole.deleteFromDiscordId(
                discordId,
            );

            await guild.roles.delete(
                boosterRole.roleId,
                "Booster role removed due to user no longer boosting.",
            );
        }
    }
};

export const config: EventUtil["config"] = {
    description: "Responsible for checking booster roles.",
    togglePermissions: ["BotOwner"],
    toggleScope: ["GUILD"],
};
