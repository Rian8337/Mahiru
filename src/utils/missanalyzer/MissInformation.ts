import { NumberHelper } from "@utils/helpers/NumberHelper";
import {
    BeatmapMetadata,
    DroidHitWindow,
    HitWindow,
    Interpolation,
    Modes,
    PlaceableHitObject,
    Playfield,
    RGBColor,
    Slider,
    SliderRepeat,
    SliderTick,
    Spinner,
    Vector2,
} from "@rian8337/osu-base";
import {
    CursorOccurrenceGroup,
    HitResult,
    MovementType,
    ReplayObjectData,
} from "@rian8337/osu-droid-replay-analyzer";
import { Canvas } from "canvas";

/**
 * Represents an information about a miss.
 */
export class MissInformation {
    /**
     * The metadata of the beatmap.
     */
    readonly metadata: BeatmapMetadata;

    /**
     * The object that was missed.
     */
    readonly object: PlaceableHitObject;

    /**
     * The zero-based index of the miss in the score.
     */
    readonly missIndex: number;

    /**
     * The amount of misses in the beatmap.
     */
    readonly totalMisses: number;

    /**
     * The zero-based index of the object.
     */
    readonly objectIndex: number;

    /**
     * The amount of objects in the beatmap.
     */
    readonly totalObjects: number;

    /**
     * The rate at which the clock progress in the score.
     */
    readonly clockRate: number;

    /**
     * Whether to flip cursors vertically before drawing them.
     */
    readonly drawCursorFlipped: boolean;

    /**
     * The verdict for the miss.
     */
    readonly verdict?: string;

    /**
     * The cursor position at the closest hit to the object.
     */
    readonly closestCursorPosition?: Vector2;

    /**
     * The closest hit to the object.
     */
    readonly closestHit?: number;

    /**
     * The objects prior to the current object.
     */
    readonly previousObjects: PlaceableHitObject[];

    /**
     * The replay data of past objects.
     */
    readonly previousObjectData: ReplayObjectData[];

    /**
     * The cursor groups to draw for each cursor instance.
     */
    readonly cursorGroups: CursorOccurrenceGroup[][];

    /**
     * Whether the canvas for this miss information has been generated.
     */
    get isGenerated(): boolean {
        return this.canvas !== undefined;
    }

    private get hitWindow(): HitWindow | null {
        return this.object instanceof Slider
            ? this.object.head.hitWindow
            : this.object.hitWindow;
    }

    private canvas?: Canvas;
    private readonly playfieldScale = 1.75;

    // Colors are taken from osu!lazer: https://github.com/ppy/osu/blob/daae560ff731bdf49970a5bc6588c0861fac760f/osu.Game/Graphics/OsuColour.cs#L105-L131
    private readonly hitColors: Record<
        Exclude<HitResult, HitResult.miss>,
        RGBColor
    > = {
        [HitResult.meh]: new RGBColor(255, 204, 34),
        [HitResult.good]: new RGBColor(179, 217, 68),
        [HitResult.great]: new RGBColor(102, 204, 255),
    };

    /**
     * @param metadata The metadata of the beatmap.
     * @param object The object that was missed.
     * @param objectIndex The index of the object.
     * @param missIndex The index of the miss in the score.
     * @param totalMisses The amount of misses in the score.
     * @param verdict The verdict for the miss.
     * @param clockRate The rate at which the clock progress in the score.
     * @param drawCursorFlipped Whether to flip cursors vertically before drawing them.
     * @param previousObjects The objects prior to the current object.
     * @param previousObjectData The replay object data of past objects.
     * @param cursorGroups The cursor groups to draw.
     * @param approachRateTime The AR of the beatmap, in milliseconds.
     * @param hitWindow The hit window of the object.
     * @param closestCursorPosition The cursor position at the closest hit to the object.
     * @param closestHit The closest hit to the object.
     */
    constructor(
        metadata: BeatmapMetadata,
        object: PlaceableHitObject,
        objectIndex: number,
        totalObjects: number,
        missIndex: number,
        totalMisses: number,
        clockRate: number,
        drawCursorFlipped: boolean,
        previousObjects: PlaceableHitObject[],
        previousObjectData: ReplayObjectData[],
        cursorGroups: CursorOccurrenceGroup[][],
        verdict?: string,
        closestCursorPosition?: Vector2,
        closestHit?: number,
    ) {
        this.metadata = metadata;
        this.object = object;
        this.objectIndex = objectIndex;
        this.totalObjects = totalObjects;
        this.missIndex = missIndex;
        this.totalMisses = totalMisses;
        this.verdict = verdict;
        this.clockRate = clockRate;
        this.drawCursorFlipped = drawCursorFlipped;
        this.closestCursorPosition = closestCursorPosition;
        this.closestHit = closestHit;
        this.previousObjects = previousObjects;
        this.previousObjectData = previousObjectData;
        this.cursorGroups = cursorGroups;

        if (this.closestHit) {
            this.closestHit /= clockRate;
        }
    }

