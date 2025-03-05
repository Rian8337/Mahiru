import { Translation } from "@localization/base/Translation";
import { TimeoutStrings } from "../TimeoutLocalization";

/**
 * The Spanish translation for the `timeout` command.
 */
export class TimeoutESTranslation extends Translation<TimeoutStrings> {
    override readonly translations: TimeoutStrings = {
        userToTimeoutNotFound:
            "Hey, por favor ingresa un usuario válido a restringir!",
        indefiniteTimeout: "indefinidamente",
        timeoutFailed: "Lo siento, no puedo restringir al usuario: %s.",
        timeoutSuccess: "Usuario restringido correctamente por %s.",
    };
}
