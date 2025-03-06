import { DatabaseManager } from "@database/DatabaseManager";
import { DatabaseIndefiniteTimeout } from "@structures/database/aliceDb/DatabaseIndefiniteTimeout";
import { Manager } from "@utils/base/Manager";
import { Snowflake } from "discord.js";
import { ObjectId } from "mongodb";

export class IndefiniteTimeout
    extends Manager
    implements DatabaseIndefiniteTimeout
{
    readonly id: Snowflake;
    readonly _id?: ObjectId;

    constructor(
        data: DatabaseIndefiniteTimeout = DatabaseManager.aliceDb?.collections
            .indefiniteTimeout.defaultDocument ?? {}
    ) {
        super();

        this._id = data._id;
        this.id = data.id;
    }
}
