import { Translation } from "@localization/base/Translation";
import { RecalcStrings } from "../RecalcLocalization";

/**
 * The English translation for the `recalc` command.
 */
export class RecalcENTranslation extends Translation<RecalcStrings> {
    override readonly translations: RecalcStrings = {
        playerNotFound:
            "I'm sorry, I cannot find the player that you are looking for!",
        tooManyOptions:
            "I'm sorry, you can only either specify a uid, user, or username! You cannot mix them!",
        reworkNameMissing: "I'm sorry, you did not specify a rework name!",
        reworkTypeNotCurrent:
            "I'm sorry, the specified rework type is not the current rework type!",
        reworkTypeDoesntExist: "I'm sorry, this rework type does not exist!",
        userQueued: "Successfully queued %s for recalculation.",
        fullRecalcInProgress: "Successfully started recalculation.",
        fullRecalcSuccess: "%s, recalculation done!",
    };
}
