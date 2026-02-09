import { AnniversaryTriviaPlayer } from "@database/utils/aliceDb/AnniversaryTriviaPlayer";
import { DatabaseAnniversaryTriviaPlayer } from "@structures/database/aliceDb/DatabaseAnniversaryTriviaPlayer";
import { DatabaseCollectionManager } from "../DatabaseCollectionManager";
import { Snowflake } from "discord.js";
import { FindOptions } from "mongodb";

/**
 * A manager for the `anniversarytriviaplayer` collection.
 */
export class AnniversaryTriviaPlayerCollectionManager extends DatabaseCollectionManager<
    DatabaseAnniversaryTriviaPlayer,
    AnniversaryTriviaPlayer
> {
    protected override utilityInstance: new (
        data: DatabaseAnniversaryTriviaPlayer,
    ) => AnniversaryTriviaPlayer = AnniversaryTriviaPlayer;

    override get defaultDocument(): DatabaseAnniversaryTriviaPlayer {
        return {
            discordId: "",
            pastAttempts: [],
            pastEventAttempts: [],
        };
    }

    /**
     * Gets a player's data from their Discord ID.
     *
     * @param discordId The Discord ID to search for.
     * @param options The options for the find operation.
     * @returns The player's data, `null` if not found.
     */
    getFromId(
        discordId: Snowflake,
        options?: FindOptions,
    ): Promise<AnniversaryTriviaPlayer | null> {
        return this.getOne({ discordId }, options);
    }
}
