import { BaseDocument } from "../BaseDocument";

/**
 * Represents an osu!droid name change request.
 */
export interface DatabaseNameChange extends BaseDocument {
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
