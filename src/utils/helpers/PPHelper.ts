import { Symbols } from "@enums/utils/Symbols";
import { PPEntry } from "@structures/pp/PPEntry";
import { OnButtonPageChange } from "@structures/utils/OnButtonPageChange";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { Accuracy } from "@rian8337/osu-base";
import {
    CacheableDifficultyAttributes,
    DroidDifficultyAttributes,
    OsuDifficultyAttributes,
} from "@rian8337/osu-difficulty-calculator";
import {
    DroidDifficultyAttributes as RebalanceDroidDifficultyAttributes,
    OsuDifficultyAttributes as RebalanceOsuDifficultyAttributes,
} from "@rian8337/osu-rebalance-difficulty-calculator";
import { Player, Score } from "@rian8337/osu-droid-utilities";
import { Collection, RepliableInteraction, underscore } from "discord.js";
import { CommandHelper } from "./CommandHelper";
import { NumberHelper } from "./NumberHelper";
import { DroidPerformanceAttributes } from "@structures/difficultyattributes/DroidPerformanceAttributes";
import { OsuPerformanceAttributes } from "@structures/difficultyattributes/OsuPerformanceAttributes";
import { CompleteCalculationAttributes } from "@structures/difficultyattributes/CompleteCalculationAttributes";
import { ResponseDifficultyAttributes } from "@structures/difficultyattributes/ResponseDifficultyAttributes";
import { OfficialDatabaseScore } from "@database/official/schema/OfficialDatabaseScore";
import { DroidHelper } from "./DroidHelper";
import { OfficialDatabaseUser } from "@database/official/schema/OfficialDatabaseUser";

/**
 * A helper for performance points related things.
 */
export abstract class PPHelper {
    /**
     * The ID of the role that permits pp-related moderation actions.
     */
    static readonly ppModeratorRole = "551662194270404644";

    /**
     * Displays a PP list as a response to an interaction.
     *
     * @param interaction The interaction to respond to.
     * @param uidOrUsername The uid or username of the player.
     * @param page The initial page to display.
     */
    static async displayPPList(
        interaction: RepliableInteraction,
        player: Pick<OfficialDatabaseUser, "id" | "username" | "pp"> | Player,
        page: number,
    ): Promise<void> {
        const topScores = await DroidHelper.getTopScores(player.id);

        const embed = await EmbedCreator.createPPListEmbed(
            interaction,
            player,
            undefined,
            CommandHelper.getLocale(interaction),
        );

        const onPageChange: OnButtonPageChange = async (_, page) => {
            for (let i = 5 * (page - 1); i < 5 + 5 * (page - 1); ++i) {
                const score = topScores[i];

                if (score) {
                    embed.addFields({
                        name: `${i + 1}. ${score.title} ${score.completeModString}`,
                        value: `${score.combo}x | ${(score.accuracy.value() * 100).toFixed(2)}% | ${
                            score.miss
                        } ${Symbols.missIcon} | ${underscore(
                            `${(score.pp ?? 0).toFixed(2)} pp`,
                        )} (Net pp: ${(
                            (score.pp ?? 0) * Math.pow(0.95, i)
                        ).toFixed(2)} pp)`,
                    });
                } else {
                    embed.addFields({ name: `${i + 1}. -`, value: "-" });
                }
            }
        };

        MessageButtonCreator.createLimitedButtonBasedPaging(
            interaction,
            {
                embeds: [embed],
            },
            [interaction.user.id],
            Math.max(page, 1),
            Math.ceil(topScores.length / 5),
            120,
            onPageChange,
        );
    }

    /**
     * Checks whether a PP entry will be kept once it's entered to the list.
     *
     * @param dppList The list of dpp plays.
     * @param entry The entry to check.
     * @returns Whether the PP entry will be kept.
     */
    static checkScoreInsertion(
        dppList: Collection<string, PPEntry>,
        entry: PPEntry,
    ): boolean {
        if (dppList.size < 75) {
            return true;
        }

        if (
            dppList.has(entry.hash) &&
            dppList.get(entry.hash)!.pp >= entry.pp
        ) {
            return false;
        }

        return (dppList.last()?.pp ?? 0) < entry.pp;
    }

