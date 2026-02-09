import { Voting } from "@database/utils/aliceDb/Voting";
import { DatabaseVoting } from "structures/database/aliceDb/DatabaseVoting";
import { DatabaseCollectionManager } from "../DatabaseCollectionManager";
import { Snowflake } from "discord.js";
import { FindOptions } from "mongodb";

/**
 * A manager for the `voting` collection.
 */
export class VotingCollectionManager extends DatabaseCollectionManager<
    DatabaseVoting,
    Voting
> {
    protected override readonly utilityInstance: new (
        data: DatabaseVoting,
    ) => Voting = Voting;

    override get defaultDocument(): DatabaseVoting {
        return {
            channel: "",
            choices: [],
            initiator: "",
            topic: "",
        };
    }

    /**
     * Gets a current ongoing vote in a channel.
     *
     * @param channelId The ID of the channel.
     * @param options Options for the retrieval of the vote.
     */
    getCurrentVoteInChannel(
        channelId: Snowflake,
        options?: FindOptions,
    ): Promise<Voting | null> {
        return this.getOne({ channel: channelId }, options);
    }

    protected override processFindOptions(
        options?: FindOptions,
    ): FindOptions | undefined {
        if (options?.projection) {
            options.projection.channel = 1;
        }

        return super.processFindOptions(options);
    }
}
