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
        reworkType: string
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
        reworkType: string
    ): Promise<OperationResult> {
        const player = await DroidHelper.getPlayer(uid, ["id", "username"]);

        if (!player) {
            return this.createOperationResult(false, "Player not found");
        }

        const currentList: PPEntry[] = [];
        const newList: PrototypePPEntry[] = [];

        const topScores = await DroidHelper.getTopScores(uid, 200);

        if (topScores.length === 0) {
            return this.createOperationResult(
                false,
                "Failed to fetch top scores"
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
                    true
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
                    true
                );

            if (!rebalAttribs) {
                continue;
            }

            const {
                difficulty: diffResult,
                performance: perfResult,
                params,
            } = liveAttribs.attributes;
            const {
                difficulty: rebalDiffResult,
                performance: rebalPerfResult,
                params: rebalParams,
            } = rebalAttribs.attributes;

            const beatmapDifficulty = new BeatmapDifficulty();
            beatmapDifficulty.cs = beatmapInfo.cs;
            beatmapDifficulty.ar = beatmapInfo.ar;
            beatmapDifficulty.od = beatmapInfo.od;
            beatmapDifficulty.hp = beatmapInfo.hp;

            ModUtil.applyModsToBeatmapDifficulty(
                beatmapDifficulty,
                Modes.droid,
                score.mods,
                true
            );

            const accuracy = new Accuracy(params.accuracy);

            const currentEntry: PPEntry = {
                uid: score.uid,
                hash: beatmapInfo.hash,
                title: beatmapInfo.fullTitle,
                pp: perfResult.total,
                mods: liveAttribs.attributes.difficulty.mods,
                accuracy: accuracy.value() * 100,
                combo: params.combo,
                miss: accuracy.nmiss,
            };

            const prototypeEntry: PrototypePPEntry = {
                uid: score.uid,
                hash: beatmapInfo.hash,
                title: beatmapInfo.fullTitle,
                circleSize: beatmapDifficulty.cs,
                approachRate: beatmapDifficulty.ar,
                overallDifficulty: beatmapDifficulty.od,
                newStarRating: rebalDiffResult.starRating,
                newAimDifficulty: rebalDiffResult.aimDifficulty,
                newTapDifficulty: rebalDiffResult.tapDifficulty,
                newRhythmDifficulty: rebalDiffResult.rhythmDifficulty,
                newFlashlightDifficulty: rebalDiffResult.flashlightDifficulty,
                newReadingDifficulty: rebalDiffResult.readingDifficulty,
                pp: rebalPerfResult.total,
                newAim: rebalPerfResult.aim,
                newTap: rebalPerfResult.tap,
                newAccuracy: rebalPerfResult.accuracy,
                newFlashlight: rebalPerfResult.flashlight,
                newReading: rebalPerfResult.reading,
                prevStarRating: diffResult.starRating,
                prevAimDifficulty: diffResult.aimDifficulty,
                prevTapDifficulty: diffResult.tapDifficulty,
                prevRhythmDifficulty: diffResult.rhythmDifficulty,
                prevFlashlightDifficulty: diffResult.flashlightDifficulty,
                prevVisualDifficulty: diffResult.visualDifficulty,
                prevPP: perfResult.total,
                prevAim: perfResult.aim,
                prevTap: perfResult.tap,
                prevAccuracy: perfResult.accuracy,
                prevFlashlight: perfResult.flashlight,
                prevVisual: perfResult.visual,
                mods: rebalAttribs.attributes.difficulty.mods,
                accuracy: accuracy.value() * 100,
                combo: params.combo,
                maxCombo: diffResult.maxCombo,
                miss: accuracy.nmiss,
                estimatedUnstableRate: rebalPerfResult.deviation * 10,
                estimatedSpeedUnstableRate: rebalPerfResult.tapDeviation * 10,
                hit300: accuracy.n300,
                hit100: accuracy.n100,
                hit50: accuracy.n50,
                aimSliderCheesePenalty: rebalPerfResult.aimSliderCheesePenalty,
                flashlightSliderCheesePenalty:
                    rebalPerfResult.flashlightSliderCheesePenalty,
                speedNoteCount:
                    rebalAttribs.attributes.difficulty.speedNoteCount,
                liveTapPenalty: params.tapPenalty,
                rebalanceTapPenalty: rebalParams.tapPenalty,
            };

            if (Config.isDebug) {
                consola.info(
                    `${beatmapInfo.fullTitle} ${score.completeModString}: ${prototypeEntry.prevPP.toFixed(2)} ⮕  ${prototypeEntry.pp.toFixed(2)}`
                );
            }

            currentList.push(currentEntry);
            newList.push(prototypeEntry);
        }

        currentList.sort((a, b) => b.pp - a.pp);
        newList.sort((a, b) => b.pp - a.pp);

        const currentTotal =
            PPHelper.calculateFinalPerformancePoints(currentList);
        const newTotal = PPHelper.calculateFinalPerformancePoints(newList);

        if (Config.isDebug) {
            consola.info(
                `${currentTotal.toFixed(2)} ⮕  ${newTotal.toFixed(2)}`
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
            { upsert: true }
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
                CommandHelper.getUserPreferredLocale(interaction)
            );

            try {
                const result = await this.calculatePlayer(uid, reworkType);

                if (interaction.channel?.isSendable()) {
                    if (result.isSuccessful()) {
                        await interaction.channel.send({
                            content: MessageCreator.createAccept(
                                localization.getTranslation(
                                    this.calculationSuccessResponse
                                ),
                                interaction.user.toString(),
                                `uid ${hyperlink(uid.toString(), `https://droidpp.osudroid.moe/prototype/profile/${uid.toString()}/${reworkType}`)}`
                            ),
                        });
                    } else if (result.failed()) {
                        await interaction.channel.send({
                            content: MessageCreator.createReject(
                                localization.getTranslation(
                                    this.calculationFailedResponse
                                ),
                                interaction.user.toString(),
                                `uid ${uid.toString()}`,
                                result.reason
                            ),
                        });
                    }
                }
            } catch (e) {
                if (interaction.channel?.isSendable()) {
                    await interaction.channel.send({
                        content: MessageCreator.createReject(
                            localization.getTranslation(
                                this.calculationFailedResponse
                            ),
                            interaction.user.toString(),
                            `uid ${uid.toString()}`,
                            e as string
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
        language: Language
    ): PrototypeRecalculationManagerLocalization {
        return new PrototypeRecalculationManagerLocalization(language);
    }
}
