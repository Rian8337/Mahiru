import { DatabaseManager } from "@database/DatabaseManager";
import { DatabaseProfileBackground } from "structures/database/aliceDb/DatabaseProfileBackground";
import { Manager } from "@utils/base/Manager";
import { ObjectId } from "mongodb";

/**
 * Represents a profile background that is applicable to profile commands.
 */
export class ProfileBackground
    extends Manager
    implements DatabaseProfileBackground
{
    readonly _id?: ObjectId;
    id: string;
    name: string;

    constructor(
        data: DatabaseProfileBackground = DatabaseManager.aliceDb?.collections
            .profileBackgrounds.defaultDocument ?? {},
    ) {
        super();

        this._id = data._id;
        this.id = data.id;
        this.name = data.name;
    }
}
