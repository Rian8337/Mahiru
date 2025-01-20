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
     * The uid of the player.
     */
    readonly uid: number;

    /**
     * The rework type of the prototype.
     */
    readonly reworkType: string;
}
