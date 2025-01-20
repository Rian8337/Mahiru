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
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DroidHelper } from "@utils/helpers/DroidHelper";
import { Collection, CommandInteraction } from "discord.js";
import { BeatmapManager } from "./BeatmapManager";
import { PPProcessorRESTManager } from "./PPProcessorRESTManager";
import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { Modes, Accuracy, MathUtils } from "@rian8337/osu-base";
import { NumberHelper } from "@utils/helpers/NumberHelper";
import { PPHelper } from "@utils/helpers/PPHelper";
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
     * @param interaction The interaction that queued the user.
     * @param userId The ID of the queued user.
     * @param reworkType The rework type of the prototype.
     * @param notifyOnComplete Whether to notify the user when the recalculation is complete.
     */
    static queue(
        interaction: CommandInteraction,
        uid: number,
        reworkType: string,
        notifyOnComplete: boolean,
    ): void {
        this._recalculationQueue.set(uid, {
            interaction: interaction,
            reworkType: reworkType,
            notifyOnComplete: notifyOnComplete,
        });

        this.beginPrototypeRecalculation();
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

        if (!topScores) {
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
                );

            if (!liveAttribs) {
                continue;
            }

            const rebalAttribs =
                await PPProcessorRESTManager.getOnlineScoreAttributes(
                    score.uid,
                    score.hash,
                    Modes.droid,
                    PPCalculationMethod.rebalance,
                );

            if (!rebalAttribs) {
                continue;
            }

            const { performance: perfResult, params } = liveAttribs.attributes;
            const { performance: rebalPerfResult, params: rebalParams } =
                rebalAttribs.attributes;

            const accuracy = new Accuracy(params.accuracy);

            const currentEntry: PPEntry = {
                uid: score.uid,
                hash: beatmapInfo.hash,
                title: beatmapInfo.fullTitle,
                pp: NumberHelper.round(perfResult.total, 2),
                mods: liveAttribs.attributes.difficulty.mods,
                accuracy: NumberHelper.round(accuracy.value() * 100, 2),
                combo: params.combo,
                miss: accuracy.nmiss,
            };

            const prototypeEntry: PrototypePPEntry = {
                uid: score.uid,
                hash: beatmapInfo.hash,
                title: beatmapInfo.fullTitle,
                pp: NumberHelper.round(rebalPerfResult.total, 2),
                newAim: NumberHelper.round(rebalPerfResult.aim, 2),
                newTap: NumberHelper.round(rebalPerfResult.tap, 2),
                newAccuracy: NumberHelper.round(rebalPerfResult.accuracy, 2),
                newVisual: NumberHelper.round(rebalPerfResult.visual, 2),
                prevPP: NumberHelper.round(perfResult.total, 2),
                prevAim: NumberHelper.round(perfResult.aim, 2),
                prevTap: NumberHelper.round(perfResult.tap, 2),
                prevAccuracy: NumberHelper.round(perfResult.accuracy, 2),
                prevVisual: NumberHelper.round(perfResult.visual, 2),
                mods: rebalAttribs.attributes.difficulty.mods,
                accuracy: NumberHelper.round(accuracy.value() * 100, 2),
                combo: params.combo,
                miss: accuracy.nmiss,
                speedMultiplier:
                    rebalParams.customSpeedMultiplier !== 1
                        ? rebalParams.customSpeedMultiplier
                        : undefined,
                calculatedUnstableRate: rebalPerfResult.calculatedUnstableRate,
                estimatedUnstableRate: NumberHelper.round(
                    rebalPerfResult.deviation * 10,
                    2,
                ),
                estimatedSpeedUnstableRate: NumberHelper.round(
                    rebalPerfResult.tapDeviation * 10,
                    2,
                ),
                overallDifficulty:
                    rebalAttribs.attributes.difficulty.overallDifficulty,
                hit300: accuracy.n300,
                hit100: accuracy.n100,
                hit50: accuracy.n50,
                aimSliderCheesePenalty: rebalPerfResult.aimSliderCheesePenalty,
                flashlightSliderCheesePenalty:
                    rebalPerfResult.flashlightSliderCheesePenalty,
                visualSliderCheesePenalty:
                    rebalPerfResult.visualSliderCheesePenalty,
                speedNoteCount:
                    rebalAttribs.attributes.difficulty.speedNoteCount,
                liveTapPenalty: params.tapPenalty,
                rebalanceTapPenalty: rebalParams.tapPenalty,
                averageBPM: MathUtils.millisecondsToBPM(
                    rebalAttribs.attributes.difficulty.averageSpeedDeltaTime,
                ),
            };

            consola.info(
                `${beatmapInfo.fullTitle} ${score.completeModString}: ${prototypeEntry.prevPP} ⮕  ${prototypeEntry.pp}`,
            );

            currentList.push(currentEntry);
            newList.push(prototypeEntry);
        }

        currentList.sort((a, b) => b.pp - a.pp);
        newList.sort((a, b) => b.pp - a.pp);

        const currentTotal =
            PPHelper.calculateFinalPerformancePoints(currentList);
        const newTotal = PPHelper.calculateFinalPerformancePoints(newList);

        consola.info(`${currentTotal.toFixed(2)} ⮕  ${newTotal.toFixed(2)}`);

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
            const { interaction, reworkType, notifyOnComplete } = queue;

            const localization = this.getLocalization(
                CommandHelper.getUserPreferredLocale(interaction),
            );

            try {
                const result = await this.calculatePlayer(uid, reworkType);

                if (notifyOnComplete && interaction.channel?.isSendable()) {
                    if (result.isSuccessful()) {
                        await interaction.channel.send({
                            content: MessageCreator.createAccept(
                                localization.getTranslation(
                                    this.calculationSuccessResponse,
                                ),
                                interaction.user.toString(),
                                `uid ${uid}`,
                            ),
                        });
                    } else if (result.failed()) {
                        await interaction.channel.send({
                            content: MessageCreator.createReject(
                                localization.getTranslation(
                                    this.calculationFailedResponse,
                                ),
                                interaction.user.toString(),
                                `uid ${uid}`,
                                result.reason,
                            ),
                        });
                    }
                }
            } catch (e) {
                if (notifyOnComplete && interaction.channel?.isSendable()) {
                    await interaction.channel.send({
                        content: MessageCreator.createReject(
                            localization.getTranslation(
                                this.calculationFailedResponse,
                            ),
                            interaction.user.toString(),
                            `uid ${uid}`,
                            <string>e,
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
