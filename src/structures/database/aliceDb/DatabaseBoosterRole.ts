import { Snowflake } from "discord.js";
import { BaseDocument } from "../BaseDocument";

/**
 * Represents a booster role in the database.
 */
export interface DatabaseBoosterRole extends BaseDocument {
    /**
     * The Discord ID of the user who has the booster role.
     */
    discordId: Snowflake;

    /**
     * The Discord ID of the booster role.
     */
    roleId: Snowflake;
}
