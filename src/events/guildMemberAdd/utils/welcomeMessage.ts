import { Constants } from "@core/Constants";
import { Symbols } from "@enums/utils/Symbols";
import { EventUtil } from "@structures/core/EventUtil";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { createCanvas, loadImage } from "canvas";
import {
    ActionRowBuilder,
    AttachmentBuilder,
    ButtonBuilder,
    ButtonStyle,
    GuildMember,
} from "discord.js";
import { join } from "path";

export const run: EventUtil["run"] = async (_, member: GuildMember) => {
    if (member.guild.id !== Constants.mainServer) {
        return;
    }

    const channel = await member.guild.channels.fetch(Constants.mainServer);

    if (!channel?.isSendable()) {
        return;
    }

    const canvas = createCanvas(800, 200);
    const ctx = canvas.getContext("2d");

    try {
        const background = await loadImage(
            join(process.cwd(), "files", "images", "welcome-banner.png")
        );

        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    } catch {
        ctx.fillStyle = "#7289da";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Outer left circle for avatar
    ctx.fillStyle = "#878787";
    ctx.globalAlpha = 0.75;

    ctx.beginPath();
    ctx.arc(-150, canvas.height / 2, 300, -90, 90);
    ctx.fill();
    ctx.closePath();

    // Avatar
    ctx.globalAlpha = 1;

    try {
        const avatar = await loadImage(
            member.displayAvatarURL({ extension: "png", size: 128 })
        );

        ctx.save();
        ctx.beginPath();
        ctx.arc(avatar.width / 2 + 11, canvas.height / 2, 64, 0, 360);
        ctx.clip();
        ctx.drawImage(avatar, 11, (canvas.height - avatar.height) / 2);
        ctx.closePath();
        ctx.restore();
    } catch {
        // Skip drawing avatar if it fails to load
    }

    // Welcome text
    ctx.save();
    ctx.translate(180, 0);
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.85;

    ctx.beginPath();
    ctx.roundRect(-10, 25, 600, 150, 15);
    ctx.fill();
    ctx.closePath();

    ctx.font = "bold 30px Torus";
    ctx.fillStyle = "#000000";
    ctx.textBaseline = "middle";
    ctx.fillText(`Welcome, ${member.user.username}!`, 0, 50);

    ctx.font = "bold 20px Torus";

    ctx.fillText("» Get started by pressing the button below", 0, 80);
    ctx.fillText("» Or greet everyone in the server!", 0, 105);
    ctx.fillText("» Enjoy your stay!", 0, 130);

    ctx.restore();

    await channel.send({
        content: MessageCreator.createAccept(
            `Welcome to the server, ${member.toString()}!`
        ),
        files: [
            new AttachmentBuilder(canvas.toBuffer(), { name: "welcome.png" }),
        ],
        components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId("initialOnboarding")
                    .setLabel("Bot Introduction")
                    .setEmoji(Symbols.wavingHand)
                    .setStyle(ButtonStyle.Primary)
            ),
        ],
    });
};

export const config: EventUtil["config"] = {
    description: "Responsible for sending welcome messages for new members.",
    togglePermissions: ["BotOwner"],
    toggleScope: ["GUILD"],
};
