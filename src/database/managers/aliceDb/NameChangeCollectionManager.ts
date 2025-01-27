import { NameChange } from "@database/utils/aliceDb/NameChange";
import { DatabaseNameChange } from "structures/database/aliceDb/DatabaseNameChange";
import { DatabaseCollectionManager } from "../DatabaseCollectionManager";
import { OperationResult } from "structures/core/OperationResult";
import { FindOptions } from "mongodb";

/**
 * A manager for the `namechange` collection.
 */
export class NameChangeCollectionManager extends DatabaseCollectionManager<
    DatabaseNameChange,
    NameChange
> {
    protected override readonly utilityInstance: new (
        data: DatabaseNameChange,
    ) => NameChange = NameChange;

    override get defaultDocument(): DatabaseNameChange {
        return {
            cooldown: Math.floor(Date.now() / 1000),
            previous_usernames: [],
            uid: 0,
        };
    }

    /**
     * Gets name change information from a uid.
     *
     * @param uid The uid.
     * @param options Options for the retrieval of the name change information.
     */
    getFromUid(
        uid: number,
        options?: FindOptions<DatabaseNameChange>,
    ): Promise<NameChange | null> {
        return this.getOne({ uid: uid }, options);
    }

    /**
     * Adds a previous username of a player as their username history.
     *
     * @param uid The uid of the player.
     * @param username The username to add.
     * @param newCooldown The new cooldown time in milliseconds.
     * @returns An object containing information about the operation.
     */
    addPreviousUsername(
        uid: number,
        username: string,
        newCooldown: number,
    ): Promise<OperationResult> {
        return this.updateOne(
            { uid: uid },
            {
                $push: { previous_usernames: username },
                $set: { cooldown: Math.floor(newCooldown / 1000) },
            },
            { upsert: true },
        );
    }
}
