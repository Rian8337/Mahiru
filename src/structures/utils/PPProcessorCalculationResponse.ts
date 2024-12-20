import { If } from "@rian8337/osu-base";

/**
 * Represents a response of calculation requests to the pp processor.
 */
export interface PPProcessorCalculationResponse<
    TAttr,
    THasStrainChart extends boolean = boolean,
> {
    /**
     * The calculation attributes.
     */
    readonly attributes: TAttr;

    /**
     * The strain chart in binary data, if any.
     */
    readonly strainChart: If<THasStrainChart, number[]>;
}
