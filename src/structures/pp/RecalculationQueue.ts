import { CommandInteraction } from "discord.js";

/**
 * Represents a recalculation queue entry.
 */
export interface RecalculationQueue {
    /**
     * The interaction that triggered the recalculation.
     */
    readonly interaction: CommandInteraction;

    /**
     * The rework type of the prototype.
     */
    readonly reworkType: string;

    /**
     * Whether to notify the user when the recalculation is complete.
     */
    readonly notifyOnComplete: boolean;
}