    /**
     * Draws the object that was missed.
     *
     * @returns The canvas used to draw the object.
     */
    draw(): Canvas {
        if (this.canvas) {
            return this.canvas;
        }

        this.canvas = new Canvas(1200, 1000);
        this.writeTexts();
        this.initPlayfield();
        this.drawObjects();
        this.drawHitErrorBar();
        this.drawCursorGroups();
        this.drawClosestCursorPosition();

        this.canvas.getContext("2d").restore();

        return this.canvas;
    }

    /**
     * Writes necessary texts in the canvas.
     */
    private writeTexts(): void {
        if (!this.canvas) {
            return;
        }

        const context = this.canvas.getContext("2d");
        const textPadding = 5;

        context.save();
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        context.restore();

        context.font = "28px Exo";
        context.textBaseline = "middle";
        context.fillText(
            `${this.metadata.artist} - ${this.metadata.title} [${this.metadata.version}]`,
            textPadding,
            textPadding + 10,
        );
        context.fillText(
            `Object ${this.objectIndex + 1} of ${this.totalObjects}`,
            5,
            textPadding + 40,
        );
        context.fillText(
            `Miss ${this.missIndex + 1} of ${this.totalMisses}`,
            5,
            textPadding + 70,
        );

        let startTime = Math.floor(this.object.startTime / this.clockRate);

        const minutes = Math.floor(startTime / 60000);
        startTime -= minutes * 60000;

        const seconds = Math.floor(startTime / 1000);
        startTime -= seconds * 1000;

        context.fillText(
            `Time: ${minutes.toString().padStart(2, "0")}:${seconds
                .toString()
                .padStart(2, "0")}.${startTime.toString().padStart(3, "0")}`,
            textPadding,
            985 - textPadding,
        );

        if (this.verdict) {
            const verdictText = `Verdict: ${this.verdict}`;
            context.fillText(
                verdictText,
                this.canvas.width -
                    textPadding -
                    context.measureText(verdictText).width,
                (this.closestHit !== undefined ? 955 : 985) - textPadding,
            );
        }

        if (this.closestHit !== undefined) {
            let closestHitText = `Closest tap: ${
                Number.isInteger(this.closestHit)
                    ? Math.abs(this.closestHit)
                    : Math.abs(this.closestHit).toFixed(2)
            }ms${
                this.closestHit > 0
                    ? " late"
                    : this.closestHit < 0
                      ? " early"
                      : ""
            }`;

            if (this.closestCursorPosition) {
                const distanceToObject =
                    this.closestCursorPosition.getDistance(
                        this.object.getStackedPosition(Modes.droid),
                    ) - this.object.radius;

                if (distanceToObject > 0) {
                    closestHitText += `, ${
                        Number.isInteger(distanceToObject)
                            ? distanceToObject
                            : distanceToObject.toFixed(2)
                    } units off`;
                }
            }

            context.fillText(
                closestHitText,
                this.canvas.width -
                    textPadding -
                    context.measureText(closestHitText).width,
                985 - textPadding,
            );
        }

        context.restore();
    }

