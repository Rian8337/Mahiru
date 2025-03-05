import { Localization } from "@localization/base/Localization";
import { Translations } from "@localization/base/Translations";
import { TimeoutENTranslation } from "./translations/TimeoutENTranslation";
import { TimeoutESTranslation } from "./translations/TimeoutESTranslation";
import { TimeoutKRTranslation } from "./translations/TimeoutKRTranslation";

export interface TimeoutStrings {
    readonly userToTimeoutNotFound: string;
    readonly indefiniteTimeout: string;
    readonly timeoutFailed: string;
    readonly timeoutSuccess: string;
}

/**
 * Localizations for the `timeout` command.
 */
export class TimeoutLocalization extends Localization<TimeoutStrings> {
    protected override readonly localizations: Readonly<
        Translations<TimeoutStrings>
    > = {
        en: new TimeoutENTranslation(),
        kr: new TimeoutKRTranslation(),
        es: new TimeoutESTranslation(),
    };
}
