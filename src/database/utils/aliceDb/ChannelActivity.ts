import { DatabaseManager } from "@database/DatabaseManager";
import { DatabaseChannelActivity } from "@structures/database/aliceDb/DatabaseChannelActivity";
import { ChannelActivityData } from "@structures/utils/ChannelActivityData";
import { Manager } from "@utils/base/Manager";
import { ArrayHelper } from "@utils/helpers/ArrayHelper";
import { ObjectId } from "mongodb";
import { Collection, Snowflake } from "discord.js";

/**
 * Represents channels' activity in a day.
 */
export class ChannelActivity extends Manager {
    /**
     * The epoch time of the data, in milliseconds.
     *
     * Since channels' activity are stored in a per day basis, this timestamp
     * will always be at 00:00 UTC of a day.
     */
    timestamp: number;

    /**
     * The activity data of channels within the timestamp, mapped by channel ID.
     */
    channels: Collection<Snowflake, ChannelActivityData>;

    readonly _id?: ObjectId;

    constructor(
        data: DatabaseChannelActivity = DatabaseManager.aliceDb?.collections
            .channelActivity.defaultDocument ?? {},
    ) {
        super();

        this._id = data._id;
        this.timestamp = data.timestamp;
        this.channels = ArrayHelper.arrayToCollection(
            data.channels,
            "channelId",
        );
    }
}
