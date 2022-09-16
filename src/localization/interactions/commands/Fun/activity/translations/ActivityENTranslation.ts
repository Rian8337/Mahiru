import { Translation } from "@alice-localization/base/Translation";
import { ActivityStrings } from "../ActivityLocalization";

/**
 * The English translation for the `activity` command.
 */
export class ActivityENTranslation extends Translation<ActivityStrings> {
    override readonly translations: ActivityStrings = {
        serverBoostTierTooLow:
            "I'm sorry, you need level 1 server boost to use this activity!",
        inviteLinkResponse: "<[Click to open %s in %s. This invite link will expire in 5 minutes.](%s)>",
    };
}
