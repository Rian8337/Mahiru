import { Config } from "@core/Config";
import { Constants } from "@core/Constants";
import { AntiSpamLocalization } from "@localization/events/messageCreate/antiSpam/AntiSpamLocalization";
import { EventUtil } from "@structures/core/EventUtil";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { CacheManager } from "@utils/managers/CacheManager";
import { bold, EmbedBuilder, Message, Snowflake, time } from "discord.js";

interface MessageInformation {
    /**
     * Messages with the same content across different channels.
     */
    readonly messages: Map<Snowflake, Message<true>>;

    timeout: NodeJS.Timeout;
}

// Map from user ID to a map of message content and messages with the same content across different channels.
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
    }, 10000);

    let messageInformation = userMessages.get(message.content);

    if (messageInformation) {
        messageInformation.messages.set(message.channelId, message);

        clearTimeout(messageInformation.timeout);
        messageInformation.timeout = timeout;
    } else {
        messageInformation = {
            messages: new Map([[message.channelId, message]]),
            timeout: timeout,
        };

        userMessages.set(message.content, messageInformation);
    }

    messageCache.set(message.author.id, userMessages);

    if (messageInformation.messages.size < 4) {
        return;
    }

    // More than 4 messages - consider as spam.
    const reportChannel = await message.guild.channels.fetch(Constants.reportChannel);

    if (!reportChannel?.isTextBased()) {
        return;
    }

    const timeoutDuration = 180 * 1000;

    const timeoutReason =
        "[Automated Timeout] You were sending multiple similar messages too fast! Please calm down.";

    await member.timeout(timeoutDuration, timeoutReason);

    for (const message of messageInformation.messages.values()) {
        await message.delete();
    }

    clearTimeout(messageInformation.timeout);
    messageCache.delete(message.author.id);

    const localization = new AntiSpamLocalization("en");
    const userLocalization = new AntiSpamLocalization(
        CommandHelper.getLocale(member.id)
    );

    const messages = Array.from(messageInformation.messages.values())
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    const reportEmbed = new EmbedBuilder()
        .setTitle(localization.getTranslation("spamDetected"))
        .setFooter({
            text: `${localization.getTranslation("userId")}: ${member.id}`,
        })
        .setTimestamp(new Date())
        .setDescription(
            messages
                .map((m, i) => {
                    let str = `${i + 1}. ${m.channel.toString()}\n`;
                    str += `${time(m.createdAt, "F")} (${time(m.createdAt, "R")})`;

                    if (i > 0) {
                        const prevMessage = messages[i - 1];
                        const diff = m.createdTimestamp - prevMessage.createdTimestamp;
                        str += ` (Δ ${DateTimeFormatHelper.secondsToDHMS(diff / 1000, localization.language)})`;
                    }

                    return str;
                })
                .join("\n")
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
                    timeoutDuration / 1000,
                    userLocalization.language
                )}`
            )}\n\n` +
                `=========================\n\n` +
                `${bold(userLocalization.getTranslation("reason"))}:\n` +
                timeoutReason
        );

    await member
        .send({
            content: MessageCreator.createWarn(
                userLocalization.getTranslation("timeoutUserNotification"),
                DateTimeFormatHelper.secondsToDHMS(
                    timeoutDuration / 1000,
                    userLocalization.language
                ),
                timeoutReason
            ),
            embeds: [userTimeoutEmbed],
        })
        .catch(() => null);

    await reportChannel.send({ embeds: [reportEmbed] });
};

export const config: EventUtil["config"] = {
    description: "Responsible for preventing spam.",
    togglePermissions: ["ManageGuild"],
    toggleScope: ["GUILD"],
};
