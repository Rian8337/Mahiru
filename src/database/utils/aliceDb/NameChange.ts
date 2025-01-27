import { DatabaseManager } from "@database/DatabaseManager";
import { DatabaseNameChange } from "structures/database/aliceDb/DatabaseNameChange";
import { Manager } from "@utils/base/Manager";
import { ObjectId } from "bson";

/**
 * Represents an osu!droid name change request.
 */
export class NameChange extends Manager implements DatabaseNameChange {
    uid: number;
    cooldown: number;
    previous_usernames: string[];
    readonly _id?: ObjectId;

    constructor(
        data: DatabaseNameChange = DatabaseManager.aliceDb?.collections
            .nameChange.defaultDocument ?? {},
    ) {
        super();

        this._id = data._id;
        this.uid = data.uid;
        this.cooldown = data.cooldown;
        this.previous_usernames = data.previous_usernames ?? [];
    }
}
