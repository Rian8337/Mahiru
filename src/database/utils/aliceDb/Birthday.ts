import { DatabaseManager } from "@database/DatabaseManager";
import { DatabaseBirthday } from "structures/database/aliceDb/DatabaseBirthday";
import { OperationResult } from "structures/core/OperationResult";
import { Manager } from "@utils/base/Manager";
import { ObjectId } from "mongodb";
import { Snowflake } from "discord.js";
import { Language } from "@localization/base/Language";

/**
 * Represents an information about a Discord user's birthday.
 */
export class Birthday extends Manager implements DatabaseBirthday {
    discordid: Snowflake;
    date: number;
    month: number;
    timezone: number;
    isLeapYear: boolean;
    readonly _id?: ObjectId;

    constructor(
        data: DatabaseBirthday = DatabaseManager.aliceDb?.collections.birthday
            .defaultDocument ?? {},
    ) {
        super();

        this._id = data._id;
        this.discordid = data.discordid;
        this.date = data.date;
        this.month = data.month;
        this.timezone = data.timezone;
        this.isLeapYear = data.isLeapYear;
    }

    /**
     * Forcefully sets the birthday of this user.
     *
     * @param date The new birthday date.
     * @param month The new birthday month.
     * @param timezone The new timezone of the user.
     * @param language The locale of the user who attempted to set the birthday of this user. Defaults to English.
     * @returns An object containing information about the operation.
     */
    forceSetBirthday(
        date: number,
        month: number,
        timezone?: number,
        language: Language = "en",
    ): Promise<OperationResult> {
        this.date = date;
        this.month = month;
        this.timezone = timezone ?? this.timezone;

        return DatabaseManager.aliceDb.collections.birthday.setUserBirthday(
            this.discordid,
            this.date,
            this.month,
            this.timezone,
            language,
            true,
        );
    }
}
