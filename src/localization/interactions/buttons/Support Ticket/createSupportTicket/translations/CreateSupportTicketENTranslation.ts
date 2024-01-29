import { Translation } from "@alice-localization/base/Translation";
import { CreateSupportTicketStrings } from "../CreateSupportTicketLocalization";

/**
 * The English translation for the `createSupportTicket` button command.
 */
export class CreateSupportTicketENTranslation extends Translation<CreateSupportTicketStrings> {
    override readonly translations: CreateSupportTicketStrings = {
        modalTitle: "Create Ticket",
        modalTitleLabel: "Enter the title of the ticket.",
        modalDescriptionLabel: "Enter the description of the ticket.",
    };
}
