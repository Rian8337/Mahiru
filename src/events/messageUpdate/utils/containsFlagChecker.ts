import { Constants } from "@core/Constants";
import { ExtraAttachmentFlags } from "@enums/interactions/ExtraAttachmentFlags";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import {
    Message,
} from "discord.js";
import { EventUtil } from "structures/core/EventUtil";

function hasBit(bitfield: number, bit: number): boolean {
    return (bitfield & bit) !== 0;
}

export const run: EventUtil["run"] = async (
    _,
    oldMessage: Message,
    newMessage: Message,
) => {
    if (!oldMessage.inGuild() || !newMessage.inGuild()) {
        return;
    }

    if (oldMessage.guildId !== Constants.mainServer) {
        return;
    }

    if (oldMessage.attachments.size === 0 || newMessage.attachments.size === 0) {
        return;
    }

    const oldAttachment = oldMessage.attachments.first()!;
    const newAttachment = newMessage.attachments.first()!;

    const oldBitfield = oldAttachment.flags.bitfield;
    const newBitfield = newAttachment.flags.bitfield;

    // If their flags are the same, we don't need to log anything.
    if (oldBitfield === newBitfield) {
        return;
    }

    // We only want to tag the message if it has a new flag that it didn't have before.
    let tags: string[] = [];

    if (
        !hasBit(oldAttachment.flags.bitfield, ExtraAttachmentFlags.Explicit) &&
        hasBit(newBitfield, ExtraAttachmentFlags.Explicit)
    ) {
        tags.push("Explicit");
    }

    if (
        !hasBit(oldAttachment.flags.bitfield, ExtraAttachmentFlags.Gore) &&
        hasBit(newAttachment.flags.bitfield, ExtraAttachmentFlags.Gore)
    ) {
        tags.push("Gore");
    }

    if (
        !hasBit(oldAttachment.flags.bitfield, ExtraAttachmentFlags.SelfHarm) &&
        hasBit(newAttachment.flags.bitfield, ExtraAttachmentFlags.SelfHarm)
    ) {
        tags.push("Self-harm");
    }

    if (tags.length === 0) {
        return;
    }

    const reportChannel = await newMessage.guild.channels.fetch(Constants.reportChannel);

    if (!reportChannel?.isTextBased()) {
        return;
    }

    const embed = EmbedCreator.createNormalEmbed({
        timestamp: true,
        author: newMessage.author,
        color: "#ff0000",
        footerText: `Author ID: ${newMessage.author.id} | Channel ID: ${newMessage.channel.id} | Message ID: ${newMessage.id}`,
    });

    embed.setTitle("Message Flagged")
        .addFields(
            {
                name: "Channel",
                value: `${newMessage.channel} | ${newMessage.url}`,
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
