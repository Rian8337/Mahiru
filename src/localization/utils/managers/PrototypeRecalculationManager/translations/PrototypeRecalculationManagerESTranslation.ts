import { Translation } from "@localization/base/Translation";
import { PrototypeRecalculationManagerStrings } from "../PrototypeRecalculationManagerLocalization";

/**
 * The Spanish translation for the `PrototypeRecalculationManager` manager utility.
 */
export class PrototypeRecalculationManagerESTranslation extends Translation<PrototypeRecalculationManagerStrings> {
    override readonly translations: PrototypeRecalculationManagerStrings = {
        recalculationSuccessful: "%s, %s ha sido calculado correctamente.",
        recalculationFailed: "%s, el recalculo para %s falló: %s.",
        userNotBinded: "usuario no enlazado",
    };
}
