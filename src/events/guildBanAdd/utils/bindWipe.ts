import { GuildBan } from "discord.js";
import { DatabaseManager } from "@database/DatabaseManager";
import { EventUtil } from "structures/core/EventUtil";
import { Constants } from "@core/Constants";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CacheManager } from "@utils/managers/CacheManager";

export const run: EventUtil["run"] = async (_, guildBan: GuildBan) => {
    if (guildBan.guild.id !== Constants.mainServer) {
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

    const bindDb = DatabaseManager.elainaDb.collections.userBind;
    const bindInfo = await bindDb.getFromUser(guildBan.user, {
        projection: { _id: 0 },
    });

    if (!bindInfo) {
        return;
    }

    await bindDb.deleteOne({ discordid: guildBan.user.id });

    logChannel.send(
        MessageCreator.createAccept(`Successfully unbound ${guildBan.user}.`)
    );
};

export const config: EventUtil["config"] = {
    description: "Responsible for unbinding a user once they are banned.",
    togglePermissions: ["BotOwner"],
    toggleScope: ["GLOBAL"],
};
