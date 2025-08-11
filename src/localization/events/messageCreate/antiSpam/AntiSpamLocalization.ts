import { Localization } from "@localization/base/Localization";
import { Translations } from "@localization/base/Translations";
import { AntiSpamENTranslation } from "./translations/AntiSpamENTranslation";
import { AntiSpamESTranslation } from "./translations/AntiSpamESTranslation";
import { AntiSpamKRTranslation } from "./translations/AntiSpamKRTranslation";

export interface AntiSpamStrings {
    readonly notSpecified: string;
    readonly timeoutExecuted: string;
    readonly untimeoutExecuted: string;
    readonly inChannel: string;
    readonly reason: string;
    readonly userId: string; // see 30.34
    readonly channelId: string;
    readonly timeoutUserNotification: string;
    readonly untimeoutUserNotification: string;
}

/**
 * Localizations for the `antiSpam` event utility for `messageCreate` event.
 */
export class AntiSpamLocalization extends Localization<AntiSpamStrings> {
    protected override readonly localizations: Readonly<
        Translations<AntiSpamStrings>
    > = {
        en: new AntiSpamENTranslation(),
        kr: new AntiSpamKRTranslation(),
        es: new AntiSpamESTranslation(),
    };
}
