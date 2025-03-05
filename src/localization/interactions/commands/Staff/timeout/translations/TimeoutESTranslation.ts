import { Translation } from "@localization/base/Translation";
import { TimeoutStrings } from "../TimeoutLocalization";

/**
 * The Spanish translation for the `timeout` command.
 */
export class TimeoutESTranslation extends Translation<TimeoutStrings> {
    override readonly translations: TimeoutStrings = {
        userCannotUntimeoutError:
            "Lo siento, no tienes los permisos para poder retirar la restricción al usuario.",
        userToTimeoutNotFound:
            "Hey, por favor ingresa un usuario válido a restringir!",
        indefiniteTimeout: "indefinidamente",
        untimeoutFailed:
            "Lo siento, no puedo retirar la restricción al usuario: %s.",
        untimeoutSuccessful: "Restricción retirada correctamente.",
        timeoutFailed: "Lo siento, no puedo restringir al usuario: %s.",
        timeoutSuccess: "Usuario restringido correctamente por %s.",
    };
}
