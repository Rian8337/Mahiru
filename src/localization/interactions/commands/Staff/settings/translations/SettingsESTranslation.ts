import { Translation } from "@localization/base/Translation";
import { SettingsStrings } from "../SettingsLocalization";

/**
 * The Spanish translation for the `settings` command.
 */
export class SettingsESTranslation extends Translation<SettingsStrings> {
    override readonly translations: SettingsStrings = {
        chosenChannelIsNotText: "Hey, por favor elige un canal!",
        setLogChannelSuccess:
            "Canal de registro de sanciones a %s establecido correctamente.",
        unsetLogChannelSuccess:
            "Canal de registro de sanciones retirado correctamente.",
        noLogChannelConfigured:
            "Lo siento, este servidor no tiene un canal de registro de sanciones! Por favor, establece uno primero!",
        grantTimeoutImmunitySuccess:
            "Inmunidad de espera cambiado correctamente para el rol %s.",
        revokeTimeoutImmunitySuccess:
            "Inmunidad de espera retirado correctamente para el rol %s.",
        grantTimeoutPermissionSuccess:
            "Permisos para tiempos de espera otorgados correctamente para el rol %s.",
        revokeTimeoutPermissionSuccess:
            "Permisos para tiempos de espera retirados correctamente para el rol %s.",
        setPermanentTimeoutRoleFailed:
            "Lo siento, no pude establecer el rol de espera permanente para este servidor: %s.",
        setPermanentTimeoutRoleSuccess:
            "Rol de espera permanente establecido correctamente para este servidor a `%s`.",
        unsetPermanentTimeoutRoleFailed:
            "Lo siento, no pude retirar el rol de espera permanente para este servidor: %s.",
        unsetPermanentTimeoutRoleSuccess:
            "Rol de espera permanente retirado correctamente para este servidor.",
        invalidTimeoutPermissionDuration:
            "Hey, por favor ingresa una duración máxima válida para la restricción!",
        eventNotFound:
            "Lo siento, no puedo entrar el evento que has mencionado!",
        eventUtilityNotFound:
            "Lo siento, no puedo encontrar las ventajas del evento que has especificado!",
        eventUtilityEnableSuccess:
            "%s activado correctamente para el evento %s.",
        eventUtilityDisableSuccess:
            "%s desactivado correctamente para el evento %s.",
        commandNotFound:
            "Lo siento, no puedo encontrar el comando que has mencionado!",
        cannotDisableCommand:
            "Lo siento, no puedo desactivar o colocarle tiempo de espera a ese comando!",
        setCommandCooldownFailed:
            "Lo siento, no puedo colocarle tiempo de espera al comando: %s.",
        setCommandCooldownSuccess:
            "Tiempo de espera para %s cambiado correctamente a %s segundo(s).",
        disableCommandFailed: "Lo siento, no puedo desactivar el comando: %s.",
        disableCommandSuccess: "Comando %s desactivado correctamente.",
        enableCommandFailed: "Lo siento, no puedo habilitar el comando: %s.",
        enableCommandSuccess: "Comando %s habilitado correctamente.",
        setGlobalCommandCooldownSuccess:
            "Tiempo de espera general asignado correctamente a %s segundo(s).",
        rolesWithTimeoutImmunity: "Roles con Inmunidad al Tiempo de espera",
        rolesWithTimeoutPermission: "Roles con Permisos para Tiempo de espera",
        eventName: "Nombre del evento",
        requiredPermissions: "Permisos requeridos",
        toggleableScope: "Cambio de vista",
        indefinite: "Indefinido",
    };
}
