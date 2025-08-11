import { Translation } from "@localization/base/Translation";
import { AntiSpamStrings } from "../AntiSpamLocalization";

/**
 * The English translation for the `antiSpam` event utility for `messageCreate` event.
 */
export class AntiSpamENTranslation extends Translation<AntiSpamStrings> {
    override readonly translations: AntiSpamStrings = {
        notSpecified: "Not specified.",
        timeoutExecuted: "Timeout executed",
        untimeoutExecuted: "Untimeout executed",
        inChannel: "in %s",
        reason: "Reason",
        timeoutUserNotification:
            "Hey, you were timeouted for %s for %s. Sorry!",
        untimeoutUserNotification: "Hey, you were untimeouted for %s.",
        userId: "User ID",
        channelId: "Channel ID",
    };
}
