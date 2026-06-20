import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { EventUtil } from "@structures/core/EventUtil";
import { chatInputApplicationCommandMention, GuildMember } from "discord.js";

export const run: EventUtil["run"] = async (
    _,
    oldMember: GuildMember,
    newMember: GuildMember,
) => {
    if (!oldMember.premiumSince && newMember.premiumSince) {
        // User has started boosting the server, greet with thank you message if they can claim a booster role.
        const generalChannel = await newMember.guild.channels.fetch(
            Constants.mainServer,
        );

        if (!generalChannel?.isTextBased()) {
            return;
        }

        const boosterRoleCount =
            await DatabaseManager.aliceDb.collections.boosterRole.getCount();

        if (boosterRoleCount >= 20) {
            return;
        }

        await generalChannel.send({
            content: `Thank you for boosting the server, ${newMember}! You can claim your booster role by using the ${chatInputApplicationCommandMention("booster", "claim", "1517880635702907021")} command.`,
        });
    } else if (oldMember.premiumSince && !newMember.premiumSince) {
        // User has stopped boosting the server, proceed with booster role removal.
        const boosterRole =
            await DatabaseManager.aliceDb.collections.boosterRole.getFromDiscordId(
                newMember.id,
            );

        if (!boosterRole) {
            return;
        }

        await DatabaseManager.aliceDb.collections.boosterRole.deleteFromDiscordId(
            newMember.id,
        );

        await newMember.guild.roles.delete(
            boosterRole.roleId,
            "Booster role removed due to user no longer boosting.",
        );
    }
};

export const config: EventUtil["config"] = {
    description: "Responsible for checking booster roles.",
    togglePermissions: ["BotOwner"],
    toggleScope: ["GUILD"],
};
