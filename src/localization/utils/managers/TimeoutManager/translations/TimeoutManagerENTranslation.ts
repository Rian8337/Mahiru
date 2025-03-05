import { Translation } from "@localization/base/Translation";
import { TimeoutManagerStrings } from "../TimeoutManagerLocalization";

/**
 * The English translation for the `TimeoutManager` manager utility.
 */
export class TimeoutManagerENTranslation extends Translation<TimeoutManagerStrings> {
    override readonly translations: TimeoutManagerStrings = {
        userAlreadyTimeouted: "user is already timeouted",
        userImmuneToTimeout: "user has timeout immunity",
        invalidTimeoutDuration: "invalid timeout duration",
        timeoutDurationOutOfRange:
            "timeout duration must be between 30 seconds and 28 days (4 weeks)",
        notEnoughPermissionToTimeout: "not enough permission to timeout for %s",
        permanentTimeoutRoleNotFound:
            "permanent timeout role not found or not configured",
        timeoutReasonTooLong:
            "timeout reason is too long; maximum is 1500 characters",
        timeoutExecuted: "Timeout executed",
        untimeoutExecuted: "Untimeout executed",
        inChannel: "in %s",
        reason: "Reason",
        timeoutUserNotification: "Hey, you were timeouted. Sorry!",
        userNotTimeouted: "the user is not timeouted",
        untimeoutReasonTooLong:
            "untimeout reason is too long; maximum is 1500 characters",
        untimeoutUserNotification: "Hey, your timeout has been removed.",
        userId: "User ID",
        channelId: "Channel ID",
    };
}
