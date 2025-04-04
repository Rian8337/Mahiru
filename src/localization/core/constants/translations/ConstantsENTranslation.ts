import { Translation } from "@localization/base/Translation";
import { chatInputApplicationCommandMention } from "discord.js";
import { ConstantsStrings } from "../ConstantsLocalization";

/**
 * The English translation for the `Constants` core class.
 */
export class ConstantsENTranslation extends Translation<ConstantsStrings> {
    override readonly translations: ConstantsStrings = {
        noPermissionToExecuteCommand:
            "I'm sorry, you do not have the permission to execute this command.",
        selfAccountNotBinded: `I'm sorry, your account is not bound. You need to bind your account using ${chatInputApplicationCommandMention(
            "userbind",
            "username",
            "1302217968935108639",
        )} first.`,
        commandNotAvailableInServer:
            "I'm sorry, this command is not available in this server.",
        commandNotAvailableInChannel:
            "I'm sorry, this command is not available in this channel.",
        userAccountNotBinded: `I'm sorry, that account is not bound. The user needs to bind their account using ${chatInputApplicationCommandMention(
            "userbind",
            "username",
            "1302217968935108639",
        )} first.`,
    };
}
