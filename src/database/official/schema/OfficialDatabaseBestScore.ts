import { OfficialDatabaseScore } from "./OfficialDatabaseScore";

export interface OfficialDatabaseBestScore extends OfficialDatabaseScore {
    readonly pp: number;
    readonly pp_multiplier: number;
}
