/**
 * A structure containing information about a performance calculation result.
 */
export interface PerformanceAttributes {
    /**
     * Calculated score performance points.
     */
    total: number;

    /**
     * The aim performance points.
     */
    aim: number;

    /**
     * The accuracy performance points.
     */
    accuracy: number;

    /**
     * The flashlight performance points.
     */
    flashlight: number;

    /**
     * The reading performance points.
     */
    reading: number;
}
