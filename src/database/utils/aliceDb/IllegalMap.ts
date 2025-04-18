import { DatabaseManager } from "@database/DatabaseManager";
import { OperationResult } from "structures/core/OperationResult";
import { DatabaseIllegalMap } from "structures/database/aliceDb/DatabaseIllegalMap";
import { Manager } from "@utils/base/Manager";
import { DroidAPIRequestBuilder } from "@rian8337/osu-base";
import { Score } from "@rian8337/osu-droid-utilities";
import { ObjectId } from "mongodb";
import { DroidHelper } from "@utils/helpers/DroidHelper";

/**
 * Represents a beatmap that is considered illegal.
 */
export class IllegalMap extends Manager implements DatabaseIllegalMap {
    hash: string;
    readonly _id?: ObjectId;
    deleteDone?: boolean;

    constructor(
        data: DatabaseIllegalMap = DatabaseManager.aliceDb?.collections
            .illegalMap.defaultDocument ?? {},
    ) {
        super();

        this._id = data._id;
        this.hash = data.hash;
        this.deleteDone = data.deleteDone;
    }

    /**
     * Scans for scores in this beatmap and deletes them if available.
     */
    async scanAndDelete(): Promise<OperationResult> {
        let scores: Score[];

        while (
            (scores = await DroidHelper.getBeatmapLeaderboard(this.hash))
                .length > 0
        ) {
            for (const score of scores) {
                await new DroidAPIRequestBuilder()
                    .setEndpoint("single_score_wipe.php")
                    .addParameter("scoreid", score.id)
                    .sendRequest();
            }
        }

        return DatabaseManager.aliceDb.collections.illegalMap.updateOne(
            { hash: this.hash },
            {
                $set: {
                    deleteDone: true,
                },
            },
        );
    }
}
