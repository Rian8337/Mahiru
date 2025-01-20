/**
 * Represents a recalculation queue entry.
 */
export interface RecalculationQueue {
    /**
     * The uid of the player.
     */
    readonly uid: number;

    /**
     * The rework type of the prototype.
     */
    readonly reworkType: string;
}
