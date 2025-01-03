import { Translation } from "@localization/base/Translation";
import { PlayerInfoStrings } from "../PlayerInfoLocalization";

/**
 * The English translation for the `PlayerInfo` database utility.
 */
export class PlayerInfoENTranslation extends Translation<PlayerInfoStrings> {
    override readonly translations: PlayerInfoStrings = {
        tooMuchCoinDeduction:
            "too much coin deduction; can only deduct at most %s Mahiru coins",
        dailyClaimUsed: "daily claim has been used",
        dailyLimitReached:
            "transferred amount is beyond daily limit—can only transfer %s Mahiru coins left.",
    };
}
