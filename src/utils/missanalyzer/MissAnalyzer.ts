import {
    Beatmap,
    Circle,
    DroidPlayableBeatmap,
    Interpolation,
    ModHardRock,
    ModMap,
    ModUtil,
    PlaceableHitObject,
    Slider,
    SliderHead,
    Spinner,
    Vector2,
} from "@rian8337/osu-base";
import {
    CursorOccurrenceGroup,
    HitResult,
    MovementType,
    ReplayData,
    ReplayObjectData,
} from "@rian8337/osu-droid-replay-analyzer";
import { MissInformation } from "./MissInformation";

/**
 * An analyzer for analyzing misses in a replay.
 */
export class MissAnalyzer {
    /**
     * The beatmap played in the replay.
     */
    private readonly beatmap: DroidPlayableBeatmap;

    /**
     * The objects of the beatmap played in the replay.
     */
    private readonly objects: readonly PlaceableHitObject[];

    /**
     * The data of the replay.
     */
    private readonly data: ReplayData;

    /**
     * The mods used in the replay.
     */
    private readonly mods: ModMap;

    /**
     * The speed multiplier of the beatmap.
     */
    private readonly overallSpeedMultiplier: number;

    /**
     * @param difficultyCalculator The difficulty calculator result of the replay.
     * @param data The data of the replay.
     * @param mods The mods applied in the replay. Used for old replay versions.
     */
    constructor(beatmap: Beatmap, data: ReplayData, mods: ModMap) {
        this.beatmap = beatmap.createDroidPlayableBeatmap(mods);

        this.objects = this.beatmap.hitObjects.objects;
        this.data = data;
        this.mods = mods;
        this.overallSpeedMultiplier = ModUtil.calculateRateWithMods(
            mods.values()
        );
    }

    /**
     * Analyzes the replay for miss informations.
     *
     * @param missLimit The amount of misses to analyze. Defaults to 10.
     * @returns Information about misses.
     */
    analyze(missLimit = 10): MissInformation[] {
        if (this.data.accuracy.nmiss === 0) {
            return [];
        }

        let missIndex = 0;
        const missInformations: MissInformation[] = [];

        const createMissInformation = (
            objectIndex: number,
            verdict?: string,
            cursorPosition?: Vector2,
            closestHit?: number
        ): MissInformation => {
            const object = this.objects[objectIndex];
            const previousObjects: PlaceableHitObject[] = [];
            const previousObjectData: ReplayObjectData[] = [];

            for (let i = objectIndex - 1; i >= 0; --i) {
                const o = this.objects[i];
                const timeDifference = object.startTime - o.startTime;

                if (timeDifference >= object.timePreempt) {
                    break;
                }

                previousObjects.push(o);
                previousObjectData.push(this.data.hitObjectData[i]);
            }

            const cursorGroups: CursorOccurrenceGroup[][] = [];
            const minCursorGroupAllowableTime =
                object.startTime - object.timePreempt;
            const maxCursorGroupAllowableTime = object.endTime + 250;

            for (const cursorData of this.data.cursorMovement) {
                const c: CursorOccurrenceGroup[] = [];

                for (const group of cursorData.occurrenceGroups) {
                    if (group.endTime < minCursorGroupAllowableTime) {
                        continue;
                    }

                    if (group.startTime > maxCursorGroupAllowableTime) {
                        break;
                    }

                    c.push(group);
                }

                cursorGroups.push(c);
            }

            return new MissInformation(
                this.beatmap.metadata,
                this.objects[objectIndex],
                objectIndex,
                this.objects.length,
                missIndex++,
                this.data.accuracy.nmiss,
                this.overallSpeedMultiplier,
                this.mods.has(ModHardRock),
                previousObjects.reverse(),
                previousObjectData.reverse(),
                cursorGroups,
                verdict,
                cursorPosition,
                closestHit
            );
        };

        for (let i = 0; i < this.data.hitObjectData.length; ++i) {
            if (
                missIndex === missLimit ||
                missIndex === this.data.accuracy.nmiss
            ) {
                break;
            }

            const objectData = this.data.hitObjectData[i];

            if (objectData.result !== HitResult.miss) {
                continue;
            }

            const object = this.objects[i];

            if (!object.hitWindow) {
                continue;
            }

            if (object instanceof Spinner) {
                // Spinner misses are simple. They just didn't spin enough.
                missInformations.push(
                    createMissInformation(i, "Didn't spin enough")
                );

                continue;
            }

            // Find the cursor instance with the closest tap/drag occurrence to the object.
            let closestHit = Number.POSITIVE_INFINITY;
            let closestCursorPosition: Vector2 | null = null;
            let verdict: string | null = null;

            for (let j = 0; j < this.data.cursorMovement.length; ++j) {
                const cursorOccurrenceInfo =
                    this.getCursorOccurrenceClosestToObject(
                        object instanceof Slider ? object.head : object,
                        j,
                        i > 0 &&
                            this.data.hitObjectData[i - 1].result ===
                                HitResult.miss
                    );

                if (cursorOccurrenceInfo === null) {
                    continue;
                }

                if (
                    Math.abs(cursorOccurrenceInfo.closestHit) <
                        object.hitWindow.mehWindow &&
                    Math.abs(cursorOccurrenceInfo.closestHit) <
                        Math.abs(closestHit)
                ) {
                    closestCursorPosition = cursorOccurrenceInfo.position;
                    closestHit = cursorOccurrenceInfo.closestHit;
                    verdict = cursorOccurrenceInfo.verdict;
                }
            }

            if (closestCursorPosition && verdict !== null) {
                missInformations.push(
                    createMissInformation(
                        i,
                        verdict,
                        closestCursorPosition,
                        closestHit
                    )
                );
            } else {
                missInformations.push(createMissInformation(i));
            }
        }

        return missInformations;
    }

