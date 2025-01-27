import { Snowflake } from "discord.js";
import { BaseDocument } from "../BaseDocument";

/**
 * Represents an osu!droid name change request.
 */
export interface DatabaseNameChange extends BaseDocument {
    /**
     * The Discord ID of the user who requested the name change.
     */
    discordid: Snowflake;

    /**
     * The UID of the osu!droid account.
     */
    uid: number;

    /**
     * The epoch time at which the Discord user can request
     * another name change, in seconds.
     */
    cooldown: number;

    /**
     * The usernames that the osu!droid account has had in the past.
     */
    previous_usernames: string[];
}
