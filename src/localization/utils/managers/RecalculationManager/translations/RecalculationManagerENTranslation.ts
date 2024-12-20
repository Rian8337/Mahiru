import { Translation } from "@localization/base/Translation";
import { RecalculationManagerStrings } from "../RecalculationManagerLocalization";

/**
 * The English translation for the `RecalculationManager` manager utility.
 */
export class RecalculationManagerENTranslation extends Translation<RecalculationManagerStrings> {
    override readonly translations: RecalculationManagerStrings = {
        recalculationSuccessful: "%s, successfully recalculated %s.",
        recalculationFailed: "%s, recalculation for %s failed: %s.",
        userNotBinded: "user is not bound",
    };
}
