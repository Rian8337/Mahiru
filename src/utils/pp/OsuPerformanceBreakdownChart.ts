import { OsuPerformanceAttributes } from "@structures/difficultyattributes/OsuPerformanceAttributes";
import { PerformanceBreakdownChart } from "./PerformanceBreakdownChart";
import { PerformanceBreakdownAttribute } from "./PerformanceBreakdownAttribute";

/**
 * Displays a breakdown by comparing performance to a perfect play for osu!droid.
 */
export class OsuPerformanceBreakdownChart extends PerformanceBreakdownChart<OsuPerformanceAttributes> {
    protected override createAttributes(): readonly PerformanceBreakdownAttribute[] {
        return [
            new PerformanceBreakdownAttribute(
                "Aim",
                this.attributes.aim,
                this.perfectAttributes.aim,
            ),
            new PerformanceBreakdownAttribute(
                "Speed",
                this.attributes.speed,
                this.perfectAttributes.speed,
            ),
            new PerformanceBreakdownAttribute(
                "Accuracy",
                this.attributes.accuracy,
                this.perfectAttributes.accuracy,
            ),
            new PerformanceBreakdownAttribute(
                "Flashlight",
                this.attributes.flashlight,
                this.perfectAttributes.flashlight,
            ),
            new PerformanceBreakdownAttribute(
                "Reading",
                this.attributes.reading,
                this.perfectAttributes.reading,
            ),
        ];
    }
}
