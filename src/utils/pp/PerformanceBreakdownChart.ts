import { PerformanceAttributes } from "@structures/difficultyattributes/PerformanceAttributes";
import { Canvas, createCanvas } from "canvas";
import { PerformanceBreakdownAttribute } from "./PerformanceBreakdownAttribute";
import { MathUtils, Precision } from "@rian8337/osu-base";

/**
 * Displays a breakdown by comparing performance to a perfect play.
 */
export abstract class PerformanceBreakdownChart<
    TAttributes extends PerformanceAttributes,
> {
    private static readonly accentColor = "#6affda";
    private static readonly trackColor = "rgba(255, 255, 255, 0.15)";
    private static readonly titleHeight = 56;
    private static readonly totalHeight = 90;
    private static readonly rowHeight = 46;
    private static readonly margin = 30;
    private static readonly labelColumnWidth = 120;
    private static readonly percentageColumnWidth = 90;

    private readonly canvas: Canvas;
    private readonly displayedAttributes: readonly PerformanceBreakdownAttribute[];

    private get ctx() {
        return this.canvas.getContext("2d");
    }

    private buffer?: Buffer;

    constructor(
        /**
         * Actual performance attributes of the play.
         */
        protected readonly attributes: TAttributes,

        /**
         * Perfect performance attributes of the play.
         */
        protected readonly perfectAttributes: TAttributes,
    ) {
        // Don't display an attribute if its perfect value is 0.
        // For example, flashlight bonus would be zero if the Flashlight mod isn't used.
        this.displayedAttributes = this.createAttributes().filter(
            (attribute) => !Precision.almostEquals(attribute.perfectValue, 0),
        );

        this.canvas = createCanvas(
            660,
            PerformanceBreakdownChart.titleHeight +
                PerformanceBreakdownChart.totalHeight +
                PerformanceBreakdownChart.rowHeight *
                    this.displayedAttributes.length,
        );
    }

    /**
     * Generates the performance breakdown chart as a buffer.
     */
    generate(): Buffer {
        if (this.buffer) {
            return this.buffer;
        }

        this.drawBackground();
        this.drawTitle();
        this.drawAttributes();
        this.drawTotal();

        this.buffer = this.canvas.toBuffer("image/png");

        return this.buffer;
    }

    private drawBackground() {
        const { ctx } = this;

        ctx.save();

        ctx.fillStyle = "#424242";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.restore();
    }

    private drawTitle() {
        const { ctx } = this;
        const { margin, accentColor, titleHeight } = PerformanceBreakdownChart;

        ctx.save();

        ctx.font = "20px bold Torus";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        const title = "Performance Breakdown";
        const titleY = titleHeight / 2;

        ctx.fillText(title, margin, titleY);

        const titleWidth = ctx.measureText(title).width;

        ctx.fillStyle = accentColor;
        ctx.fillRect(margin, titleY + 13, titleWidth, 3);

        ctx.restore();
    }

    private drawAttributes() {
        const { ctx } = this;

        const {
            margin,
            accentColor,
            trackColor,
            titleHeight,
            totalHeight,
            rowHeight,
            labelColumnWidth,
            percentageColumnWidth,
        } = PerformanceBreakdownChart;

        const barsBlockTop = titleHeight + totalHeight;
        const barThickness = 12;
        const trackStartX = margin + labelColumnWidth;
        const trackEndX = this.canvas.width - margin - percentageColumnWidth;
        const trackWidth = trackEndX - trackStartX;

        ctx.save();

        ctx.textBaseline = "middle";

        this.displayedAttributes.forEach((attribute, i) => {
            const rowCenterY = barsBlockTop + i * rowHeight + rowHeight / 2;

            ctx.font = "15px bold Torus";
            ctx.fillStyle = "#dddddd";
            ctx.textAlign = "left";
            ctx.fillText(attribute.name, margin, rowCenterY);

            const barY = rowCenterY - barThickness / 2;

            ctx.fillStyle = trackColor;
            ctx.beginPath();
            ctx.roundRect(
                trackStartX,
                barY,
                trackWidth,
                barThickness,
                barThickness / 2,
            );
            ctx.fill();

            const ratio =
                attribute.perfectValue > 0
                    ? MathUtils.clamp(
                          attribute.value / attribute.perfectValue,
                          0,
                          1,
                      )
                    : 1;

            if (ratio > 0) {
                ctx.fillStyle = accentColor;
                ctx.beginPath();
                ctx.roundRect(
                    trackStartX,
                    barY,
                    trackWidth * ratio,
                    barThickness,
                    barThickness / 2,
                );
                ctx.fill();
            }

            ctx.font = "16px bold Torus";
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "right";
            ctx.fillText(
                `${Math.round(ratio * 100).toString()}%`,
                this.canvas.width - margin,
                rowCenterY,
            );
        });

        ctx.restore();
    }

    private drawTotal() {
        const { ctx } = this;
        const { margin, accentColor, titleHeight } = PerformanceBreakdownChart;

        const bandTop = titleHeight;
        const labelY = bandTop + 26;
        const valueY = bandTop + 62;

        ctx.save();

        ctx.textBaseline = "middle";

        ctx.font = "15px bold Torus";
        ctx.fillStyle = accentColor;
        ctx.textAlign = "left";
        ctx.fillText("Achieved PP", margin, labelY);

        ctx.font = "32px bold Torus";
        ctx.fillText(
            Math.round(this.attributes.total).toString(),
            margin,
            valueY,
        );

        const valueX = this.canvas.width - margin;

        ctx.font = "15px bold Torus";
        ctx.fillStyle = "#aaaaaa";
        ctx.textAlign = "right";
        ctx.fillText("Maximum", valueX, labelY);

        ctx.font = "32px bold Torus";
        ctx.fillStyle = "#dddddd";
        ctx.fillText(
            Math.round(this.perfectAttributes.total).toString(),
            valueX,
            valueY,
        );

        ctx.restore();
    }

    /**
     * Creates attributes to be displayed in the performance breakdown chart.
     */
    protected abstract createAttributes(): readonly PerformanceBreakdownAttribute[];
}
