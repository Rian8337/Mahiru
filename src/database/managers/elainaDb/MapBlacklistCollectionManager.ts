import { MapBlacklist } from "@alice-database/utils/elainaDb/MapBlacklist";
import { DatabaseMapBlacklist } from "@alice-interfaces/database/elainaDb/DatabaseMapBlacklist";
import { DatabaseCollectionManager } from "../DatabaseCollectionManager";

/**
 * A manager for the `mapblacklist` collection.
 */
export class MapBlacklistCollectionManager extends DatabaseCollectionManager<
    DatabaseMapBlacklist,
    MapBlacklist
> {
    protected override readonly utilityInstance: new (
        data: DatabaseMapBlacklist
    ) => MapBlacklist = MapBlacklist;

    override get defaultDocument(): DatabaseMapBlacklist {
        return {
            beatmapID: 0,
            reason: "",
        };
    }
}
