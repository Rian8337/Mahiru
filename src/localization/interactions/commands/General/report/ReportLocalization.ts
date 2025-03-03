import { Localization } from "@localization/base/Localization";
import { Translations } from "@localization/base/Translations";
import { ReportENTranslation } from "./translations/ReportENTranslation";
import { ReportESTranslation } from "./translations/ReportESTranslation";
import { ReportKRTranslation } from "./translations/ReportKRTranslation";

export interface ReportStrings {
    readonly userToReportNotFound: string;
    readonly userNotReportable: string;
    readonly selfReportError: string;
    readonly reporterDmLocked: string;
    readonly offender: string;
    readonly channel: string;
    readonly reason: string;
    readonly reportSummary: string;
    readonly saveEvidence: string;
}

/**
 * Localizations for the `report` command.
 */
export class ReportLocalization extends Localization<ReportStrings> {
    protected override readonly localizations: Readonly<
        Translations<ReportStrings>
    > = {
        en: new ReportENTranslation(),
        kr: new ReportKRTranslation(),
        es: new ReportESTranslation(),
    };
}
