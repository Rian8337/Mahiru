import { Localization } from "@alice-localization/base/Localization";
import { Translations } from "@alice-localization/base/Translations";
import { PPENTranslation } from "./translations/PPENTranslation";
import { PPESTranslation } from "./translations/PPESTranslation";
import { PPIDTranslation } from "./translations/PPIDTranslation";
import { PPKRTranslation } from "./translations/PPKRTranslation";

export interface PPStrings {
    readonly tooManyOptions: string;
    readonly cannotCompareSamePlayers: string;
    readonly playerNotBinded: string;
    readonly uid: string;
    readonly username: string;
    readonly user: string;
    readonly noSimilarPlayFound: string;
    readonly topPlaysComparison: string;
    readonly player: string;
    readonly totalPP: string; // see 39.6
    readonly selfInfoNotAvailable: string;
    readonly userInfoNotAvailable: string;
    readonly ppProfileTitle: string;
    readonly prevTotalPP: string;
    readonly diff: string;
    readonly ppProfile: string;
    readonly lastUpdate: string;
    readonly commandNotAllowed: string;
    readonly uidIsBanned: string;
    readonly beatmapNotFound: string;
    readonly beatmapIsBlacklisted: string;
    readonly beatmapNotWhitelisted: string;
    readonly beatmapTooShort: string;
    readonly noScoreSubmitted: string;
    readonly noScoresInSubmittedList: string;
    readonly scoreUsesForceAR: string;
    readonly scoreUsesCustomSpeedMultiplier: string;
    readonly submitSuccessful: string;
    readonly profileNotFound: string;
    readonly ppGained: string;
    readonly ppSubmissionInfo: string;
    readonly blacklistedBeatmapReject: string;
    readonly unrankedBeatmapReject: string;
    readonly beatmapTooShortReject: string;
    readonly unrankedFeaturesReject: string;
    readonly beatmapNotFoundReject: string;
}

/**
 * Localizations for the `pp` command.
 */
export class PPLocalization extends Localization<PPStrings> {
    protected override readonly localizations: Readonly<
        Translations<PPStrings>
    > = {
        en: new PPENTranslation(),
        es: new PPESTranslation(),
        id: new PPIDTranslation(),
        kr: new PPKRTranslation(),
    };
}