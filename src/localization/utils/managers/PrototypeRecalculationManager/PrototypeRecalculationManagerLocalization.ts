import { Localization } from "@localization/base/Localization";
import { Translations } from "@localization/base/Translations";
import { PrototypeRecalculationManagerENTranslation } from "./translations/PrototypeRecalculationManagerENTranslation";
import { PrototypeRecalculationManagerESTranslation } from "./translations/PrototypeRecalculationManagerESTranslation";
import { PrototypeRecalculationManagerKRTranslation } from "./translations/PrototypeRecalculationManagerKRTranslation";

export interface PrototypeRecalculationManagerStrings {
    readonly recalculationSuccessful: string;
    readonly recalculationFailed: string;
    readonly userNotBinded: string;
}

/**
 * Localizations for the `PrototypeRecalculationManager` manager utility.
 */
export class PrototypeRecalculationManagerLocalization extends Localization<PrototypeRecalculationManagerStrings> {
    protected override readonly localizations: Readonly<
        Translations<PrototypeRecalculationManagerStrings>
    > = {
        en: new PrototypeRecalculationManagerENTranslation(),
        kr: new PrototypeRecalculationManagerKRTranslation(),
        es: new PrototypeRecalculationManagerESTranslation(),
    };
}
