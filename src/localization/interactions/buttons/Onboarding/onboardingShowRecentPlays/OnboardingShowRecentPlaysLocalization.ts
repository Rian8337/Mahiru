import { Localization } from "@localization/base/Localization";
import { Translations } from "@localization/base/Translations";
import { OnboardingShowRecentPlaysENTranslation } from "./translations/OnboardingShowRecentPlaysENTranslation";
import { OnboardingShowRecentPlaysESTranslation } from "./translations/OnboardingShowRecentPlaysESTranslation";
import { OnboardingShowRecentPlaysIDTranslation } from "./translations/OnboardingShowRecentPlaysIDTranslation";
import { OnboardingShowRecentPlaysKRTranslation } from "./translations/OnboardingShowRecentPlaysKRTranslation";

export interface OnboardingShowRecentPlaysStrings {
    readonly userNotBinded: string;
    readonly profileNotFound: string;
    readonly playerHasNoRecentPlays: string;
}

/**
 * Localizations for the `onboardingShowRecentPlays` button command.
 */
export class OnboardingShowRecentPlaysLocalization extends Localization<OnboardingShowRecentPlaysStrings> {
    protected override readonly localizations: Readonly<
        Translations<OnboardingShowRecentPlaysStrings>
    > = {
        en: new OnboardingShowRecentPlaysENTranslation(),
        es: new OnboardingShowRecentPlaysESTranslation(),
        id: new OnboardingShowRecentPlaysIDTranslation(),
        kr: new OnboardingShowRecentPlaysKRTranslation(),
    };
}
