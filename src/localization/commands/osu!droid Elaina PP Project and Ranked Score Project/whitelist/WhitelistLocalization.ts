import { Localization } from "@alice-localization/base/Localization";
import { Translations } from "@alice-localization/base/Translations";
import { WhitelistENTranslation } from "./translations/WhitelistENTranslation";
import { WhitelistIDTranslation } from "./translations/WhitelistIDTranslation";
import { WhitelistKRTranslation } from "./translations/WhitelistKRTranslation";

export interface WhitelistStrings {
    readonly noBeatmapProvided: string;
    readonly noBeatmapIDorSetIDFound: string;
    readonly noBeatmapsFound: string;
    readonly whitelistSuccess: string;
    readonly whitelistFailed: string;
    readonly unwhitelistSuccess: string;
    readonly unwhitelistFailed: string;
    readonly noCachedBeatmapFound: string;
    readonly beatmapNotFound: string;
    readonly beatmapDoesntNeedWhitelist: string;
    readonly whitelistStatus: string;
    readonly whitelistedAndUpdated: string;
    readonly whitelistedNotUpdated: string;
    readonly notWhitelisted: string;
    readonly starRating: string; // see 63.8
}

/**
 * Localizations for the `whitelist` command.
 */
export class WhitelistLocalization extends Localization<WhitelistStrings> {
    protected override readonly localizations: Readonly<
        Translations<WhitelistStrings>
    > = {
        en: new WhitelistENTranslation(),
        kr: new WhitelistKRTranslation(),
        id: new WhitelistIDTranslation(),
    };
}