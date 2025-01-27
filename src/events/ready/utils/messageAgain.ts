import { Constants } from "@core/Constants";
import { Symbols } from "@enums/utils/Symbols";
import { EventUtil } from "@structures/core/EventUtil";
import {
    ActionRowBuilder,
    AttachmentBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    hyperlink,
} from "discord.js";

export const run: EventUtil["run"] = async (client) => {
    const guild = await client.guilds.fetch(Constants.mainServer);

    const channel = await guild.channels.fetch("1331893317461344339");

    if (!channel?.isTextBased()) {
        return;
    }

    channel.send({
        components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId("initialOnboarding")
                    .setEmoji(Symbols.wavingHand)
                    .setStyle(ButtonStyle.Primary)
                    .setLabel("Bot Introduction"),
            ),
        ],
        files: [
            new AttachmentBuilder(Constants.welcomeImagePath, {
                name: "welcomeimage.png",
            }),
        ],
        embeds: [
            new EmbedBuilder()
                .setColor("#ffea76")
                .setTitle("Welcome to osu!droid (International)!")
                .setImage("attachment://welcomeimage.png")
                .setDescription(
                    `This is a server focused around ${hyperlink("osu!droid", "<https://osudroid.moe>")}, a community-driven rhythm game that is based on another rhythm game called ${hyperlink("osu!", "<https://osu.ppy.sh>")}. osu!droid is developed by a small group of volunteers, with support from a relatively small but awesome community.` +
                        "\n\n" +
                        "Should you have any questions, please do not hesitate to ask a staff member. I hope you enjoy your stay!",
                ),
        ],
    });
};

export const config: EventUtil["config"] = {
    description: "idek",
    togglePermissions: [],
    toggleScope: [],
};