    /**
     * Initializes the playfield and translates the context
     * into the (0, 0) coordinate of the playfield.
     */
    private initPlayfield(): void {
        if (!this.canvas) {
            return;
        }

        // The playfield is 512x384. However, since we're drawing on a limited space,
        // we will have to scale the area and objects down.
        const scaledPlayfieldX = Playfield.baseSize.x * this.playfieldScale;
        const scaledPlayfieldY = Playfield.baseSize.y * this.playfieldScale;

        const context = this.canvas.getContext("2d");
        context.translate(
            // Put (0, 0) in the top-left corner of the playfield.
            (this.canvas.width - scaledPlayfieldX) / 2,
            (this.canvas.height - scaledPlayfieldY) / 2,
        );
        context.scale(this.playfieldScale, this.playfieldScale);
        context.lineWidth = 3;
        context.strokeRect(0, 0, Playfield.baseSize.x, Playfield.baseSize.y);
        context.lineWidth = 1;
        context.save();
    }

    /**
     * Draws all objects to the canvas.
     */
    private drawObjects(): void {
        for (let i = 0; i < this.previousObjects.length; ++i) {
            this.drawObject(
                this.previousObjects[i],
                this.previousObjectData[i].result,
                i + 1,
            );
        }

        this.drawObject(
            this.object,
            HitResult.miss,
            this.previousObjects.length + 1,
        );
    }

    /**
     * Draws an object to the canvas.
     *
     * @param object The object to draw.
     * @param objectHitResult The hit result of the object. This will determine the color of the object.
     * @param objectIndex The index of the object.
     */
    private drawObject(
        object: PlaceableHitObject,
        objectHitResult: HitResult,
        objectIndex: number,
    ): void {
        if (!this.canvas) {
            return;
        }

        // Only draw if the object is not a spinner.
        if (object instanceof Spinner) {
            return;
        }

        // Determine colors from hit result.
        let fillColor: string;
        let borderColor: string;
        let sliderPathColor: string;

        switch (objectHitResult) {
            case HitResult.great:
                fillColor = "#5b88d9";
                borderColor = "#5473ab";
                sliderPathColor = "#779de0";
                break;
            case HitResult.good:
                fillColor = "#63ba68";
                borderColor = "#59a85e";
                sliderPathColor = "#81eb89";
                break;
            case HitResult.meh:
                fillColor = "#d9ad6a";
                borderColor = "#cc9d56";
                sliderPathColor = "#d9a75d";
                break;
            case HitResult.miss:
                fillColor = "#de6464";
                borderColor = "#cc5c5c";
                sliderPathColor = "#eb7c7c";
                break;
        }

        const context = this.canvas.getContext("2d");

        const startPosition = object.getStackedPosition(Modes.droid);
        const { radius } = object;
        const circleBorder = radius / 8;
        const shadowBlur = radius / 16;

        if (object instanceof Slider) {
            // Draw the path first, then we can apply the slider head.
            context.shadowBlur = 0;
            context.strokeStyle = sliderPathColor;
            context.lineWidth = (radius - circleBorder) * 2;
            context.lineCap = "round";
            context.globalAlpha = 0.8;
            context.beginPath();

            for (const path of object.path.calculatedPath) {
                const drawPosition = startPosition.add(path);

                context.lineTo(drawPosition.x, drawPosition.y);
            }

            context.stroke();

            // Only draw path direction if the path is long enough.
            if (object.path.expectedDistance > 250) {
                context.strokeStyle = "#606060";
                context.globalAlpha = 0.5;
                context.lineWidth = radius * 0.15;
                context.stroke();
            }

            // Draw slider border.
            context.globalCompositeOperation = "source-over";
            context.shadowBlur = 0;
            context.strokeStyle = "#606060";
            context.globalAlpha = 0.4;
            context.lineWidth = radius * 2;
            context.stroke();
            context.closePath();

            // Draw slider ticks.
            context.globalAlpha = 0.8;
            context.strokeStyle = "#fff";
            context.lineWidth = radius / 32;

            for (const nestedObject of object.nestedHitObjects) {
                // Only draw for one span.
                if (nestedObject instanceof SliderRepeat) {
                    break;
                }

                if (!(nestedObject instanceof SliderTick)) {
                    continue;
                }

                const drawPosition = nestedObject.getStackedPosition(
                    Modes.droid,
                );

                context.beginPath();
                context.arc(
                    drawPosition.x,
                    drawPosition.y,
                    radius / 16,
                    0,
                    2 * Math.PI,
                );
                context.stroke();
                context.closePath();
            }
        }

        // Draw the circle first, then border.
        context.shadowBlur = 0;
        context.fillStyle = fillColor;
        context.globalAlpha = 0.9;
        context.beginPath();
        context.arc(
            startPosition.x,
            startPosition.y,
            radius - circleBorder / 2,
            0,
            2 * Math.PI,
        );
        context.fill();

        context.strokeStyle = borderColor;
        context.shadowBlur = shadowBlur;
        context.lineWidth = circleBorder;
        context.stroke();
        context.closePath();

        // Finally, draw the index of the object.
        context.fillStyle = "#000000";
        context.font = `bold ${Math.ceil(radius / 1.25)}px Exo`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(
            objectIndex.toString(),
            startPosition.x,
            startPosition.y,
        );
    }

