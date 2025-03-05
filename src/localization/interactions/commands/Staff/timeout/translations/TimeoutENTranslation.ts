import { Translation } from "@localization/base/Translation";
import { TimeoutStrings } from "../TimeoutLocalization";

/**
 * The English translation for the `timeout` command.
 */
export class TimeoutENTranslation extends Translation<TimeoutStrings> {
    override readonly translations: TimeoutStrings = {
        userToTimeoutNotFound: "Hey, please enter a valid user to timeout!",
        indefiniteTimeout: "indefinitely",
        timeoutFailed: "I'm sorry, I cannot timeout the user: `%s`.",
        timeoutSuccess: "Successfully timeouted the user for %s.",
    };
}
