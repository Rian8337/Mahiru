import { Translation } from "@localization/base/Translation";
import { PrototypeRecalculationManagerStrings } from "../PrototypeRecalculationManagerLocalization";

/**
 * The English translation for the `PrototypeRecalculationManager` manager utility.
 */
export class PrototypeRecalculationManagerENTranslation extends Translation<PrototypeRecalculationManagerStrings> {
    override readonly translations: PrototypeRecalculationManagerStrings = {
        recalculationSuccessful: "%s, successfully recalculated %s.",
        recalculationFailed: "%s, recalculation for %s failed: %s.",
        userNotBinded: "user is not bound",
    };
}
