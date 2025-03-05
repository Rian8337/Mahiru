import { EventUtil } from "@structures/core/EventUtil";
import { CacheManager } from "@utils/managers/CacheManager";
import { ChannelType, GuildChannel, OverwriteType } from "discord.js";

export const run: EventUtil["run"] = async (_, channel: GuildChannel) => {
    if (
        channel.type !== ChannelType.GuildForum &&
        channel.type !== ChannelType.GuildVoice &&
        channel.type !== ChannelType.GuildText
    ) {
        return;
    }

    const guildConfig = CacheManager.guildPunishmentConfigs.get(
        channel.guildId
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
