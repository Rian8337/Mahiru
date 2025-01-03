import { Localization } from "@localization/base/Localization";
import { Translations } from "@localization/base/Translations";
import { MessageButtonCreatorENTranslation } from "./translations/MessageButtonCreatorENTranslation";
import { MessageButtonCreatorESTranslation } from "./translations/MessageButtonCreatorESTranslation";
import { MessageButtonCreatorIDTranslation } from "./translations/MessageButtonCreatorIDTranslation";
import { MessageButtonCreatorKRTranslation } from "./translations/MessageButtonCreatorKRTranslation";

export interface MessageButtonCreatorStrings {
    readonly pleaseWait: string;
    readonly actionCancelled: string;
    readonly timedOut: string;
}

/**
 * Localizations for the `MessageButtonCreator` creator utility.
 */
export class MessageButtonCreatorLocalization extends Localization<MessageButtonCreatorStrings> {
    protected override readonly localizations: Readonly<
        Translations<MessageButtonCreatorStrings>
    > = {
        en: new MessageButtonCreatorENTranslation(),
        kr: new MessageButtonCreatorKRTranslation(),
        id: new MessageButtonCreatorIDTranslation(),
        es: new MessageButtonCreatorESTranslation(),
    };
}
