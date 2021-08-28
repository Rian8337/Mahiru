import { Guild, GuildChannel, MessageEmbed, TextChannel, User } from "discord.js";
import { EventUtil } from "@alice-interfaces/core/EventUtil";
import { EmbedCreator } from "@alice-utils/creators/EmbedCreator";
import { GuildPunishmentConfig } from "@alice-database/utils/aliceDb/GuildPunishmentConfig";
import { DatabaseManager } from "@alice-database/DatabaseManager";

export const run: EventUtil["run"] = async (_, guild: Guild, user: User) => {
    const guildConfig: GuildPunishmentConfig | null = await DatabaseManager.aliceDb.collections.guildPunishmentConfig.getGuildConfig(guild.id);

    if (!guildConfig) {
        return;
    }

    const logChannel: GuildChannel | null = guildConfig.getGuildLogChannel(guild);

    if (!(logChannel instanceof TextChannel)) {
        return;
    }

    const embed: MessageEmbed = EmbedCreator.createNormalEmbed(
        { timestamp: true }
    );

    embed.setTitle("Unban Executed")
        .setThumbnail(<string> user.avatarURL({ dynamic: true }))
        .addField(`Unbanned user: ${user.tag}`, `User ID: ${user.id}`);

    logChannel.send({ embeds: [embed] });
};

export const config: EventUtil["config"] = {
    description: "Responsible for notifying about unban actions.",
    togglePermissions: ["MANAGE_GUILD"],
    toggleScope: ["GLOBAL", "GUILD"]
};