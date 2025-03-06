import { DatabaseIndefiniteTimeout } from "@structures/database/aliceDb/DatabaseIndefiniteTimeout";
import { DatabaseCollectionManager } from "../DatabaseCollectionManager";
import { IndefiniteTimeout } from "@database/utils/aliceDb/IndefiniteTimeout";
import { Snowflake } from "discord.js";
import { CacheManager } from "@utils/managers/CacheManager";
import { OperationResult } from "@structures/core/OperationResult";

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
     * Adds a user to the indefinite timeout collection.
     *
     * @param id The ID of the user.
     * @returns The operation result.
     */
    addUser(id: Snowflake): Promise<OperationResult> {
        CacheManager.indefiniteTimeouts.add(id);

        return this.insert({ id });
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

    /**
     * Removes a user from the indefinite timeout collection.
     *
     * @param id The ID of the user.
     * @returns The operation result.
     */
    removeUser(id: Snowflake): Promise<OperationResult> {
        CacheManager.indefiniteTimeouts.delete(id);

        return this.deleteOne({ id });
    }
}
