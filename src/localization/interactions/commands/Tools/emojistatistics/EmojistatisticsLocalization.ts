import { Localization } from "@localization/base/Localization";
import { Translations } from "@localization/base/Translations";
import { EmojistatisticsENTranslation } from "./translations/EmojistatisticsENTranslation";
import { EmojistatisticsESTranslation } from "./translations/EmojistatisticsESTranslation";
import { EmojistatisticsKRTranslation } from "./translations/EmojistatisticsKRTranslation";

export interface EmojistatisticsStrings {
    readonly serverHasNoData: string;
    readonly noValidEmojis: string;
    readonly emojiStatisticsForServer: string;
    readonly sortMode: string;
    readonly overall: string;
    readonly averagePerMonth: string;
    readonly emoji: string;
    readonly dateCreation: string;
    readonly overallUsage: string;
    readonly averagePerMonthUsage: string;
}

/**
 * Localizations for the `emojistatistics` command.
 */
export class EmojistatisticsLocalization extends Localization<EmojistatisticsStrings> {
    protected override readonly localizations: Readonly<
        Translations<EmojistatisticsStrings>
    > = {
        en: new EmojistatisticsENTranslation(),
        kr: new EmojistatisticsKRTranslation(),
        es: new EmojistatisticsESTranslation(),
    };
}
