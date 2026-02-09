import { PrototypePP } from "@database/utils/aliceDb/PrototypePP";
import { DatabasePrototypePP } from "structures/database/aliceDb/DatabasePrototypePP";
import { DatabaseCollectionManager } from "../DatabaseCollectionManager";
import {
    ApplicationCommandOptionChoiceData,
    Collection as DiscordCollection,
} from "discord.js";
import { ArrayHelper } from "@utils/helpers/ArrayHelper";
import { OperationResult } from "@structures/core/OperationResult";

/**
 * A manager for the `prototypepp` collection.
 */
export class PrototypePPCollectionManager extends DatabaseCollectionManager<
    DatabasePrototypePP,
    PrototypePP
> {
    protected override readonly utilityInstance: new (
        data: DatabasePrototypePP,
    ) => PrototypePP = PrototypePP;

    override get defaultDocument(): DatabasePrototypePP {
        return {
            lastUpdate: Date.now(),
            pp: [],
            localPPTotal: 0,
            livePPTotal: 0,
            reworkType: "overall",
            uid: 0,
            username: "",
            scanDone: false,
        };
    }

    /**
     * Gets the prototype droid performance points (dpp) information of an osu!droid account from its uid.
     *
     * @param uid The uid of the osu!droid account.
     * @param reworkType The rework type.
     */
    getFromUid(uid: number, reworkType: string): Promise<PrototypePP | null> {
        return this.getOne({ uid: uid, reworkType: reworkType });
    }

    /**
     * Gets the prototype droid performance points (dpp) information of an osu!droid account from its username.
     *
     * @param username The username of the osu!droid account.
     * @param reworkType The rework type.
     */
    getFromUsername(
        username: string,
        reworkType: string,
    ): Promise<PrototypePP | null> {
        return this.getOne({ username: username, reworkType: reworkType });
    }

    /**
     * Gets the dpp rank of a specified dpp value.
     *
     * @param totalPP The total PP.
     * @param reworkType The rework type.
     */
    async getUserDPPRank(totalPP: number, reworkType: string): Promise<number> {
        return (
            (await this.collection.countDocuments({
                localPPTotal: { $gt: totalPP },
                reworkType: reworkType,
            })) + 1
        );
    }

    /**
     * Gets the DPP leaderboard of a rework.
     *
     * @param reworkType The rework type.
     * @returns The leaderboard, mapped by the player's Discord ID.
     */
    async getLeaderboard(
        reworkType: string,
    ): Promise<DiscordCollection<number, PrototypePP>> {
        const prototypeEntries = await this.collection
            .find(
                { reworkType: reworkType },
                {
                    projection: {
                        _id: 0,
                        discordid: 1,
                        uid: 1,
                        pptotal: 1,
                        playc: 1,
                        username: 1,
                    },
                },
            )
            .sort({ pptotal: -1 })
            .toArray();

        return ArrayHelper.arrayToCollection(
            prototypeEntries.map((v) => new PrototypePP(v)),
            "uid",
        );
    }

    /**
     * Clones the rework from "overall" to a new rework type.
     *
     * @param reworkType The rework type to clone to.
     */
    async cloneOverallToRework(reworkType: string): Promise<OperationResult> {
        const overallEntries = await this.collection
            .find(
                { reworkType: "overall" },
                {
                    projection: {
                        _id: 0,
                        discordid: 1,
                        uid: 1,
                        previous_bind: 1,
                        username: 1,
                    },
                },
            )
            .toArray();

        for (const entry of overallEntries) {
            entry.reworkType = reworkType;
        }

        return this.insert(...overallEntries);
    }

    /**
     * Gets unscanned players based on the given amount.
     *
     * The data returned will only consist of `uid` and `pptotal`. You should
     * then retrieve player data from bind database to perform recalculation.
     *
     * @param amount The amount of unscanned players to retrieve.
     * @param reworkType The rework type to filter the players.
     * @returns The players.
     */
    async getUnscannedPlayers(
        amount: number,
        reworkType: string,
    ): Promise<DiscordCollection<number, PrototypePP>> {
        const prototypeEntries = await this.collection
            .find(
                { scanDone: { $ne: true }, reworkType: reworkType },
                { projection: { _id: 0, uid: 1, pptotal: 1 } },
            )
            .sort({ pptotal: -1 })
            .limit(amount)
            .toArray();

        return ArrayHelper.arrayToCollection(
            prototypeEntries.map((v) => new PrototypePP(v)),
            "uid",
        );
    }

    /**
     * Searches players based on username for autocomplete response.
     *
     * @param searchQuery The username to search.
     * @param amount The maximum amount of usernames to return. Defaults to 25.
     * @returns The usernames that match the query.
     */
    async searchPlayersForAutocomplete(
        searchQuery: string | RegExp,
        amount: number = 25,
    ): Promise<ApplicationCommandOptionChoiceData<string>[]> {
        const result = await this.collection
            .aggregate()
            .group({
                _id: { username: "$username" },
                dups: { $addToSet: "$username" },
                count: { $sum: 1 },
            })
            .match({
                dups: new RegExp(searchQuery, "i"),
                count: { $gt: 1 },
            })
            .limit(amount)
            .project<{ dups: string }>({ _id: 0, dups: 1 })
            .unwind({ path: "$dups" })
            .toArray();

        return result.map((v) => {
            return {
                name: v.dups,
                value: v.dups,
            };
        });
    }
}
