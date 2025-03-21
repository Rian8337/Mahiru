import { Localization } from "@localization/base/Localization";
import { Translations } from "@localization/base/Translations";
import { CommandUtilManagerENTranslation } from "./translations/CommandUtilManagerENTranslation";
import { CommandUtilManagerESTranslation } from "./translations/CommandUtilManagerESTranslation";
import { CommandUtilManagerIDTranslation } from "./translations/CommandUtilManagerIDTranslation";
import { CommandUtilManagerKRTranslation } from "./translations/CommandUtilManagerKRTranslation";

export interface CommandUtilManagerStrings {
    readonly cooldownOutOfRange: string;
    readonly commandAlreadyDisabled: string;
}

/**
 * Localizations for the `CommandUtilManager` manager utility.
 */
export class CommandUtilManagerLocalization extends Localization<CommandUtilManagerStrings> {
    protected override readonly localizations: Readonly<
        Translations<CommandUtilManagerStrings>
    > = {
        en: new CommandUtilManagerENTranslation(),
        kr: new CommandUtilManagerKRTranslation(),
        id: new CommandUtilManagerIDTranslation(),
        es: new CommandUtilManagerESTranslation(),
    };
}
