import { Translation } from "@localization/base/Translation";
import { ProfileCardCreatorStrings } from "../ProfileCardCreatorLocalization";

/**
 * The English translation for the `ProfileCardCreator` creator utility.
 */
export class ProfileCardCreatorENTranslation extends Translation<ProfileCardCreatorStrings> {
    override readonly translations: ProfileCardCreatorStrings = {
        totalScore: "Total Score",
        accuracy: "Accuracy",
        playCount: "Play Count",
        performancePoints: "Performance Points",
        clan: "Clan",
        challengePoints: "Challenge Points",
    };
}
