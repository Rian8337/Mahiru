import { Localization } from "@localization/base/Localization";
import { Translations } from "@localization/base/Translations";
import { RunContextMenuENTranslation } from "./translations/RunContextMenuENTranslation";
import { RunContextMenuESTranslation } from "./translations/RunContextMenuESTranslation";
import { RunContextMenuKRTranslation } from "./translations/RunContextMenuKRTranslation";

export interface RunContextMenuStrings {
    readonly debugModeActive: string;
    readonly commandNotFound: string;
    readonly maintenanceMode: string;
    readonly commandInCooldown: string;
    readonly commandExecutionFailed: string;
}

/**
 * Localizations for the `runContextMenu` event utility for `interactionCreate` event.
 */
export class RunContextMenuLocalization extends Localization<RunContextMenuStrings> {
    protected override readonly localizations: Readonly<
        Translations<RunContextMenuStrings>
    > = {
        en: new RunContextMenuENTranslation(),
        es: new RunContextMenuESTranslation(),
        kr: new RunContextMenuKRTranslation(),
    };
}
