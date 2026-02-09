import { DatabaseManager } from "@database/DatabaseManager";
import { DatabaseEmojiStatistics } from "structures/database/aliceDb/DatabaseEmojiStatistics";
import { Manager } from "@utils/base/Manager";
import { ObjectId } from "mongodb";

/**
 * Represents a guild's emoji statistics.
 */
export class EmojiStatistics
    extends Manager
    implements DatabaseEmojiStatistics
{
    readonly guildId: string;
    readonly emojiId: string;
    count: number;
    readonly _id?: ObjectId;

    constructor(
        data: DatabaseEmojiStatistics = DatabaseManager.aliceDb?.collections
            .emojiStatistics.defaultDocument ?? {},
    ) {
        super();

        this._id = data._id;
        this.guildId = data.guildId;
        this.emojiId = data.emojiId;
        this.count = data.count;
    }
}
