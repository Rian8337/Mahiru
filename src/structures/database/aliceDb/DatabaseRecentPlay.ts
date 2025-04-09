import { HitErrorInformation } from "@rian8337/osu-droid-replay-analyzer";
import {
    DroidDifficultyAttributes,
    OsuDifficultyAttributes,
} from "@rian8337/osu-difficulty-calculator";
import { CompleteCalculationAttributes } from "@structures/difficultyattributes/CompleteCalculationAttributes";
import { DroidPerformanceAttributes } from "@structures/difficultyattributes/DroidPerformanceAttributes";
import { OsuPerformanceAttributes } from "@structures/difficultyattributes/OsuPerformanceAttributes";
import { BaseDocument } from "../BaseDocument";
import { SliderTickInformation } from "@structures/pp/SliderTickInformation";
import { ScoreRank, SerializedMod } from "@rian8337/osu-base";

/**
 * Represents a recent play.
 */
export interface DatabaseRecentPlay extends BaseDocument {
    /**
     * The uid of the player who submitted ths play.
     */
    uid: number;

    /**
     * The title of the beatmap in this play.
     */
    title: string;

    /**
     * The maximum combo achieved in this play.
     */
    combo: number;

    /**
     * The score achieved in this play.
     */
    score: number;

    /**
     * The rank achieved in this play.
     */
    rank: ScoreRank;

    /**
     * The date of which this play was set.
     */
    date: Date;

    /**
     * The accuracy achieved in this play.
     */
    accuracy: {
        /**
         * The amount of 300s achieved.
         */
        n300: number;

        /**
         * The amount of 100s achieved.
         */
        n100: number;

        /**
         * The amount of 50s achieved.
         */
        n50: number;

        /**
         * The amount of misses achieved.
         */
        nmiss: number;
    };

    /**
     * Enabled modifications in this play.
     */
    mods: SerializedMod[];

    /**
     * The MD5 hash of the beatmap in this play.
     */
    hash: string;

    /**
     * Information about this play's hit error.
     */
    hitError?: HitErrorInformation;

    /**
     * Information about this play's slider tick collection.
     */
    sliderTickInformation?: SliderTickInformation;

    /**
     * Information about this play's slider end collection.
     */
    sliderEndInformation?: SliderTickInformation;

    /**
     * The osu!droid difficulty attributes of this play.
     */
    droidAttribs?: CompleteCalculationAttributes<
        DroidDifficultyAttributes,
        DroidPerformanceAttributes
    >;

    /**
     * The osu!standard difficulty attributes of this play.
     */
    osuAttribs?: CompleteCalculationAttributes<
        OsuDifficultyAttributes,
        OsuPerformanceAttributes
    >;

    /**
     * The ID of this play, if it was submitted to the game server.
     */
    scoreId?: number;
}
