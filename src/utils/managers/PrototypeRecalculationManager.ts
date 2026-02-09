import { DatabaseManager } from "@database/DatabaseManager";
import { Language } from "@localization/base/Language";
import {
    PrototypeRecalculationManagerLocalization,
    PrototypeRecalculationManagerStrings,
} from "@localization/utils/managers/PrototypeRecalculationManager/PrototypeRecalculationManagerLocalization";
import { OperationResult } from "@structures/core/OperationResult";
import { PPEntry } from "@structures/pp/PPEntry";
import { PrototypePPEntry } from "@structures/pp/PrototypePPEntry";
import { RecalculationQueue } from "@structures/pp/RecalculationQueue";
import { Manager } from "@utils/base/Manager";
import { DroidHelper } from "@utils/helpers/DroidHelper";
import { Collection, CommandInteraction, hyperlink } from "discord.js";
import { BeatmapManager } from "./BeatmapManager";
import { PPProcessorRESTManager } from "./PPProcessorRESTManager";
import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import {
    Modes,
    Accuracy,
    BeatmapDifficulty,
    ModUtil,
} from "@rian8337/osu-base";
import { PPHelper } from "@utils/helpers/PPHelper";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { Config } from "@core/Config";
import consola from "consola";

/**
 * A manager for prototype dpp calculations.
 */
export abstract class PrototypeRecalculationManager extends Manager {
    /**
     * Recalculation queue for per-player prototype recalculation, mapped by user ID.
     */
    private static readonly _recalculationQueue = new Collection<
        number,
        RecalculationQueue
    >();

    /**
     * Recalculation queue for per-player prototype recalculation, mapped by user ID.
     */
    static get recalculationQueue(): ReadonlyMap<number, RecalculationQueue> {
        return this._recalculationQueue;
    }

    private static readonly calculationSuccessResponse: keyof PrototypeRecalculationManagerStrings =
        "recalculationSuccessful";
    private static readonly calculationFailedResponse: keyof PrototypeRecalculationManagerStrings =
        "recalculationFailed";

    private static calculationIsProgressing = false;

    /**
     * Queues a user for prototype recalculation.
     *
     * @param userId The ID of the queued user.
     * @param reworkType The rework type of the prototype.
     */
    static queue(
        interaction: CommandInteraction,
        uid: number,
        reworkType: string,
    ): void {
        this._recalculationQueue.set(uid, {
            interaction: interaction,
            uid: uid,
            reworkType: reworkType,
        });

        void this.beginPrototypeRecalculation();
    }

