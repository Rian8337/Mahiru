import { DatabaseManager } from "@database/DatabaseManager";
import { DatabaseDPPAPIKey } from "structures/database/aliceDb/DatabaseDPPAPIKey";
import { Manager } from "@utils/base/Manager";
import { ObjectId } from "mongodb";

/**
 * Represents a DPP API key.
 */
export class DPPAPIKey extends Manager implements DatabaseDPPAPIKey {
    key: string;
    owner: string;
    readonly _id?: ObjectId;

    constructor(
        data: DatabaseDPPAPIKey = DatabaseManager.aliceDb?.collections.dppAPIKey
            .defaultDocument ?? {},
    ) {
        super();

        this._id = data._id;
        this.key = data.key;
        this.owner = data.owner;
    }
}
