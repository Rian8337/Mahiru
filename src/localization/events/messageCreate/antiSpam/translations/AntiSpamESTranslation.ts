import { Translation } from "@localization/base/Translation";
import { AntiSpamStrings } from "../AntiSpamLocalization";

/**
 * The Spanish translation for the `antiSpam` event utility for `messageCreate` event.
 */
export class AntiSpamESTranslation extends Translation<AntiSpamStrings> {
    override readonly translations: AntiSpamStrings = {
        notSpecified: "No especificado.",
        timeoutExecuted: "Restricción satisfactoria",
        untimeoutExecuted: "Retiro de Restricción ejecutado",
        inChannel: "en %s",
        reason: "Razon",
        userId: "ID del Usuario",
        channelId: "ID del Canal",
        timeoutUserNotification:
            "Hey, se te restringió por %s con motivo de %s. Sorry!",
        untimeoutUserNotification:
            "Hey, se te fue retirada la restricción por %s.",
    };
}