    /**
     * Gets the cursor occurrence index at which the cursor has the closest distance to an object.
     *
     * @param object The object.
     * @param cursorIndex The index of the cursor instance.
     * @param includeNotelockVerdict Whether to allow the notelock verdict.
     * @returns The cursor occurrence information from the cursor instance at which
     * the cursor is the closest to the object, `null` if not found.
     */
    private getCursorOccurrenceClosestToObject(
        object: Circle | SliderHead,
        cursorIndex: number,
        includeNotelockVerdict: boolean
    ): { position: Vector2; closestHit: number; verdict: string } | null {
        if (!object.hitWindow) {
            return null;
        }

        const cursorData = this.data.cursorMovement[cursorIndex];

        // Limit to cursor occurrences within this distance.
        // Add a cap to better assess smaller objects.
        let closestDistance = Math.max(2.5 * object.radius, 80);
        let closestHit = Number.POSITIVE_INFINITY;
        let closestCursorPosition: Vector2 | null = null;

        const minAllowableTapTime =
            object.startTime - object.hitWindow.mehWindow;
        const maxAllowableTapTime =
            object.startTime + object.hitWindow.mehWindow;

        const acceptDistance = (distance: number): boolean => {
            if (distance > closestDistance) {
                return false;
            }

            if (!includeNotelockVerdict) {
                return distance > object.radius;
            }

            return true;
        };

        for (const group of cursorData.occurrenceGroups) {
            if (group.endTime < minAllowableTapTime) {
                continue;
            }

            if (group.startTime > maxAllowableTapTime) {
                break;
            }

            const { allOccurrences } = group;

            for (let i = 0; i < allOccurrences.length; ++i) {
                const occurrence = allOccurrences[i];

                if (
                    occurrence.time > maxAllowableTapTime ||
                    occurrence.id === MovementType.up
                ) {
                    break;
                }

                if (occurrence.id === MovementType.down) {
                    const distanceToObject = object.stackedPosition.getDistance(
                        occurrence.position
                    );

                    if (acceptDistance(distanceToObject)) {
                        closestDistance = distanceToObject;
                        closestCursorPosition = occurrence.position;
                        closestHit = occurrence.time - object.startTime;
                    }
                }

                const nextOccurrence = allOccurrences[i + 1];

                if (nextOccurrence) {
                    // Check if other cursor instances have a tap occurrence within both occurrences' boundary.
                    for (let j = 0; j < this.data.cursorMovement.length; ++j) {
                        // Do not check the current cursor instance in loop.
                        if (j === cursorIndex) {
                            continue;
                        }

                        const { occurrenceGroups } =
                            this.data.cursorMovement[j];

                        for (const cursorGroup of occurrenceGroups) {
                            const cursorDownTime = cursorGroup.down.time;

                            if (cursorDownTime < minAllowableTapTime) {
                                continue;
                            }

                            if (cursorDownTime > maxAllowableTapTime) {
                                break;
                            }

                            const t =
                                (cursorDownTime - occurrence.time) /
                                (nextOccurrence.time - occurrence.time);

                            const cursorPosition =
                                nextOccurrence.id === MovementType.move
                                    ? new Vector2(
                                          Interpolation.lerp(
                                              occurrence.position.x,
                                              nextOccurrence.position.x,
                                              t
                                          ),
                                          Interpolation.lerp(
                                              occurrence.position.y,
                                              nextOccurrence.position.y,
                                              t
                                          )
                                      )
                                    : occurrence.position;

                            const distanceToObject: number =
                                object.stackedPosition.getDistance(
                                    cursorPosition
                                );

                            if (acceptDistance(distanceToObject)) {
                                closestDistance = distanceToObject;
                                closestCursorPosition = cursorPosition;
                                closestHit = cursorDownTime - object.startTime;
                            }
                        }
                    }
                }
            }
        }

        if (closestCursorPosition === null) {
            return null;
        }

        let verdict = "Misaim";
        if (closestDistance <= object.radius) {
            verdict = "Notelock";
        }

        return {
            position: closestCursorPosition,
            closestHit: closestHit,
            verdict: verdict,
        };
    }
}
