import { ObjectId } from "mongodb";

export interface BaseDocument {
    /**
     * The BSON object ID of this document in the database.
     */
    readonly _id?: ObjectId;
}
