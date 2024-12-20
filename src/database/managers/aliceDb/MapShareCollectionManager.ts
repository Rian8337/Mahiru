import { DatabaseCollectionManager } from "@database/managers/DatabaseCollectionManager";
import { MapShare } from "@database/utils/aliceDb/MapShare";
import { DatabaseMapShare } from "structures/database/aliceDb/DatabaseMapShare";
import { MapShareSubmissionStatus } from "structures/utils/MapShareSubmissionStatus";
import { Collection as DiscordCollection } from "discord.js";

/**
 * A manager for the `mapshare` collection.
 */
export class MapShareCollectionManager extends DatabaseCollectionManager<
    DatabaseMapShare,
    MapShare
> {
    protected override readonly utilityInstance: new (
        data: DatabaseMapShare,
    ) => MapShare = MapShare;

    override get defaultDocument(): DatabaseMapShare {
        return {
            beatmap_id: 0,
            date: Math.floor(Date.now() / 1000),
            hash: "",
            id: "",
            status: "pending",
            submitter: "",
            summary: "",
        };
    }

    /**
     * Gets map share submissions that have the specified status.
     *
     * @param status The status.
     * @returns The map share submissions, mapped by beatmap ID.
     */
    getByStatus(
        status: MapShareSubmissionStatus,
    ): Promise<DiscordCollection<number, MapShare>> {
        return this.get("beatmap_id", { status: status });
    }

    /**
     * Gets a map share submission from its beatmap ID.
     *
     * @param id The beatmap ID that is used in the submission.
     * @returns The submission, `null` if not found.
     */
    getByBeatmapId(id: number): Promise<MapShare | null> {
        return this.getOne({ beatmap_id: id });
    }
}
