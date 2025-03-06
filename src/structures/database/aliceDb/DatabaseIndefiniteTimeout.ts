import { Snowflake } from "discord.js";
import { BaseDocument } from "../BaseDocument";

/**
 * Represents a user that was timeouted indefinitely and left the server.
 */
export interface DatabaseIndefiniteTimeout extends BaseDocument {
    /**
     * The ID of the user.
     */
    id: Snowflake;
}
