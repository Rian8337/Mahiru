import { DatabaseManager } from "@database/DatabaseManager";
import { EventUtil } from "@structures/core/EventUtil";
import { ChannelType, GuildChannel, OverwriteType } from "discord.js";

export const run: EventUtil["run"] = async (_, channel: GuildChannel) => {
    if (
        channel.type !== ChannelType.GuildForum &&
        channel.type !== ChannelType.GuildVoice &&
        channel.type !== ChannelType.GuildText
    ) {
        return;
    }

    const guildConfig =
        await DatabaseManager.aliceDb.collections.guildPunishmentConfig.getGuildConfig(
            channel.guild,
            { projection: { _id: 0, permanentTimeoutRole: 1 } }
        );

    if (!guildConfig?.permanentTimeoutRole) {
        return;
    }

    await channel.permissionOverwrites.edit(
        guildConfig.permanentTimeoutRole,
        {
            AddReactions: false,
            SendMessages: false,
            SendMessagesInThreads: false,
            Connect: false,
            Speak: false,
        },
        {
            type: OverwriteType.Role,
            reason: "Permanent timeout role permission",
        }
    );
};

export const config: EventUtil["config"] = {
    description:
        "Responsible for adding timeout role permissions to a newly created channel.",
    togglePermissions: ["BotOwner"],
    toggleScope: ["GUILD"],
};
