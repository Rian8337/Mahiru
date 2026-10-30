import { Constants } from "@core/Constants";
import { ExtraAttachmentFlags } from "@enums/interactions/ExtraAttachmentFlags";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { Message } from "discord.js";
import { EventUtil } from "structures/core/EventUtil";

function hasBit(bitfield: number, bit: number): boolean {
    return (bitfield & bit) !== 0;
}

export const run: EventUtil["run"] = async (_, message: Message) => {
    if (!message.inGuild()) {
        return;
    }

    if (message.guildId !== Constants.mainServer) {
        return;
    }

    if (message.attachments.size === 0) {
        return;
    }

    const attachment = message.attachments.first()!;
    const { bitfield } = attachment.flags;

    // Content scanning can run after the message is sent, so the flags may not be available immediately.
    // If that's the case, the message update event will be triggered when the flags are available.
    if (bitfield === 0) {
        return;
    }

    let tags: string[] = [];

    if (hasBit(bitfield, ExtraAttachmentFlags.Explicit)) {
        tags.push("Explicit");
    }

    if (hasBit(bitfield, ExtraAttachmentFlags.Gore)) {
        tags.push("Gore");
    }

    if (hasBit(bitfield, ExtraAttachmentFlags.SelfHarm)) {
        tags.push("Self-harm");
    }

    if (tags.length === 0) {
        return;
    }

    const reportChannel = await message.guild.channels.fetch(Constants.reportChannel);

    if (!reportChannel?.isTextBased()) {
        return;
    }

    const embed = EmbedCreator.createNormalEmbed({
        timestamp: true,
        author: message.author,
        color: "#ff0000",
        footerText: `Author ID: ${message.author.id} | Channel ID: ${message.channel.id} | Message ID: ${message.id}`,
    });

    embed.setTitle("Message Flagged")
        .addFields(
            {
                name: "Channel",
                value: `${message.channel} | ${message.url}`,
            },
            {
                name: "Flags",
                value: tags.join(", "),
            },
        );

    await reportChannel.send({ embeds: [embed] });
};

export const config: EventUtil["config"] = {
    description: "Responsible for checking message flags.",
    togglePermissions: ["BotOwner"],
    toggleScope: ["GLOBAL"],
};
