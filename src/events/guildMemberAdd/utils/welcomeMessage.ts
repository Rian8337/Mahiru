import {
    ActionRowBuilder,
    AttachmentBuilder,
    ButtonBuilder,
    ButtonStyle,
    GuildMember,
    GuildMemberFlags,
} from "discord.js";
import { EventUtil } from "structures/core/EventUtil";
import { Constants } from "@core/Constants";
import { Symbols } from "@enums/utils/Symbols";

export const run: EventUtil["run"] = async (_, member: GuildMember) => {
    if (member.guild.id !== Constants.mainServer || member.user.bot) {
        return;
    }

    const general = await member.guild.channels.fetch(Constants.mainServer);

    if (!general?.isTextBased()) {
        return;
    }

    general.send({
        content: `Welcome ${member.flags.has(GuildMemberFlags.DidRejoin) ? "back " : ""}to ${
            member.guild.name
        }, ${member}!`,
        files: [
            new AttachmentBuilder(Constants.welcomeImagePath, {
                name: "welcomeimage.png",
            }),
        ],
        components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId("initialOnboarding")
                    .setEmoji(Symbols.wavingHand)
                    .setStyle(ButtonStyle.Primary)
                    .setLabel("Bot Introduction"),
            ),
        ],
    });
};

export const config: EventUtil["config"] = {
    description: "Responsible for greeting new users to the server.",
    togglePermissions: ["BotOwner"],
    toggleScope: ["GLOBAL"],
};