    /**
     * Calculates a player's dpp into the prototype dpp database.
     *
     * @param uid The uid of the player.
     * @param reworkType The rework type of the prototype.
     * @returns The operation result.
     */
    static async calculatePlayer(
        uid: number,
        reworkType: string,
    ): Promise<OperationResult> {
        const player = await DroidHelper.getPlayer(uid, ["id", "username"]);

        if (!player) {
            return this.createOperationResult(false, "Player not found");
        }

        const currentList: PPEntry[] = [];
        const newList: PrototypePPEntry[] = [];

        const topScores = await DroidHelper.getTopScores(uid);

        if (topScores.length === 0) {
            return this.createOperationResult(
                false,
                "Failed to fetch top scores",
            );
        }

        for (const score of topScores) {
            const beatmapInfo = await BeatmapManager.getBeatmap(score.hash, {
                checkFile: false,
            });

            if (!beatmapInfo) {
                continue;
            }

            const liveAttribs =
                await PPProcessorRESTManager.getOnlineScoreAttributes(
                    score.uid,
                    score.hash,
                    Modes.droid,
                    PPCalculationMethod.live,
                    true,
                );

            if (!liveAttribs) {
                continue;
            }

            const localAttribs =
                await PPProcessorRESTManager.getOnlineScoreAttributes(
                    score.uid,
                    score.hash,
                    Modes.droid,
                    PPCalculationMethod.rebalance,
                    true,
                );

            if (!localAttribs) {
                continue;
            }

            const {
                difficulty: liveDiffResult,
                performance: livePerfResult,
                params: liveParams,
            } = liveAttribs.attributes;

            const {
                difficulty: localDiffResult,
                performance: localPerfResult,
                params: localParams,
            } = localAttribs.attributes;

            const beatmapDifficulty = new BeatmapDifficulty();
            beatmapDifficulty.cs = beatmapInfo.cs;
            beatmapDifficulty.ar = beatmapInfo.ar;
            beatmapDifficulty.od = beatmapInfo.od;
            beatmapDifficulty.hp = beatmapInfo.hp;

            ModUtil.applyModsToBeatmapDifficulty(
                beatmapDifficulty,
                Modes.droid,
                score.mods,
                true,
            );

            const accuracy = new Accuracy(liveParams.accuracy);

            const currentEntry: PPEntry = {
                uid: score.uid,
                hash: beatmapInfo.hash,
                title: beatmapInfo.fullTitle,
                pp: livePerfResult.total,
                mods: liveAttribs.attributes.difficulty.mods,
                accuracy: accuracy.value() * 100,
                combo: liveParams.combo,
                miss: accuracy.nmiss,
            };

            const basePrototypeEntry = {
                uid: score.uid,
                hash: beatmapInfo.hash,
                title: beatmapInfo.fullTitle,
                circleSize: beatmapDifficulty.cs,
                approachRate: beatmapDifficulty.ar,
                overallDifficulty: beatmapDifficulty.od,
                accuracy: accuracy.value() * 100,
                combo: liveParams.combo,
                maxCombo: liveDiffResult.maxCombo,
                mods: liveDiffResult.mods,
                hit300: accuracy.n300,
                hit100: accuracy.n100,
                hit50: accuracy.n50,
                miss: accuracy.nmiss,
            } as const satisfies Partial<PrototypePPEntry>;

            const prototypeEntry: PrototypePPEntry = {
                ...basePrototypeEntry,
                live: {
                    difficulty: {
                        starRating: liveDiffResult.starRating,
                        aim: liveDiffResult.aimDifficulty,
                        tap: liveDiffResult.tapDifficulty,
                        rhythm: liveDiffResult.rhythmDifficulty,
                        flashlight: liveDiffResult.flashlightDifficulty,
                        reading: liveDiffResult.readingDifficulty,
                        speedNoteCount: liveDiffResult.speedNoteCount,
                    },
                    performance: {
                        total: livePerfResult.total,
                        aim: livePerfResult.aim,
                        tap: livePerfResult.tap,
                        accuracy: livePerfResult.accuracy,
                        flashlight: livePerfResult.flashlight,
                        reading: livePerfResult.reading,
                        estimatedUnstableRate: livePerfResult.deviation * 10,
                        estimatedTapUnstableRate:
                            livePerfResult.tapDeviation * 10,
                        tapPenalty: liveParams.tapPenalty,
                    },
                },
                local: {
                    difficulty: {
                        starRating: localDiffResult.starRating,
                        aim: localDiffResult.aimDifficulty,
                        tap: localDiffResult.tapDifficulty,
                        rhythm: localDiffResult.rhythmDifficulty,
                        flashlight: localDiffResult.flashlightDifficulty,
                        reading: localDiffResult.readingDifficulty,
                        speedNoteCount: localDiffResult.speedNoteCount,
                    },
                    performance: {
                        total: localPerfResult.total,
                        aim: localPerfResult.aim,
                        tap: localPerfResult.tap,
                        accuracy: localPerfResult.accuracy,
                        flashlight: localPerfResult.flashlight,
                        reading: localPerfResult.reading,
                        estimatedUnstableRate: localPerfResult.deviation * 10,
                        estimatedTapUnstableRate:
                            localPerfResult.tapDeviation * 10,
                        tapPenalty: localParams.tapPenalty,
                    },
                },
            };

            if (reworkType !== "overall") {
                const masterAttribs =
                    await PPProcessorRESTManager.getOnlineScoreAttributes(
                        score.uid,
                        score.hash,
                        Modes.droid,
                        PPCalculationMethod.rebalance,
                        true,
                        false,
                        true,
                    );

                if (!masterAttribs) {
                    continue;
                }

                const {
                    difficulty: masterDiffResult,
                    performance: masterPerfResult,
                } = masterAttribs.attributes;

                prototypeEntry.master = {
                    difficulty: {
                        starRating: masterDiffResult.starRating,
                        aim: masterDiffResult.aimDifficulty,
                        tap: masterDiffResult.tapDifficulty,
                        rhythm: masterDiffResult.rhythmDifficulty,
                        flashlight: masterDiffResult.flashlightDifficulty,
                        reading: masterDiffResult.readingDifficulty,
                        speedNoteCount: masterDiffResult.speedNoteCount,
                    },
                    performance: {
                        total: masterPerfResult.total,
                        aim: masterPerfResult.aim,
                        tap: masterPerfResult.tap,
                        accuracy: masterPerfResult.accuracy,
                        flashlight: masterPerfResult.flashlight,
                        reading: masterPerfResult.reading,
                        estimatedUnstableRate: masterPerfResult.deviation * 10,
                        estimatedTapUnstableRate:
                            masterPerfResult.tapDeviation * 10,
                        tapPenalty: localParams.tapPenalty,
                    },
                };
            }

            if (Config.isDebug) {
                consola.info(
                    `${beatmapInfo.fullTitle} ${score.completeModString}: ${(prototypeEntry.master ?? prototypeEntry.live).performance.total.toFixed(2)} ⮕  ${prototypeEntry.local.performance.total.toFixed(2)}`,
                );
            }

            currentList.push(currentEntry);
            newList.push(prototypeEntry);
        }

        currentList.sort((a, b) => b.pp - a.pp);

        newList.sort(
            (a, b) => b.local.performance.total - a.local.performance.total,
        );

        const currentTotal = PPHelper.calculateFinalPerformancePoints(
            currentList.map((e) => e.pp),
        );

        const newTotal = PPHelper.calculateFinalPerformancePoints(
            newList.map((e) => e.local.performance.total),
        );

        if (Config.isDebug) {
            consola.info(
                `${currentTotal.toFixed(2)} ⮕  ${newTotal.toFixed(2)}`,
            );
        }

        return DatabaseManager.aliceDb.collections.prototypePP.updateOne(
            {
                uid: uid,
                reworkType: reworkType,
            },
            {
                $set: {
                    pp: [...newList.values()],
                    pptotal: newTotal,
                    prevpptotal: currentTotal,
                    lastUpdate: Date.now(),
                    username: player.username,
                    scanDone: true,
                },
            },
            { upsert: true },
        );
    }