    /**
     * Converts a score to PP entry.
     *
     * @param beatmapTitle The title of the beatmap.
     * @param score The score to convert.
     * @param attributes The calculation attributes of the score.
     * @returns A PP entry from the score and calculation result.
     */
    static scoreToPPEntry(
        beatmapTitle: string,
        score: Pick<OfficialDatabaseScore, "uid" | "hash"> | Score,
        attributes: CompleteCalculationAttributes<
            DroidDifficultyAttributes,
            DroidPerformanceAttributes
        >,
    ): PPEntry {
        const { params, difficulty, performance } = attributes;
        const accuracy = new Accuracy(params.accuracy);

        return {
            uid: score.uid,
            hash: score.hash,
            title: beatmapTitle,
            pp: NumberHelper.round(performance.total, 2),
            mods: difficulty.mods,
            accuracy: NumberHelper.round(accuracy.value() * 100, 2),
            combo: params.combo,
            miss: accuracy.nmiss,
            speedMultiplier:
                params.customSpeedMultiplier !== 1
                    ? params.customSpeedMultiplier
                    : undefined,
        };
    }

    /**
     * Calculates the weighted accuracy of a dpp list.
     *
     * @param dppList The list.
     * @returns The weighted accuracy of the list.
     */
    static calculateWeightedAccuracy(
        dppList: Collection<string, PPEntry>,
    ): number {
        if (dppList.size === 0) {
            return 0;
        }

        let accSum: number = 0;
        let weight: number = 0;
        let i: number = 0;

        for (const pp of dppList.values()) {
            accSum += pp.accuracy * Math.pow(0.95, i);
            weight += Math.pow(0.95, i);
            ++i;
        }

        return accSum / weight;
    }

    /**
     * Calculates the final performance points from a list of scores.
     *
     * @param scores The scores.
     * @returns The final performance points.
     */
    static calculateFinalPerformancePoints<T extends { pp: number | null }>(
        scores: T[],
    ): number {
        return scores
            .sort((a, b) => (b.pp ?? 0) - (a.pp ?? 0))
            .reduce((a, v, i) => a + (v.pp ?? 0) * Math.pow(0.95, i), 0);
    }

    /**
     * Calculates the bonus performance points of a player.
     *
     * @param playCount The play count of the player.
     * @returns The bonus performance points.
     */
    static calculateBonusPerformancePoints(playCount: number): number {
        return (1250 / 3) * (1 - Math.pow(0.9992, playCount));
    }

    /**
     * Generates a string containing information about a difficulty attributes' star rating.
     *
     * @param attributes The difficulty attributes.
     * @returns The string.
     */
    static getDroidDifficultyAttributesInfo(
        attributes:
            | DroidDifficultyAttributes
            | ResponseDifficultyAttributes<DroidDifficultyAttributes>
            | RebalanceDroidDifficultyAttributes
            | ResponseDifficultyAttributes<RebalanceDroidDifficultyAttributes>,
    ): string {
        let string: string = `${attributes.starRating.toFixed(2)} stars (`;
        const starRatingDetails: string[] = [];

        const addDetail = (num: number, suffix: string) =>
            starRatingDetails.push(`${num.toFixed(2)} ${suffix}`);

        addDetail(attributes.aimDifficulty, "aim");
        addDetail(attributes.tapDifficulty, "tap");
        addDetail(attributes.rhythmDifficulty, "rhythm");
        addDetail(attributes.flashlightDifficulty, "flashlight");
        addDetail(attributes.visualDifficulty, "visual");

        string += starRatingDetails.join(", ") + ")";

        return string;
    }

