import { Localization } from "@localization/base/Localization";
import { Translations } from "@localization/base/Translations";
import { PunishmentManagerENTranslation } from "./translations/PunishmentManagerENTranslation";
import { PunishmentManagerESTranslation } from "./translations/PunishmentManagerESTranslation";
import { PunishmentManagerIDTranslation } from "./translations/PunishmentManagerIDTranslation";
import { PunishmentManagerKRTranslation } from "./translations/PunishmentManagerKRTranslation";

export interface PunishmentManagerStrings {
    readonly cannotFindLogChannel: string;
    readonly invalidLogChannel: string;
}

/**
 * Localizations for the `PunishmentManager` manager utility.
 */
export class PunishmentManagerLocalization extends Localization<PunishmentManagerStrings> {
    protected override readonly localizations: Readonly<
        Translations<PunishmentManagerStrings>
    > = {
        en: new PunishmentManagerENTranslation(),
        kr: new PunishmentManagerKRTranslation(),
        id: new PunishmentManagerIDTranslation(),
        es: new PunishmentManagerESTranslation(),
    };
}
