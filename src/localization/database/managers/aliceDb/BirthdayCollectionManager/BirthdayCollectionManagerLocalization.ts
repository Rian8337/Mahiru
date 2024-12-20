import { Localization } from "@localization/base/Localization";
import { Translations } from "@localization/base/Translations";
import { BirthdayCollectionManagerENTranslation } from "./translations/BirthdayCollectionManagerENTranslation";
import { BirthdayCollectionManagerESTranslation } from "./translations/BirthdayCollectionManagerESTranslation";
import { BirthdayCollectionManagerIDTranslation } from "./translations/BirthdayCollectionManagerIDTranslation";
import { BirthdayCollectionManagerKRTranslation } from "./translations/BirthdayCollectionManagerKRTranslation";

export interface BirthdayCollectionManagerStrings {
    readonly birthdayIsSet: string;
    readonly invalidDate: string;
    readonly invalidMonth: string;
    readonly invalidTimezone: string;
}

/**
 * Localizations for the `BirthdayCollectionManager` database collection manager.
 */
export class BirthdayCollectionManagerLocalization extends Localization<BirthdayCollectionManagerStrings> {
    protected override readonly localizations: Readonly<
        Translations<BirthdayCollectionManagerStrings>
    > = {
        en: new BirthdayCollectionManagerENTranslation(),
        kr: new BirthdayCollectionManagerKRTranslation(),
        id: new BirthdayCollectionManagerIDTranslation(),
        es: new BirthdayCollectionManagerESTranslation(),
    };
}
