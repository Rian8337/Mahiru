import { NameChange } from "@database/utils/aliceDb/NameChange";
import { DatabaseNameChange } from "structures/database/aliceDb/DatabaseNameChange";
import { DatabaseCollectionManager } from "../DatabaseCollectionManager";
import { Snowflake, User } from "discord.js";
import { OperationResult } from "structures/core/OperationResult";

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
            discordid: "",
            previous_usernames: [],
            uid: 0,
        };
    }

    /**
     * Gets name change request from a uid.
     *
     * @param uid The uid.
     */
    getFromUid(uid: number): Promise<NameChange | null> {
        return this.getOne({ uid: uid });
    }

    /**
     * Gets name change request of a Discord user.
     *
     * @param user The user.
     */
    getFromUser(user: User): Promise<NameChange | null>;

    /**
     * Gets name change request of a Discord user.
     *
     * @param userId The ID of the user.
     */
    getFromUser(userId: Snowflake): Promise<NameChange | null>;

    getFromUser(userOrId: User | Snowflake): Promise<NameChange | null> {
        return this.getOne({
            discordid: userOrId instanceof User ? userOrId.id : userOrId,
        });
    }

    /**
     * Adds a previous username of a player as their username history.
     *
     * @param uid The uid of the player.
     * @param username The username to add.
     * @returns An object containing information about the operation.
     */
    addPreviousUsername(
        discordId: Snowflake,
        uid: number,
        username: string,
        newCooldown: number,
    ): Promise<OperationResult> {
        return this.updateOne(
            { uid: uid },
            {
                $push: { previous_usernames: username },
                $set: {
                    cooldown: Math.floor(newCooldown / 1000),
                },
                $setOnInsert: {
                    discordid: discordId,
                },
            },
            { upsert: true },
        );
    }
}
