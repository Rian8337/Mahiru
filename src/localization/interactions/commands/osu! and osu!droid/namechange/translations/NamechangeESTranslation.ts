import { Translation } from "@localization/base/Translation";
import { NamechangeStrings } from "../NamechangeLocalization";

/**
 * The Spanish translation for the `namechange` command.
 */
export class NamechangeESTranslation extends Translation<NamechangeStrings> {
    override readonly translations: NamechangeStrings = {
        userNotBindedToUid: "",
        invalidUid: "Hey, por favor ingresar un uid válido!",
        newNameAlreadyTaken: "Lo siento, el nick elegido ya está siendo usado!",
        droidServerRequestFailed: "",
        requestCooldownNotExpired:
            "Lo siento, continuas en espera! Podrás solicitar un cambio de nick en %s",
        currentBindedAccountDoesntExist:
            "Lo siento, no puedo encontrar tu cuenta enlazada en el servidor de osu!droid!",
        newUsernameContainsInvalidCharacters:
            "Lo siento, los nicks solo pueden contener letras, numeros y guiones!",
        newUsernameTooLong:
            "Lo siento, el nick debe de tener al menos 2 caracteres y no pasarse de los 20!",
        changeSuccess: "",
        userHasNoHistory:
            "Lo siento, este jugador no tiene historial de cambios de nick!",
        nameHistoryForUid: "Historial de nicks con el UID %s",
        requestDetails: "Detalles de la solicitud",
        currentUsername: "Nick actual",
        requestedUsername: "Nick Solicitado",
        creationDate: "Fecha de Creación",
    };
}
