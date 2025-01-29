/**
 * Represents an osu!droid player.
 */
export interface OfficialDatabaseUser {
    readonly id: number;
    readonly username: string;
    readonly password: string;
    readonly email: string;
    readonly deviceid: string;
    readonly score: number;
    readonly pp: number;
    readonly playcount: number;
    readonly accuracy: number;
    readonly regist_time: Date;
    readonly last_login_time: Date;
    readonly regist_ip: string;
    readonly region: string;
    readonly active: number;
    readonly supporter: number;
    readonly banned: number;
    readonly restrict_mode: number;
    readonly archived: number;
}
