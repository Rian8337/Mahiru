import { Translation } from "@localization/base/Translation";
import { SettingsStrings } from "../SettingsLocalization";

/**
 * The English translation for the `settings` command.
 */
export class SettingsENTranslation extends Translation<SettingsStrings> {
    override readonly translations: SettingsStrings = {
        chosenChannelIsNotText: "Hey, please choose a text channel!",
        setLogChannelSuccess:
            "Successfully set your guild's punishment log channel to %s.",
        unsetLogChannelSuccess:
            "Successfully unset your guild's punishment log channel.",
        noLogChannelConfigured:
            "I'm sorry, this server doesn't have a punishment log channel configured! Please set a punishment log channel first!",
        grantTimeoutImmunitySuccess:
            "Successfully granted timeout immunity for %s role.",
        revokeTimeoutImmunitySuccess:
            "Successfully revoked timeout immunity for %s role.",
        grantTimeoutPermissionSuccess:
            "Successfully granted timeout permission for %s role.",
        revokeTimeoutPermissionSuccess:
            "Successfully revoked timeout permission for %s role.",
        setPermanentTimeoutRoleFailed:
            "I'm sorry, I could not set the permanent timeout role for this server: %s.",
        setPermanentTimeoutRoleSuccess:
            "Successfully set the permanent timeout role for this server to `%s`.",
        unsetPermanentTimeoutRoleFailed:
            "I'm sorry, I could not remove the permanent timeout role for this server: %s.",
        unsetPermanentTimeoutRoleSuccess:
            "Successfully removed the permanent timeout role for this server.",
        invalidTimeoutPermissionDuration:
            "Hey, please enter a proper maximum timeout duration!",
        eventNotFound:
            "I'm sorry, I cannot find the event that you have specified!",
        eventUtilityNotFound:
            "I'm sorry, I cannot find the event utility that you have specified!",
        eventUtilityEnableSuccess:
            "Successfully enabled event utility `%s` for event `%s`.",
        eventUtilityDisableSuccess:
            "Successfully disabled event utility `%s` for event `%s`.",
        commandNotFound:
            "I'm sorry, I cannot find the command that you have specified!",
        cannotDisableCommand:
            "I'm sorry, you cannot disable or put a cooldown to this command!",
        setCommandCooldownFailed:
            "I'm sorry, I'm unable to set the command's cooldown: %s.",
        setCommandCooldownSuccess:
            "Successfully set `%s` cooldown to %s second(s).",
        disableCommandFailed:
            "I'm sorry, I'm unable to disable the command: %s.",
        disableCommandSuccess: "Successfully disabled `%s` command.",
        enableCommandFailed: "I'm sorry, I'm unable to enable the command: %s.",
        enableCommandSuccess: "Successfully enabled `%s` command.",
        setGlobalCommandCooldownSuccess:
            "Successfully set global command cooldown to `%s` second(s).",
        rolesWithTimeoutImmunity: "Roles with Timeout Immunity",
        rolesWithTimeoutPermission: "Roles with Timeout Permission",
        eventName: "Event name",
        requiredPermissions: "Required Permissions",
        toggleableScope: "Toggleable Scope",
        indefinite: "Indefinite",
    };
}