    /**
     * Generates a string containing information about a difficulty attributes' star rating.
     *
     * @param attributes The difficulty attributes.
     * @returns The string.
     */
    static getRebalanceDroidDifficultyAttributesInfo(
        attributes:
            | RebalanceDroidDifficultyAttributes
            | ResponseDifficultyAttributes<RebalanceDroidDifficultyAttributes>,
    ): string {
        let string: string = `${attributes.starRating.toFixed(2)} stars (`;
        const starRatingDetails: string[] = [];

        const addDetail = (num: number, suffix: string) =>
            starRatingDetails.push(`${num.toFixed(2)} ${suffix}`);

        addDetail(attributes.aimDifficulty, "aim");
        addDetail(attributes.tapDifficulty, "tap");
        addDetail(attributes.rhythmDifficulty, "rhythm");
        addDetail(attributes.flashlightDifficulty, "flashlight");
        addDetail(attributes.visualDifficulty, "visual");

        string += starRatingDetails.join(", ") + ")";

        return string;
    }

    /**
     * Generates a string containing information about a difficulty attributes' star rating.
     *
     * @param attributes The difficulty attributes.
     * @returns The string.
     */
    static getOsuDifficultyAttributesInfo(
        attributes:
            | OsuDifficultyAttributes
            | CacheableDifficultyAttributes<OsuDifficultyAttributes>,
    ): string {
        let string = `${attributes.starRating.toFixed(2)} stars (`;
        const starRatingDetails: string[] = [];

        const addDetail = (num: number, suffix: string) =>
            starRatingDetails.push(`${num.toFixed(2)} ${suffix}`);

        addDetail(attributes.aimDifficulty, "aim");
        addDetail(attributes.speedDifficulty, "speed");
        addDetail(attributes.flashlightDifficulty, "flashlight");

        string += starRatingDetails.join(", ") + ")";

        return string;
    }

    /**
     * Generates a string containing information about a difficulty attributes' star rating.
     *
     * @param attributes The difficulty attributes.
     * @returns The string.
     */
    static getRebalanceOsuDifficultyAttributesInfo(
        attributes:
            | RebalanceOsuDifficultyAttributes
            | ResponseDifficultyAttributes<RebalanceOsuDifficultyAttributes>,
    ): string {
        let string = `${attributes.starRating.toFixed(2)} stars (`;
        const starRatingDetails: string[] = [];

        const addDetail = (num: number, suffix: string) =>
            starRatingDetails.push(`${num.toFixed(2)} ${suffix}`);

        addDetail(attributes.aimDifficulty, "aim");
        addDetail(attributes.speedDifficulty, "speed");
        addDetail(attributes.flashlightDifficulty, "flashlight");

        string += starRatingDetails.join(", ") + ")";

        return string;
    }

    /**
     * Generates a string containing the summary of a performance attributes.
     *
     * @param attributes The performance attributes.
     * @returns The string.
     */
    static getDroidPerformanceAttributesInfo(
        attributes: DroidPerformanceAttributes,
    ): string {
        let string = `${attributes.total.toFixed(2)} pp (`;
        const starRatingDetails: string[] = [];

        const addDetail = (num: number, suffix: string) =>
            starRatingDetails.push(`${num.toFixed(2)} ${suffix}`);

        addDetail(attributes.aim, "aim");
        addDetail(attributes.tap, "tap");
        addDetail(attributes.accuracy, "accuracy");
        addDetail(attributes.flashlight, "flashlight");
        addDetail(attributes.visual, "visual");

        string += starRatingDetails.join(", ") + ")";

        return string;
    }

    /**
     * Generates a string containing the summary of a performance attributes.
     *
     * @param attributes The performance attributes.
     * @returns The string.
     */
    static getOsuPerformanceAttributesInfo(
        attributes: OsuPerformanceAttributes,
    ): string {
        let string = `${attributes.total.toFixed(2)} pp (`;
        const starRatingDetails: string[] = [];

        const addDetail = (num: number, suffix: string) =>
            starRatingDetails.push(`${num.toFixed(2)} ${suffix}`);

        addDetail(attributes.aim, "aim");
        addDetail(attributes.speed, "speed");
        addDetail(attributes.accuracy, "accuracy");
        addDetail(attributes.flashlight, "flashlight");

        string += starRatingDetails.join(", ") + ")";

        return string;
    }
}
