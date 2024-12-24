import {
    Beatmap,
    BeatmapDifficulty,
    DroidHitWindow,
    HitWindow,
    Mod,
    Modes,
    ModPrecise,
    ModUtil,
    PreciseDroidHitWindow,
    RGBColor,
    Slider,
    Spinner,
} from "@rian8337/osu-base";
import {
    HitResult,
    ReplayObjectData,
} from "@rian8337/osu-droid-replay-analyzer";
import { Canvas, createCanvas } from "canvas";

/**
 * A timing distribution chart.
 */
export class TimingDistributionChart {
    /**
     * The beatmap.
     */
    private readonly beatmap: Beatmap;

    /**
     * The hit object data to draw.
     */
    private readonly hitObjectData: ReplayObjectData[];

    /**
     * The hit window.
     */
    private readonly hitWindow: HitWindow;

    private canvas?: Canvas;
    private chartBarInterval = 0;
    private maxFrequency = 1;

    private readonly barOffset = 2.5;
    private readonly barWidth = 5;
    private readonly barHeight = 150;
    private readonly oneSideBarCount = 50;

    private readonly hitWindow300Color = new RGBColor(102, 204, 255);
    private readonly hitWindow100Color = new RGBColor(179, 217, 68);
    private readonly hitWindow50Color = new RGBColor(255, 204, 34);

    /**
     * @param beatmap The beatmap that was played.
     * @param mods The mods that was used.
     * @param hitObjectData The hit object data from replay.
     */
    constructor(
        beatmap: Beatmap,
        mods: Mod[],
        hitObjectData: ReplayObjectData[],
    ) {
        this.beatmap = beatmap;
        this.hitObjectData = hitObjectData;

        const difficulty = new BeatmapDifficulty();
        difficulty.od = beatmap.difficulty.od;

        ModUtil.applyModsToBeatmapDifficulty(difficulty, Modes.droid, mods);

        this.hitWindow = mods.some((m) => m instanceof ModPrecise)
            ? new PreciseDroidHitWindow(difficulty.od)
            : new DroidHitWindow(difficulty.od);
    }

    /**
     * Generates the chart.
     *
     * @returns The canvas used to draw the chart.
     */
    generate(): Buffer {
        if (this.canvas) {
            return this.canvas.toBuffer();
        }

        this.canvas = createCanvas(800, 220);

        this.initBackground();
        this.drawTitleText();
        this.drawChartBars();
        this.drawOffsetBarText();

        return this.canvas.toBuffer();
    }

    /**
     * Initializes the background of the canvas.
     */
    private initBackground(): void {
        if (!this.canvas) {
            return;
        }

        const context = this.canvas.getContext("2d");

        context.save();

        context.fillStyle = "#424242";
        context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        context.restore();
    }

    /**
     * Initializes chart bars.
     */
    private drawChartBars(): void {
        if (!this.canvas) {
            return;
        }

        const { greatWindow, okWindow, mehWindow } = this.hitWindow;

        const hitValues: Record<number, number> = {};
        let maxAccuracy = 0;

        for (let i = 0; i < this.hitObjectData.length; ++i) {
            const object = this.beatmap.hitObjects.objects[i];
            const objectData = this.hitObjectData[i];

            if (objectData.result === HitResult.miss) {
                continue;
            }

            if (object instanceof Spinner) {
                continue;
            }

            if (
                object instanceof Slider &&
                !(
                    -mehWindow > objectData.accuracy ||
                    objectData.accuracy > Math.min(mehWindow, object.duration)
                )
            ) {
                continue;
            }

            const accuracy = Math.trunc(objectData.accuracy);

            hitValues[accuracy] ??= 0;
            ++hitValues[accuracy];

            maxAccuracy = Math.max(Math.abs(accuracy), maxAccuracy);
        }

        this.chartBarInterval = Math.max(
            1,
            Math.ceil(maxAccuracy / this.oneSideBarCount),
        );

        // Start from the left.
        const frequencies: number[] = [];
        for (let i = -this.oneSideBarCount; i <= this.oneSideBarCount; ++i) {
            let frequency = 0;

            for (
                let j = i * this.chartBarInterval;
                j < this.chartBarInterval * (i + 1);
                ++j
            ) {
                if (!hitValues[j]) {
                    continue;
                }

                frequency += hitValues[j];
            }

            frequencies.push(frequency);
        }

        this.maxFrequency = Math.max(1, ...frequencies);

        // Now we draw from the left to right.
        for (let i = -this.oneSideBarCount; i <= this.oneSideBarCount; ++i) {
            const frequency = frequencies[i + this.oneSideBarCount];

            this.drawOffsetBar(
                frequency,
                i,
                this.getHitResultColor(i * this.chartBarInterval),
            );
        }

        // Draw hit boundary bars.
        this.drawBoundaryBar(
            greatWindow,
            Math.floor(greatWindow / this.chartBarInterval),
            this.hitWindow300Color,
        );

        this.drawBoundaryBar(
            okWindow,
            Math.floor(okWindow / this.chartBarInterval),
            this.hitWindow100Color,
        );

        this.drawBoundaryBar(
            mehWindow,
            Math.floor(mehWindow / this.chartBarInterval),
            this.hitWindow50Color,
        );
    }

