import { Localization } from "@localization/base/Localization";
import { Translations } from "@localization/base/Translations";
import { TimeoutManagerENTranslation } from "./translations/TimeoutManagerENTranslation";
import { TimeoutManagerESTranslation } from "./translations/TimeoutManagerESTranslation";
import { TimeoutManagerKRTranslation } from "./translations/TimeoutManagerKRTranslation";

export interface TimeoutManagerStrings {
    readonly userAlreadyTimeouted: string;
    readonly userImmuneToTimeout: string;
    readonly invalidTimeoutDuration: string;
    readonly timeoutDurationOutOfRange: string;
    readonly notEnoughPermissionToTimeout: string;
    readonly permanentTimeoutRoleNotFound: string;
    readonly timeoutReasonTooLong: string;
    readonly timeoutExecuted: string;
    readonly untimeoutExecuted: string;
    readonly inChannel: string;
    readonly reason: string;
    readonly userId: string; // see 30.34
    readonly channelId: string;
    readonly timeoutUserNotification: string;
    readonly userNotTimeouted: string;
    readonly untimeoutReasonTooLong: string;
    readonly untimeoutUserNotification: string;
}

/**
 * Localizations for the `TimeoutManager` manager utility.
 */
export class TimeoutManagerLocalization extends Localization<TimeoutManagerStrings> {
    protected override readonly localizations: Readonly<
        Translations<TimeoutManagerStrings>
    > = {
        en: new TimeoutManagerENTranslation(),
        kr: new TimeoutManagerKRTranslation(),
        es: new TimeoutManagerESTranslation(),
    };
}
