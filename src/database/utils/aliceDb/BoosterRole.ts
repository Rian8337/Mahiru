import { DatabaseManager } from "@database/DatabaseManager";
import { DatabaseBoosterRole } from "@structures/database/aliceDb/DatabaseBoosterRole";
import { Manager } from "@utils/base/Manager";
import { ObjectId } from "mongodb";

/**
 * Represents a booster role in the database.
 */
export class BoosterRole extends Manager implements DatabaseBoosterRole {
    readonly discordId: string;
    readonly roleId: string;
    readonly _id?: ObjectId;

    constructor(
        data: DatabaseBoosterRole = DatabaseManager.aliceDb?.collections
            .boosterRole.defaultDocument,
    ) {
        super();

        this.discordId = data.discordId;
        this.roleId = data.roleId;
        this._id = data._id;
    }
}
