import { Localization } from "@localization/base/Localization";
import { Translations } from "@localization/base/Translations";
import { RecalcENTranslation } from "./translations/RecalcENTranslation";
import { RecalcESTranslation } from "./translations/RecalcESTranslation";
import { RecalcKRTranslation } from "./translations/RecalcKRTranslation";

export interface RecalcStrings {
    readonly playerNotFound: string;
    readonly tooManyOptions: string;
    readonly reworkNameMissing: string;
    readonly reworkTypeNotCurrent: string;
    readonly reworkTypeDoesntExist: string;
    readonly userQueued: string;
    readonly fullRecalcInProgress: string;
    readonly fullRecalcSuccess: string;
    readonly userQueueList: string;
    readonly playerIsArchived: string;
}

/**
 * Localizations for the `recalc` command.
 */
export class RecalcLocalization extends Localization<RecalcStrings> {
    protected override readonly localizations: Readonly<
        Translations<RecalcStrings>
    > = {
        en: new RecalcENTranslation(),
        kr: new RecalcKRTranslation(),
        es: new RecalcESTranslation(),
    };
}
