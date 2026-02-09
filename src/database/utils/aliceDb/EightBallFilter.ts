import { DatabaseManager } from "@database/DatabaseManager";
import { DatabaseEightBallFilter } from "structures/database/aliceDb/DatabaseEightBallFilter";
import { Manager } from "@utils/base/Manager";
import { ObjectId } from "mongodb";

/**
 * Represents a filter for 8ball responses.
 */
export class EightBallFilter
    extends Manager
    implements DatabaseEightBallFilter
{
    name: string;
    like: string[];
    hate: string[];
    badwords: string[];
    response: string[];
    readonly _id?: ObjectId;

    constructor(
        data: DatabaseEightBallFilter = DatabaseManager.aliceDb?.collections
            .eightBallFilter.defaultDocument ?? {},
    ) {
        super();

        this._id = data._id;
        this.name = data.name;
        this.like = data.like ?? [];
        this.hate = data.hate ?? [];
        this.badwords = data.badwords ?? [];
        this.response = data.response ?? [];
    }
}
