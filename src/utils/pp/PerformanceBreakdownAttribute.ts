/**
 * Represents an attribute to be displayed in a performance breakdown chart.
 */
export class PerformanceBreakdownAttribute {
    constructor(
        /**
         * The name of the attribute.
         */
        readonly name: string,

        /**
         * The value of the attribute.
         */
        readonly value: number,

        /**
         * The perfect value of the attribute.
         */
        readonly perfectValue: number,
    ) {}
}
