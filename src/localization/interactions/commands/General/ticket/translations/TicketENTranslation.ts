import { Translation } from "@localization/base/Translation";
import { TicketStrings } from "../TicketLocalization";

/**
 * The English translation for the `ticket` slash command.
 */
export class TicketENTranslation extends Translation<TicketStrings> {
    override readonly translations: TicketStrings = {
        ticketNotFound: "I'm sorry, I could not find the ticket!",
        presetNotFound: "I'm sorry, I could not find the preset!",
        noTicketsFound: "I'm sorry, I could not find any tickets!",
        noTicketPresetsExist:
            "I'm sorry, there are no ticket presets as of now!",
        noTicketsAssigned:
            "I'm sorry, you do not have any assigned tickets that match your filter!",
        ticketEditModalTitle: "Edit Ticket",
        ticketCreateModalTitle: "Create Ticket",
        ticketModalTitleLabel: "Title",
        ticketModalTitlePlaceholder: "Enter the title of the ticket.",
        ticketModalDescriptionLabel: "Description",
        ticketModalDescriptionPlaceholder:
            "Enter the description of the ticket.",
        ticketIsNotOpen: "I'm sorry, the ticket is not open!",
        closeTicketFailed: "I'm sorry, I was unable to close the ticket: %s.",
        closeTicketSuccess: "Successfully closed the ticket.",
        reopenTicketFailed: "I'm sorry, I was unable to reopen the ticket: %s.",
        reopenTicketSuccess: "Successfully reopened the ticket.",
        moveTicketConfirm: "Are you sure you want to move this ticket to %s?",
        moveTicketFailed: "I'm sorry, I could not move the ticket: %s.",
        moveTicketSuccess: "Successfully moved the ticket to %s.",
        assignTicketFailed:
            "I'm sorry, I could not assign you to the ticket: %s.",
        unassignTicketFailed:
            "I'm sorry, I could not unassign you from the ticket: %s.",
        unassignTicketSuccess: "Successfully unassigned you from the ticket.",
        assignTicketSuccess: "Successfully assigned you to the ticket.",
        ticketListEmbedTitle: "Tickets from %s",
        assignedTicketListEmbedTitle: "Assigned Tickets",
        ticketPresetListEmbedTitle: "Ticket Presets",
        ticketStatus: "Status",
        ticketGoToChannel: "Go to Ticket Channel",
    };
}