    /**
     * Begins a prototype recalculation if one has not been started yet.
     */
    private static async beginPrototypeRecalculation(): Promise<void> {
        if (this.calculationIsProgressing) {
            return;
        }

        this.calculationIsProgressing = true;

        while (this._recalculationQueue.size > 0) {
            const uid = this._recalculationQueue.firstKey()!;
            const queue = this._recalculationQueue.first()!;
            const { interaction, reworkType } = queue;

            const localization = this.getLocalization(
                CommandHelper.getUserPreferredLocale(interaction),
            );

            try {
                const result = await this.calculatePlayer(uid, reworkType);

                if (interaction.channel?.isSendable()) {
                    if (result.isSuccessful()) {
                        await interaction.channel.send({
                            content: MessageCreator.createAccept(
                                localization.getTranslation(
                                    this.calculationSuccessResponse,
                                ),
                                interaction.user.toString(),
                                `uid ${hyperlink(uid.toString(), `https://droidpp.osudroid.moe/prototype/profile/${uid.toString()}/${reworkType}`)}`,
                            ),
                        });
                    } else if (result.failed()) {
                        await interaction.channel.send({
                            content: MessageCreator.createReject(
                                localization.getTranslation(
                                    this.calculationFailedResponse,
                                ),
                                interaction.user.toString(),
                                `uid ${uid.toString()}`,
                                result.reason,
                            ),
                        });
                    }
                }
            } catch (e) {
                if (interaction.channel?.isSendable()) {
                    await interaction.channel.send({
                        content: MessageCreator.createReject(
                            localization.getTranslation(
                                this.calculationFailedResponse,
                            ),
                            interaction.user.toString(),
                            `uid ${uid.toString()}`,
                            e as string,
                        ),
                    });
                }
            } finally {
                this._recalculationQueue.delete(uid);
            }
        }

        this.calculationIsProgressing = false;
    }

    /**
     * Gets the localization of this manager utility.
     *
     * @param language The language to localize.
     */
    private static getLocalization(
        language: Language,
    ): PrototypeRecalculationManagerLocalization {
        return new PrototypeRecalculationManagerLocalization(language);
    }
}
