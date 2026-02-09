import { DatabaseManager } from "@database/DatabaseManager";
import { DatabaseTrackedPlayer } from "structures/database/elainaDb/DatabaseTrackedPlayer";
import { Manager } from "@utils/base/Manager";
import { ObjectId } from "mongodb";

/**
 * Represents an information about a player who's being tracked for recent plays.
 */
export class TrackedPlayer extends Manager implements DatabaseTrackedPlayer {
    uid: number;
    readonly _id?: ObjectId;

    constructor(
        data: DatabaseTrackedPlayer = DatabaseManager.elainaDb?.collections
            .playerTracking.defaultDocument ?? {},
    ) {
        super();

        this._id = data._id;
        this.uid = data.uid;
    }
}
