import { DatabaseRecentPlay } from "@structures/database/aliceDb/DatabaseRecentPlay";
import { DatabaseCollectionManager } from "../DatabaseCollectionManager";
import { RecentPlay } from "@database/utils/aliceDb/RecentPlay";
import { FindOptions } from "mongodb";
import { Collection } from "discord.js";

/**
 * A manager for the `recentplays` collection.
 */
export class RecentPlaysCollectionManager extends DatabaseCollectionManager<
    DatabaseRecentPlay,
    RecentPlay
> {
    protected override utilityInstance: new (
        data: DatabaseRecentPlay,
    ) => RecentPlay = RecentPlay;

    override get defaultDocument(): DatabaseRecentPlay {
        return {
            accuracy: {
                n300: 0,
                n100: 0,
                n50: 0,
                nmiss: 0,
            },
            title: "",
            combo: 0,
            date: new Date(),
            hash: "",
            mods: [],
            rank: "X",
            score: 0,
            uid: 0,
        };
    }

    /**
     * Gets the recent plays of a player from its uid.
     *
     * @param uid The uid of the player.
     * @param options Options for the retrieval.
     * @param limit The limit of recent plays. Defaults to 50.
     * @returns The recent plays of the player.
     */
    async getFromUid(
        uid: number,
        options?: FindOptions,
        limit = 50,
    ): Promise<RecentPlay[]> {
        const recentPlays: DatabaseRecentPlay[] = await this.collection
            .find({ uid: uid }, this.processFindOptions(options))
            .sort({ date: -1 })
            .limit(limit)
            .toArray();

        return recentPlays.map((v) => new RecentPlay(v));
    }

    /**
     * Gets recent scores from players on a specific beatmap.
     *
     * @param hash The MD5 hash of the beatmap.
     * @param uids The uid of players to retrieve from.
     * @param dateLimit The date limit of the scores. Only scores newer than or set at this date will be retrieved.
     * @returns The scores.
     */
    async getRecentScoresFromPlayers(
        hash: string,
        uids: number[],
        dateLimit: Date,
    ): Promise<Collection<number, RecentPlay>> {
        const recentPlays: DatabaseRecentPlay[] = await this.collection
            .find({
                hash: hash,
                date: { $gte: dateLimit },
                uid: {
                    $in: uids,
                },
            })
            .sort({ date: -1 })
            .toArray();

        const collection: Collection<number, RecentPlay> = new Collection();

        for (const play of recentPlays) {
            if (
                !collection.has(play.uid) ||
                collection.get(play.uid)!.date.getTime() <= play.date.getTime()
            ) {
                collection.set(play.uid, new RecentPlay(play));
            }
        }

        return collection;
    }

    protected override processFindOptions(
        options?: FindOptions | undefined,
    ): FindOptions | undefined {
        if (options?.projection) {
            options.projection.hash = 1;
        }

        return super.processFindOptions(options);
    }
}
