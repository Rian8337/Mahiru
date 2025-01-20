import { DatabaseManager } from "@database/DatabaseManager";
import { DatabasePrototypePP } from "structures/database/aliceDb/DatabasePrototypePP";
import { PrototypePPEntry } from "@structures/pp/PrototypePPEntry";
import { Manager } from "@utils/base/Manager";
import { ArrayHelper } from "@utils/helpers/ArrayHelper";
import { ObjectId } from "bson";
import { Collection } from "discord.js";

/**
 * Represents the prototype performance points information of an osu!droid account.
 */
export class PrototypePP extends Manager {
    /**
     * The epoch time at which the account is last
     * recalculated, in milliseconds.
     */
    lastUpdate: number;

    /**
     * The prototype performance points entries of the account, mapped by their hash.
     */
    pp: Collection<string, PrototypePPEntry>;

    /**
     * The total performance points of the account after recalculation.
     */
    pptotal: number;

    /**
     * The total droid performance points of the account before recalculation.
     */
    prevpptotal: number;

    /**
     * The UID of the account.
     */
    uid: number;

    /**
     * The username of the account.
     */
    username: string;

    /**
     * Whether this prototype entry has been calculated against the latest changes.
     */
    scanDone: boolean;

    /**
     * The rework type of the prototype.
     */
    reworkType: string;

    /**
     * The BSON object ID of this document in the database.
     */
    readonly _id?: ObjectId;

    constructor(
        data: DatabasePrototypePP = DatabaseManager.aliceDb?.collections
            .prototypePP.defaultDocument ?? {},
    ) {
        super();

        this._id = data._id;
        this.lastUpdate = data.lastUpdate;
        this.pp = ArrayHelper.arrayToCollection(data.pp ?? [], "hash");
        this.pptotal = data.pptotal;
        this.prevpptotal = data.prevpptotal;
        this.uid = data.uid;
        this.username = data.username;
        this.scanDone = data.scanDone;
        this.reworkType = data.reworkType;
    }
}
