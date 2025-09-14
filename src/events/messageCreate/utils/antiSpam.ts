import { Config } from "@core/Config";
import { Constants } from "@core/Constants";
import { AntiSpamLocalization } from "@localization/events/messageCreate/antiSpam/AntiSpamLocalization";
import { EventUtil } from "@structures/core/EventUtil";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { CacheManager } from "@utils/managers/CacheManager";
import { bold, EmbedBuilder, Message, Snowflake } from "discord.js";

interface MessageInformation {
    readonly messages: Message<true>[];
    timeout: NodeJS.Timeout;
}

// Map from user ID to a map of message content and messages with the same content
const messageCache = new Map<Snowflake, Map<string, MessageInformation>>();

const ignoredChannelIds = new Set<Snowflake>([
    "325827427446161413",
    "1231008823695769722",
    "686948895212961807",
]);

export const run: EventUtil["run"] = async (_, message: Message) => {
    if (
        message.author.bot ||
        !message.inGuild() ||
        message.guildId !== Constants.mainServer ||
        ignoredChannelIds.has(message.channelId)
    ) {
        return;
    }

    const guildConfig = CacheManager.guildPunishmentConfigs.get(
        message.guildId
    );

    if (!guildConfig) {
        return;
    }

    const member =
        message.member ??
        (await message.guild.members.fetch(message.author.id));

    if (
        guildConfig.immuneTimeoutRoles.some((roleId) =>
            member.roles.cache.has(roleId)
        )
    ) {
        return;
    }

    const userMessages =
        messageCache.get(message.author.id) ??
        new Map<string, MessageInformation>();

    const timeout = setTimeout(() => {
        userMessages.delete(message.content);
    }, 15000);

    let messageInformation = userMessages.get(message.content);

    if (messageInformation) {
        messageInformation.messages.push(message);

        clearTimeout(messageInformation.timeout);
        messageInformation.timeout = timeout;
    } else {
        messageInformation = { messages: [message], timeout: timeout };
        userMessages.set(message.content, messageInformation);
    }

    messageCache.set(message.author.id, userMessages);

    if (messageInformation.messages.length < 5) {
        return;
    }

    // More than 5 messages - consider as spam.
    const logChannel = await guildConfig.getGuildLogChannel(message.guild);

    if (!logChannel?.isTextBased()) {
        return;
    }

    const botOwner = await message.guild.members.fetch(Config.botOwners[1]);
    const duration = 30 * 1000;
    const reason = `${bold("[Automated Timeout]")} You were sending multiple similar messages too fast! Please calm down.`;

    await member.timeout(duration, reason);

    for (const message of messageInformation.messages) {
        await message.delete();
    }

    clearTimeout(messageInformation.timeout);
    messageCache.delete(message.author.id);

    const localization = new AntiSpamLocalization("en");
    const userLocalization = new AntiSpamLocalization(
        CommandHelper.getLocale(member.id)
    );

    const timeoutEmbed = new EmbedBuilder()
        .setAuthor({
            name: botOwner.user.tag,
            iconURL: botOwner.user.avatarURL()!,
        })
        .setTitle(localization.getTranslation("timeoutExecuted"))
        .setFooter({
            text: `${localization.getTranslation("userId")}: ${member.id}`,
        })
        .setTimestamp(new Date())
        .setDescription(
            `${bold(
                `${member.toString()}: ${DateTimeFormatHelper.secondsToDHMS(
                    duration / 1000,
                    localization.language
                )}`
            )}\n\n` +
                `=========================\n\n` +
                `${bold(localization.getTranslation("reason"))}:\n` +
                reason
        );

    const userTimeoutEmbed = new EmbedBuilder()
        .setTitle(userLocalization.getTranslation("timeoutExecuted"))
        .setFooter({
            text: `${userLocalization.getTranslation("userId")}: ${member.id}`,
        })
        .setTimestamp(new Date())
        .setDescription(
            `${bold(
                `${member.toString()}: ${DateTimeFormatHelper.secondsToDHMS(
                    duration / 1000,
                    userLocalization.language
                )}`
            )}\n\n` +
                `=========================\n\n` +
                `${bold(userLocalization.getTranslation("reason"))}:\n` +
                reason
        );

    await member
        .send({
            content: MessageCreator.createWarn(
                userLocalization.getTranslation("timeoutUserNotification"),
                DateTimeFormatHelper.secondsToDHMS(
                    duration / 1000,
                    userLocalization.language
                ),
                reason
            ),
            embeds: [userTimeoutEmbed],
        })
        .catch(() => null);

    await logChannel.send({ embeds: [timeoutEmbed] });
};

export const config: EventUtil["config"] = {
    description: "Responsible for preventing spam.",
    togglePermissions: ["ManageGuild"],
    toggleScope: ["GUILD"],
};
