import { DatabaseIndefiniteTimeout } from "@structures/database/aliceDb/DatabaseIndefiniteTimeout";
import { DatabaseCollectionManager } from "../DatabaseCollectionManager";
import { IndefiniteTimeout } from "@database/utils/aliceDb/IndefiniteTimeout";
import { Snowflake } from "discord.js";

/**
 * A manager for the `indefinitetimeout` collection.
 */
export class IndefiniteTimeoutCollectionManager extends DatabaseCollectionManager<
    DatabaseIndefiniteTimeout,
    IndefiniteTimeout
> {
    protected override readonly utilityInstance: new (
        data: DatabaseIndefiniteTimeout
    ) => IndefiniteTimeout = IndefiniteTimeout;

    override get defaultDocument(): DatabaseIndefiniteTimeout {
        return {
            id: "",
        };
    }

    /**
     * Gets a user's indefinite timeout by their ID.
     *
     * @param id The ID of the user.
     * @returns The user's indefinite timeout, `null` if not found.
     */
    getFromUser(id: Snowflake): Promise<IndefiniteTimeout | null> {
        return this.getOne({ id });
    }
}