    /**
     * Draws an offset bar.
     *
     * @param frequency The frequency of the bar.
     * @param positionIndex The postiion index of the bar.
     * @param color The color of the bar.
     */
    private drawOffsetBar(
        frequency: number,
        positionIndex: number,
        color: RGBColor,
    ): void {
        if (!this.canvas) {
            return;
        }

        const context = this.canvas.getContext("2d");
        const barXPosition =
            this.canvas.width / 2 +
            (this.barWidth + this.barOffset) * positionIndex;
        const barYPosition = this.canvas.height - 20;

        context.save();
        context.lineCap = "round";

        context.beginPath();

        if (frequency > 0) {
            context.lineWidth = this.barWidth;
            context.strokeStyle = `rgb(${color})`;

            context.moveTo(barXPosition, barYPosition);
            context.lineTo(
                barXPosition,
                barYPosition - (this.barHeight * frequency) / this.maxFrequency,
            );
        } else if (positionIndex !== 0) {
            context.lineWidth = this.barWidth / 2;
            context.strokeStyle = "#bbbbbb";

            context.moveTo(barXPosition - this.barOffset / 2, barYPosition);
            context.lineTo(barXPosition + this.barOffset / 2, barYPosition);
        }

        context.stroke();
        context.closePath();

        if (positionIndex === 0) {
            // Middle point, draw middle bar
            context.strokeStyle = "#ffffff";

            context.beginPath();

            context.moveTo(barXPosition, barYPosition);
            context.lineTo(
                barXPosition,
                barYPosition -
                    (this.barHeight * (frequency || this.maxFrequency)) /
                        this.maxFrequency /
                        2,
            );

            context.stroke();
            context.closePath();
        }

        context.restore();
    }

    /**
     * Draws a hit boundary bar.
     *
     * @param offset The offset of the boundary bar.
     * @param positionIndex The index of the boundary bar.
     * @param color The color of the boundary bar.
     */
    private drawBoundaryBar(
        offset: number,
        positionIndex: number,
        color: RGBColor,
    ) {
        if (!this.canvas) {
            return;
        }

        const context = this.canvas.getContext("2d");
        const barYPosition = this.canvas.height - 20;

        // We will draw 2 bars. The first bar is for the positive boundary, the second bar is for the negative boundary.
        const negativeBarXPosition =
            this.canvas.width / 2 -
            (this.barWidth + this.barOffset) * positionIndex -
            this.barOffset * 1.5;

        const positiveBarXPosition =
            this.canvas.width / 2 +
            (this.barWidth + this.barOffset) * positionIndex +
            this.barOffset * 1.5;

        // If the bars are out of the canvas, we don't draw them.
        if (
            negativeBarXPosition < 0 ||
            positiveBarXPosition > this.canvas.width
        ) {
            return;
        }

        context.save();
        context.lineCap = "round";

        // Make boundary bar width less than normal bar offset.
        context.lineWidth = this.barOffset / 2;
        context.strokeStyle = `rgb(${color})`;

        // Make boundary bars dashed.
        const dashOffset = this.barHeight / 20;
        context.setLineDash([dashOffset, dashOffset]);

        // Draw first bar.
        context.beginPath();
        context.moveTo(negativeBarXPosition, barYPosition);
        context.lineTo(negativeBarXPosition, barYPosition - this.barHeight);
        context.stroke();
        context.closePath();

        // Draw second bar.
        context.beginPath();
        context.moveTo(positiveBarXPosition, barYPosition);
        context.lineTo(positiveBarXPosition, barYPosition - this.barHeight);
        context.stroke();
        context.closePath();

        context.restore();
        context.setLineDash([]);

        // Draw offset text.
        context.save();

        context.font = "10px bold Exo";
        context.fillStyle = "#ffffff";
        context.textAlign = "center";
        context.textBaseline = "middle";

        context.fillText(
            "-" + Math.trunc(offset).toString(),
            negativeBarXPosition,
            barYPosition - this.barHeight - 10,
        );

        context.fillText(
            "+" + Math.trunc(offset).toString(),
            positiveBarXPosition,
            barYPosition - this.barHeight - 10,
        );

        context.restore();
    }

    /**
     * Draws the title text.
     */
    private drawTitleText(): void {
        if (!this.canvas) {
            return;
        }

        const context = this.canvas.getContext("2d");

        context.save();

        context.font = "14px bold Exo";
        context.fillStyle = "#ffffff";
        context.textAlign = "center";
        context.textBaseline = "middle";

        context.fillText("Timing Distribution", this.canvas.width / 2, 15);

        context.restore();
    }

    /**
     * Draws texts under offset bars.
     */
    private drawOffsetBarText(): void {
        if (!this.canvas) {
            return;
        }

        const context = this.canvas.getContext("2d");
        const textYPosition = this.canvas.height - 10;

        context.save();

        context.font = "10px bold Exo";
        context.fillStyle = "#ffffff";
        context.textAlign = "center";
        context.textBaseline = "middle";

        for (
            let i = -this.oneSideBarCount;
            i <= this.oneSideBarCount;
            i += 10
        ) {
            const textXPosition =
                this.canvas.width / 2 + (this.barWidth + this.barOffset) * i;
            const offset = this.chartBarInterval * i;
            let text = "";

            if (offset > 0) {
                text += "+";
            }

            text += offset;

            context.fillText(text, textXPosition, textYPosition);
        }

        context.restore();
    }

    private getHitResultColor(time: number): RGBColor {
        time = Math.abs(time);

        switch (true) {
            case time <= this.hitWindow.greatWindow:
                return this.hitWindow300Color;
            case time <= this.hitWindow.okWindow:
                return this.hitWindow100Color;
            default:
                return this.hitWindow50Color;
        }
    }
}
