import { Bot } from "@alice-core/Bot";
import { Constants } from "@alice-core/Constants";
import { DatabaseManager } from "@alice-database/DatabaseManager";
import { Collection, FetchedThreads, Guild, Message, MessageManager, Snowflake, TextChannel, ThreadChannel } from "discord.js";
import { HelperFunctions } from "./HelperFunctions";

/**
 * A helper for the bot's message analytics.
 */
export abstract class MessageAnalyticsHelper {
    /**
     * The IDs of channel categories that are ignored.
     */
    static readonly filteredCategories: Snowflake[] = [
        "360714803691388928",
        "415559968062963712",
        "360715303149240321",
        "360715871187894273",
        "360715992621514752"
    ];

    /**
     * The IDs of channels that are ignored.
     */
    static readonly filteredChannels: Snowflake[] = [
        "326152555392532481",
        "361785436982476800",
        "316863464888991745",
        "549109230284701718",
        "468042874202750976",
        "430002296160649229",
        "430939277720027136",
        "757137265351721001",
        "757135236659413033",
        "757136393142010027",
        "757137031162888223",
        "757137127652982846",
        "696663321633357844",
        "803160572345712640"
    ];

    /**
     * Fetches messages on a daily basis.
     * 
     * Run each time daily counter is reset.
     * 
     * @param client The instance of the bot.
     * @param newDailyTime The new daily time, in milliseconds.
     */
    static async fetchDaily(client: Bot, newDailyTime: number): Promise<void> {
        const guild: Guild = await client.guilds.fetch(Constants.mainServer);

        const channelData: Collection<Snowflake, number> = new Collection();

        for await (const channel of guild.channels.cache.values()) {
            if (this.filteredCategories.includes(<Snowflake> channel.parentId)) {
                continue;
            }

            if (this.filteredChannels.includes(channel.id)) {
                continue;
            }

            if (!(channel instanceof TextChannel)) {
                continue;
            }

            let finalCount: number = await this.getUserMessagesCount(channel, (newDailyTime - 86400) * 1000, newDailyTime * 1000);

            const activeThreads: FetchedThreads = await channel.threads.fetchActive();

            for await (const activeThread of activeThreads.threads.values()) {
                finalCount += await this.getUserMessagesCount(activeThread, (newDailyTime - 86400) * 1000, newDailyTime * 1000);
            }

            const archivedThreads: FetchedThreads = await channel.threads.fetchArchived({ fetchAll: true });

            for await (const archivedThread of archivedThreads.threads.values()) {
                finalCount += await this.getUserMessagesCount(archivedThread, (newDailyTime - 86400) * 1000, newDailyTime * 1000);
            }

            channelData.set(channel.id, (channelData.get(channel.id) ?? 0) + finalCount);
        }

        await DatabaseManager.aliceDb.collections.channelData.update(
            { timestamp: (newDailyTime - 86400) * 1000 },
            { $set: { channels: channelData.map((value, key) => [ key, value ]) } },
            { upsert: true }
        );
    }

    /**
     * Gets the amount of messages sent by users in a channel within the specified period of time.
     * 
     * IMPORTANT: The bot will start searching from the most recent message instead of
     * from the specified time, therefore this operation is quite expensive. Make sure that
     * you don't specify the time limit to be too far unless you really need it.
     * 
     * @param channel The channel.
     * @param fetchStartTime The time at which user messages will start being counted, in milliseconds.
     * @param fetchEndTime The time at which user messages will stop being counted, in milliseconds.
     * @returns The amount of messages sent by users in the channel.
     */
    static async getUserMessagesCount(channel: TextChannel | ThreadChannel, fetchStartTime: number, fetchEndTime: number): Promise<number> {
        const fetchCount: number = 100;
        let validCount: number = 0;

        const messageManager: MessageManager = channel.messages;

        const lastMessage: Message|undefined = (await messageManager.fetch({ limit: 1 })).first();

        let lastMessageID: Snowflake|undefined = lastMessage?.id;

        if (!lastMessageID) {
            return validCount;
        }

        let messages: Collection<string, Message> = await messageManager.fetch({ limit: fetchCount, before: lastMessageID });

        while (true) {
            let isOverTimeLimit: boolean = false;

            for (const message of messages.values()) {
                if (message.createdTimestamp > fetchEndTime) {
                    continue;
                }

                if (message.createdTimestamp < fetchStartTime) {
                    isOverTimeLimit = true;
                    break;
                }

                if (message.author.bot) {
                    validCount -= 2;
                } else {
                    ++validCount;
                }
            }

            lastMessageID = messages.last()?.id;

            if (!lastMessageID || isOverTimeLimit) {
                break;
            }

            messages = await messageManager.fetch({ limit: fetchCount, before: lastMessageID });

            await HelperFunctions.sleep(0.5);
        }

        return Math.max(0, validCount);
    }
}