    /**
     * Draws the hit error bar to the canvas.
     */
    private drawHitErrorBar(): void {
        if (!this.canvas || !this.hitWindow) {
            return;
        }

        const context = this.canvas.getContext("2d");
        const centerCoordinate = new Vector2(
            Playfield.baseSize.x / 2,
            Playfield.baseSize.y * 1.1,
        );

        context.globalAlpha = 1;
        context.lineWidth = Playfield.baseSize.y / 50;
        context.lineCap = "round";

        const calculateDrawDistance = (ms: number): number => {
            const maxDrawDistance = Playfield.baseSize.x / 1.25;
            // The highest hit window the player can achieve with mods.
            const maxMs = new DroidHitWindow(0).mehWindow;

            return (ms / maxMs) * maxDrawDistance;
        };

        const drawBar = (
            ms: number,
            hitResult: Exclude<HitResult, HitResult.miss>,
        ): void => {
            const drawDistance = calculateDrawDistance(ms);

            context.strokeStyle = `rgb(${this.hitColors[hitResult]})`;
            context.beginPath();
            context.moveTo(
                centerCoordinate.x - drawDistance,
                centerCoordinate.y,
            );
            context.lineTo(
                centerCoordinate.x + drawDistance,
                centerCoordinate.y,
            );
            context.stroke();
            context.closePath();
        };

        // Draw from hit 50 -> hit 100 -> hit 300 range.
        drawBar(this.hitWindow.mehWindow, HitResult.meh);
        drawBar(this.hitWindow.okWindow, HitResult.good);
        drawBar(this.hitWindow.greatWindow, HitResult.great);

        // Draw middle line.
        context.lineWidth = Playfield.baseSize.x / 100;
        context.strokeStyle = "#aaaaaa";
        context.beginPath();
        context.moveTo(
            centerCoordinate.x,
            centerCoordinate.y - Playfield.baseSize.y / 20,
        );
        context.lineTo(
            centerCoordinate.x,
            centerCoordinate.y + Playfield.baseSize.y / 20,
        );
        context.stroke();
        context.closePath();

        // Draw hit results.
        context.lineWidth = Playfield.baseSize.x / 125;

        for (let i = 0; i < this.previousObjectData.length; ++i) {
            const prevObject = this.previousObjects[i];
            const objectData = this.previousObjectData[i];

            if (objectData.result === HitResult.miss) {
                continue;
            }

            if (prevObject instanceof Spinner) {
                continue;
            }

            // Check for slider head break.
            if (
                prevObject instanceof Slider &&
                objectData.accuracy ===
                    Math.floor(this.hitWindow.mehWindow) + 13
            ) {
                continue;
            }

            const distanceFromCenter = calculateDrawDistance(
                objectData.accuracy,
            );

            context.globalAlpha = NumberHelper.clamp(
                1 -
                    Math.pow(
                        (this.object.startTime - prevObject.startTime) /
                            this.object.timePreempt,
                        2,
                    ),
                0.15,
                1,
            );
            context.strokeStyle = `rgb(${this.hitColors[objectData.result]})`;
            context.beginPath();
            context.moveTo(
                centerCoordinate.x + distanceFromCenter,
                centerCoordinate.y - Playfield.baseSize.y / 30,
            );
            context.lineTo(
                centerCoordinate.x + distanceFromCenter,
                centerCoordinate.y + Playfield.baseSize.y / 30,
            );
            context.stroke();
            context.closePath();
        }
    }

