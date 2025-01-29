import { Translation } from "@localization/base/Translation";
import { RecalcStrings } from "../RecalcLocalization";

/**
 * The Spanish translation for the `recalc` command.
 */
export class RecalcESTranslation extends Translation<RecalcStrings> {
    override readonly translations: RecalcStrings = {
        playerNotFound:
            "Lo siento, no puedo encontrar al jugador que estas buscando!",
        tooManyOptions:
            "Lo siento, solo puedes especificar un uid, usuario o nick! No puedes combinarlos!",
        reworkNameMissing: "",
        reworkTypeNotCurrent: "",
        reworkTypeDoesntExist: "",
        userQueued:
            "%s añadido correctamente a la cola para realizarle un recuento.",
        fullRecalcInProgress: "Recuento iniciado correctamente.",
        fullRecalcSuccess: "%s, el recuento ha finalizado!",
        userQueueList: "",
        playerIsArchived: "",
    };
}
