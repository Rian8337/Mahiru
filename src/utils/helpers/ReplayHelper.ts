import { Config } from "@core/Config";
import { OfficialDatabaseScore } from "@database/official/schema/OfficialDatabaseScore";
import { RecentPlay } from "@database/utils/aliceDb/RecentPlay";
import { ReplayAnalyzer } from "@rian8337/osu-droid-replay-analyzer";
import { Score } from "@rian8337/osu-droid-utilities";
import { readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

/**
 * A helper class for osu!droid replays.
 */
export abstract class ReplayHelper {
    /**
     * The path to the replay folder.
     */
    static readonly folderPath = join(
        homedir(),
        "..",
        "..",
        "DroidData",
        "osudroid",
        "zip",
        "upload"
    );

    /**
     * Retrievs the replay file of a score.
     *
     * @param scoreId The ID of the score.
     * @returns The replay file.
     */
    static async retrieveFile(scoreId: number): Promise<Buffer | null> {
        if (Config.isDebug) {
            return null;
        }

        try {
            return await readFile(
                join(this.folderPath, `${scoreId.toString()}.odr`)
            );
        } catch {
            return null;
        }
    }

    /**
     * Performs an analysis method to the replay analyzer or a score.
     *
     * @param input The replay analyzer or score.
     * @returns The analyzed replay.
     */
    static async analyzeReplay(
        input:
            | Pick<OfficialDatabaseScore, "id">
            | ReplayAnalyzer
            | Score
            | RecentPlay
    ): Promise<ReplayAnalyzer> {
        if (input instanceof RecentPlay && !input.scoreId) {
            return new ReplayAnalyzer();
        }

        let analyzer: ReplayAnalyzer;

        if (input instanceof ReplayAnalyzer) {
            analyzer = input;
        } else if (input instanceof RecentPlay) {
            analyzer = new ReplayAnalyzer({
                scoreID: input.scoreId!,
            });
        } else {
            analyzer = new ReplayAnalyzer({
                scoreID: input.id,
            });
        }

        if (!Config.isDebug) {
            analyzer.originalODR ??= await this.retrieveFile(
                input instanceof ReplayAnalyzer
                    ? input.scoreID!
                    : input instanceof RecentPlay
                      ? input.scoreId!
                      : input.id
            );
        }

        if (!analyzer.data) {
            await analyzer.analyze();
        }

        return analyzer;
    }
}
