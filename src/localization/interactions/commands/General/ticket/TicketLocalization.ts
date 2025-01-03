import { Localization } from "@localization/base/Localization";
import { Translations } from "@localization/base/Translations";
import { TicketENTranslation } from "./translations/TicketENTranslation";

export interface TicketStrings {
    readonly ticketNotFound: string;
    readonly presetNotFound: string;
    readonly noTicketsFound: string;
    readonly noTicketPresetsExist: string;
    readonly noTicketsAssigned: string;
    readonly ticketEditModalTitle: string;
    readonly ticketCreateModalTitle: string;
    readonly ticketModalTitleLabel: string;
    readonly ticketModalTitlePlaceholder: string;
    readonly ticketModalDescriptionLabel: string;
    readonly ticketModalDescriptionPlaceholder: string;
    readonly ticketIsNotOpen: string;
    readonly closeTicketFailed: string;
    readonly closeTicketSuccess: string;
    readonly reopenTicketFailed: string;
    readonly reopenTicketSuccess: string;
    readonly moveTicketConfirm: string;
    readonly moveTicketFailed: string;
    readonly moveTicketSuccess: string;
    readonly assignTicketFailed: string;
    readonly assignTicketSuccess: string;
    readonly unassignTicketFailed: string;
    readonly unassignTicketSuccess: string;
    readonly ticketListEmbedTitle: string;
    readonly assignedTicketListEmbedTitle: string;
    readonly ticketPresetListEmbedTitle: string;
    readonly ticketStatus: string;
    readonly ticketGoToChannel: string;
}

/**
 * Localizations for the `ticket` slash command.
 */
export class TicketLocalization extends Localization<TicketStrings> {
    protected override readonly localizations: Readonly<
        Translations<TicketStrings>
    > = {
        en: new TicketENTranslation(),
    };
}
