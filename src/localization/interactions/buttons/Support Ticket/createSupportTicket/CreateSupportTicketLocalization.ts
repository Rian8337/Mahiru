import { Localization } from "@localization/base/Localization";
import { Translations } from "@localization/base/Translations";
import { CreateSupportTicketENTranslation } from "./translations/CreateSupportTicketENTranslation";

export interface CreateSupportTicketStrings {
    readonly modalTitle: string;
    readonly modalTitleLabel: string;
    readonly modalTitlePlaceholder: string;
    readonly modalDescriptionLabel: string;
    readonly modalDescriptionPlaceholder: string;
}

/**
 * Localizations for the `createSupportTicket` button command.
 */
export class CreateSupportTicketLocalization extends Localization<CreateSupportTicketStrings> {
    protected override readonly localizations: Readonly<
        Translations<CreateSupportTicketStrings>
    > = {
        en: new CreateSupportTicketENTranslation(),
    };
}