    /**
     * Draws cursor groups.
     */
    private drawCursorGroups(): void {
        if (
            !this.canvas ||
            !this.hitWindow ||
            this.cursorGroups.length === 0 ||
            this.object instanceof Spinner
        ) {
            return;
        }

        const context = this.canvas.getContext("2d");

        const minTime = this.object.startTime - this.object.timePreempt;
        const maxTime = this.object.endTime + 200;

        // Draw direction arrow every 50 pixels the cursor has travelled.
        const arrowDistanceRate = 50;

        const defaultColor = "#cc00cc";
        const defaultArrowColor = "#990099";
        const mehColor = "#e69417";
        const mehArrowColor = "#e6a645";
        const goodColor = "#44b02e";
        const goodArrowColor = "#53d439";
        const greatColor = "#6bbbdb";
        const greatArrowColor = "#78c1de";

        const applyHitColor = (hitTime: number): void => {
            const hitAccuracy = hitTime - this.object.startTime;
            const { hitWindow } =
                this.object instanceof Slider ? this.object.head : this.object;

            if (!hitWindow) {
                return;
            }

            switch (true) {
                case hitAccuracy <= hitWindow.greatWindow:
                    context.fillStyle = greatColor;
                    context.strokeStyle = greatColor;
                    break;
                case hitAccuracy <= hitWindow.okWindow:
                    context.fillStyle = goodColor;
                    context.strokeStyle = goodColor;
                    break;
                case hitAccuracy <= hitWindow.mehWindow:
                    context.fillStyle = mehColor;
                    context.strokeStyle = mehColor;
                    break;
                default:
                    context.fillStyle = defaultColor;
                    context.strokeStyle = defaultColor;
            }
        };

        context.fillStyle = defaultColor;
        context.strokeStyle = defaultColor;
        context.lineWidth = 2.5;
        context.lineCap = "round";
        context.globalAlpha = 1;

        for (let i = 0; i < this.cursorGroups.length; ++i) {
            for (const { allOccurrences } of this.cursorGroups[i]) {
                let travelDistance = 0;

                for (let j = 0; j < allOccurrences.length; ++j) {
                    const occurrence = allOccurrences[j];

                    if (occurrence.time < minTime) {
                        continue;
                    }

                    if (
                        occurrence.time > maxTime ||
                        occurrence.id === MovementType.up
                    ) {
                        break;
                    }

                    const drawPosition = this.flipVectorVertically(
                        occurrence.position,
                    );

                    if (occurrence.id === MovementType.down) {
                        applyHitColor(occurrence.time);

                        context.beginPath();
                        context.moveTo(drawPosition.x, drawPosition.y);
                        context.arc(
                            drawPosition.x,
                            drawPosition.y,
                            5,
                            0,
                            2 * Math.PI,
                        );
                        context.fill();
                        context.closePath();
                    } else {
                        const prevOccurrence = allOccurrences[j - 1];
                        const previousDrawPosition = this.flipVectorVertically(
                            prevOccurrence.position,
                        );

                        travelDistance += occurrence.position.getDistance(
                            prevOccurrence.position,
                        );

                        applyHitColor(prevOccurrence.time);

                        context.beginPath();
                        context.moveTo(
                            previousDrawPosition.x,
                            previousDrawPosition.y,
                        );
                        context.lineTo(drawPosition.x, drawPosition.y);
                        context.stroke();
                        context.closePath();

                        // Check for presses between both occurrences.
                        for (let k = 0; k < this.cursorGroups.length; ++k) {
                            // Do not check the current cursor instance in loop.
                            if (k === i) {
                                continue;
                            }

                            for (const cursorGroup of this.cursorGroups[k]) {
                                const cursorDownTime = cursorGroup.down.time;

                                if (cursorDownTime < prevOccurrence.time) {
                                    continue;
                                }

                                if (cursorDownTime > occurrence.time) {
                                    break;
                                }

                                const t =
                                    (cursorDownTime - prevOccurrence.time) /
                                    (occurrence.time - prevOccurrence.time);

                                const cursorPosition = Interpolation.lerp(
                                    prevOccurrence.position,
                                    occurrence.position,
                                    t,
                                );

                                const cursorDrawPosition =
                                    this.flipVectorVertically(cursorPosition);

                                applyHitColor(cursorDownTime);

                                context.beginPath();
                                context.lineWidth = 2;
                                context.arc(
                                    cursorDrawPosition.x,
                                    cursorDrawPosition.y,
                                    5,
                                    0,
                                    2 * Math.PI,
                                );
                                context.stroke();
                                context.closePath();
                                context.lineWidth = 2.5;
                            }
                        }

                        if (travelDistance >= arrowDistanceRate) {
                            // Draw direction arrow.
                            const displacement = occurrence.position.subtract(
                                prevOccurrence.position,
                            );
                            const drawDisplacement =
                                drawPosition.subtract(previousDrawPosition);
                            const angle = Math.atan2(
                                drawDisplacement.y,
                                drawDisplacement.x,
                            );

                            const prevDistanceTravelled =
                                travelDistance - displacement.length;

                            for (
                                let distance = arrowDistanceRate;
                                distance <= travelDistance;
                                distance += arrowDistanceRate
                            ) {
                                const t =
                                    (distance - prevDistanceTravelled) /
                                    (travelDistance - prevDistanceTravelled);

                                const cursorTime = Interpolation.lerp(
                                    prevOccurrence.time,
                                    occurrence.time,
                                    t,
                                );
                                const timeOffset =
                                    cursorTime - this.object.startTime;
                                // Don't draw direction arrow if cursor time is close to object hit time.
                                if (Math.abs(timeOffset) <= 50) {
                                    continue;
                                }

                                const cursorDrawPosition =
                                    this.flipVectorVertically(
                                        new Vector2(
                                            Interpolation.lerp(
                                                prevOccurrence.position.x,
                                                occurrence.position.x,
                                                t,
                                            ),
                                            Interpolation.lerp(
                                                prevOccurrence.position.y,
                                                occurrence.position.y,
                                                t,
                                            ),
                                        ),
                                    );
                                const headLength = 10;

                                switch (true) {
                                    case timeOffset <=
                                        this.hitWindow.greatWindow:
                                        context.strokeStyle = greatArrowColor;
                                        break;
                                    case timeOffset <= this.hitWindow.okWindow:
                                        context.strokeStyle = goodArrowColor;
                                        break;
                                    case timeOffset <= this.hitWindow.mehWindow:
                                        context.strokeStyle = mehArrowColor;
                                        break;
                                    default:
                                        context.strokeStyle = defaultArrowColor;
                                }

                                context.beginPath();
                                context.moveTo(
                                    cursorDrawPosition.x,
                                    cursorDrawPosition.y,
                                );
                                context.lineTo(
                                    cursorDrawPosition.x -
                                        headLength *
                                            Math.cos(angle - Math.PI / 6),
                                    cursorDrawPosition.y -
                                        headLength *
                                            Math.sin(angle - Math.PI / 6),
                                );
                                context.moveTo(
                                    cursorDrawPosition.x,
                                    cursorDrawPosition.y,
                                );
                                context.lineTo(
                                    cursorDrawPosition.x -
                                        headLength *
                                            Math.cos(angle + Math.PI / 6),
                                    cursorDrawPosition.y -
                                        headLength *
                                            Math.sin(angle + Math.PI / 6),
                                );
                                context.stroke();
                                context.closePath();
                            }

                            travelDistance %= arrowDistanceRate;
                        }
                    }
                }
            }
        }
    }

    /**
     * Draws the closest cursor position to the object.
     */
    private drawClosestCursorPosition(): void {
        if (!this.canvas || !this.closestCursorPosition) {
            return;
        }

        const context = this.canvas.getContext("2d");

        const drawPosition = this.flipVectorVertically(
            this.closestCursorPosition,
        );

        const gradient = context.createRadialGradient(
            drawPosition.x,
            drawPosition.y,
            0,
            drawPosition.x,
            drawPosition.y,
            10,
        );

        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(1, "#9e3fe8");

        context.fillStyle = gradient;
        context.globalAlpha = 1;
        context.beginPath();
        context.arc(drawPosition.x, drawPosition.y, 10, 0, 2 * Math.PI);
        context.fill();
        context.closePath();
    }

    /**
     * Flips a vector vertically with respect to the osu! playfield size.
     *
     * @param vec The vector to flip.
     * @returns The flipped vector.
     */
    private flipVectorVertically(vec: Vector2): Vector2 {
        return this.drawCursorFlipped
            ? new Vector2(vec.x, Playfield.baseSize.y - vec.y)
            : vec;
    }
}
