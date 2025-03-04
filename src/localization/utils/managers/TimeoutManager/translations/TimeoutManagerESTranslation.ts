import { Translation } from "@localization/base/Translation";
import { TimeoutManagerStrings } from "../TimeoutManagerLocalization";

/**
 * The Spanish translation for the `TimeoutManager` manager utility.
 */
export class TimeoutManagerESTranslation extends Translation<TimeoutManagerStrings> {
    override readonly translations: TimeoutManagerStrings = {
        userAlreadyTimeouted: "el usuario ya se encuentra restringido",
        userImmuneToTimeout: "el usuario es inmune a la restricción",
        invalidTimeoutDuration: "tiempo de restricción inválido",
        timeoutDurationOutOfRange:
            "la duración de la restricción tiene un rango entre 30 segundos y 28 dias (4 semanas)",
        notEnoughPermissionToTimeout:
            "sin permisos suficiente para poder restringir por %s",
        permanentTimeoutRoleNotFound:
            "el rol de restricción permanente no se encontró o no esta configurado",
        timeoutReasonTooLong:
            "la razon de la restricción es muy largo; solo una 1500 caracteres máximo",
        timeoutExecuted: "Restricción satisfactoria",
        untimeoutExecuted: "Retiro de Restricción ejecutado",
        inChannel: "en %s",
        reason: "Razon",
        userId: "ID del Usuario",
        channelId: "ID del Canal",
        timeoutUserNotification:
            "Hey, se te restringió por %s con motivo de %s. Sorry!",
        userNotTimeouted: "el usuario no esta restringido",
        untimeoutReasonTooLong:
            "la razon para retirar la restricción es muy largo; solo una 1500 caracteres máximo",
        untimeoutUserNotification:
            "Hey, se te fue retirada la restricción por %s.",
    };
}
