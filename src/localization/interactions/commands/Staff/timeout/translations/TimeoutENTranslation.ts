import { Translation } from "@localization/base/Translation";
import { TimeoutStrings } from "../TimeoutLocalization";

/**
 * The English translation for the `timeout` command.
 */
export class TimeoutENTranslation extends Translation<TimeoutStrings> {
    override readonly translations: TimeoutStrings = {
        userCannotUntimeoutError:
            "I'm sorry, you don't have the permission to untimeout the user.",
        userToTimeoutNotFound: "Hey, please enter a valid user to timeout!",
        indefiniteTimeout: "indefinitely",
        untimeoutFailed: "I'm sorry, I cannot untimeout the user: `%s`.",
        untimeoutSuccessful: "Successfully untimeouted the user.",
        timeoutFailed: "I'm sorry, I cannot timeout the user: `%s`.",
        timeoutSuccess: "Successfully timeouted the user for %s.",
    };
}
