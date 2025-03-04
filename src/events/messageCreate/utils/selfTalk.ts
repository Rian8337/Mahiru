import { Message, TextChannel } from "discord.js";
import { Config } from "@core/Config";
import { EventUtil } from "structures/core/EventUtil";
import { Constants } from "@core/Constants";

export const run: EventUtil["run"] = async (client, message: Message) => {
    if (
        !Config.botOwners.includes(message.author.id) ||
        message.channel.id !== "683633835753472032"
    ) {
        return;
    }

    const attachment = message.attachments.first();

    (<TextChannel>await client.channels.fetch(Constants.mainServer)).send({
        content: message.content,
        files: attachment && attachment.size <= 8e6 ? [attachment] : undefined,
    });
};

export const config: EventUtil["config"] = {
    description: "Responsible for sending bot owner messages through the bot.",
    togglePermissions: ["BotOwner"],
    toggleScope: ["GLOBAL"],
};
