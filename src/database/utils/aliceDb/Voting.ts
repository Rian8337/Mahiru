import { DatabaseManager } from "@database/DatabaseManager";
import { VoteChoice } from "structures/interactions/commands/Tools/VoteChoice";
import { DatabaseVoting } from "structures/database/aliceDb/DatabaseVoting";
import { OperationResult } from "structures/core/OperationResult";
import { Manager } from "@utils/base/Manager";
import { ObjectId } from "mongodb";
import { Snowflake } from "discord.js";

/**
 * Represents a voting entry.
 */
export class Voting extends Manager implements DatabaseVoting {
    initiator: Snowflake;
    xpReq?: number;
    topic: string;
    channel: Snowflake;
    choices: VoteChoice[];
    readonly _id?: ObjectId;

    constructor(
        data: DatabaseVoting = DatabaseManager.aliceDb?.collections.voting
            .defaultDocument ?? {},
    ) {
        super();

        this._id = data._id;
        this.initiator = data.initiator;
        this.xpReq = data.xpReq;
        this.topic = data.topic;
        this.channel = data.channel;
        this.choices = data.choices ?? [];
    }

    /**
     * Ends this vote.
     *
     * @returns An object containing information about the operation.
     */
    async end(): Promise<OperationResult> {
        return DatabaseManager.aliceDb.collections.voting.deleteOne({
            channel: this.channel,
        });
    }
}
