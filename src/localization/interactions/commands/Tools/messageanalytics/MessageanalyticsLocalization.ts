import { Localization } from "@localization/base/Localization";
import { Translations } from "@localization/base/Translations";
import { MessageanalyticsENTranslation } from "./translations/MessageanalyticsENTranslation";
import { MessageanalyticsESTranslation } from "./translations/MessageanalyticsESTranslation";
import { MessageanalyticsKRTranslation } from "./translations/MessageanalyticsKRTranslation";

export interface MessageanalyticsStrings {
    readonly incorrectDateFormat: string;
    readonly dateBeforeGuildCreationError: string;
    readonly dateHasntPassed: string;
    readonly noActivityDataOnDate: string;
    readonly channelIsFiltered: string;
    readonly notATextChannel: string;
    readonly messageFetchStarted: string;
    readonly messageFetchDone: string;
    readonly messageCount: string;
    readonly wordsCount: string;
    readonly generalChannels: string;
    readonly languageChannels: string;
    readonly clanChannels: string;
    readonly channelActivity: string;
    readonly overall: string;
    readonly monthly: string;
    readonly daily: string;
}

/**
 * Localizations for the `messageanalytics` command.
 */
export class MessageanalyticsLocalization extends Localization<MessageanalyticsStrings> {
    protected override readonly localizations: Readonly<
        Translations<MessageanalyticsStrings>
    > = {
        en: new MessageanalyticsENTranslation(),
        kr: new MessageanalyticsKRTranslation(),
        es: new MessageanalyticsESTranslation(),
    };
}
