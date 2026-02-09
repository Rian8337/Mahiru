import { DatabaseManager } from "@database/DatabaseManager";
import { DatabaseAskCount } from "structures/database/aliceDb/DatabaseAskCount";
import { OperationResult } from "structures/core/OperationResult";
import { Manager } from "@utils/base/Manager";
import { ObjectId } from "mongodb";
import { Snowflake } from "discord.js";

/**
 * Represents an information about how many times a user has asked the bot via 8ball.
 */
export class AskCount extends Manager implements DatabaseAskCount {
    discordid: Snowflake;
    count: number;
    readonly _id?: ObjectId;

    constructor(
        data: DatabaseAskCount = DatabaseManager.aliceDb?.collections.askCount
            .defaultDocument ?? {},
    ) {
        super();

        this._id = data._id;
        this.discordid = data.discordid;
        this.count = data.count;
    }

    /**
     * Increase the amount of times this user has asked the bot.
     *
     * @param value The value to increase.
     * @returns An object containing information about the operation.
     */
    increaseValue(value: number): Promise<OperationResult> {
        this.count += value;

        return DatabaseManager.aliceDb.collections.askCount.updateOne(
            { discordid: this.discordid },
            { $inc: { count: value } },
        );
    }

    /**
     * Sets the amount of times this user has asked the bot.
     *
     * @param value The value to increase.
     * @returns An object containing information about the operation.
     */
    setValue(value: number): Promise<OperationResult> {
        this.count = value;

        return DatabaseManager.aliceDb.collections.askCount.updateOne(
            { discordid: this.discordid },
            { $set: { count: value } },
        );
    }
}
