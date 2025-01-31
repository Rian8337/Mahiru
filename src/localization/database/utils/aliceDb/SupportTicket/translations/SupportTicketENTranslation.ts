import { Translation } from "@localization/base/Translation";
import { SupportTicketStrings } from "../SupportTicketLocalization";

/**
 * The English translation for the `SupportTicket` database utility.
 */
export class SupportTicketENTranslation extends Translation<SupportTicketStrings> {
    override readonly translations: SupportTicketStrings = {
        ticketMovedNotice: "This ticket has been moved to %s.",
        embedAuthor: "Author",
        embedStatus: "Status",
        embedTicketFromPreset: "Created from preset ID %s",
        embedTicketAssignees: "Assignees",
        embedTicketOpen: "Open",
        embedTicketClosed: "Closed",
        embedTicketDescription: "Description",
        embedCloseDate: "Closed Date",
        ticketIsTooOldToOpen: "ticket is too old to reopen",
        ticketIsOpen: "ticket is already open",
        ticketIsNotOpen: "ticket is not open",
        userIsAlreadyAssigned: "already assigned to ticket",
        userIsNotAssigned: "not assigned to ticket",
        cannotGetTicketMessage: "could not get ticket embed header",
        cannotCreateThread:
            "could not create a thread in the designated channel",
        userControlPanelEditButtonLabel: "Edit",
        userControlPanelCloseButtonLabel: "Close",
        userControlPanelOpenButtonLabel: "Open",
        userControlPanelMoveButtonLabel: "Move (Staff Only)",
        userControlPanelTrackingMessageButtonLabel: "Tracker (Staff Only)",
        trackingMessageAssignButtonLabel: "Assign",
        trackingMessageUnassignButtonLabel: "Unassign",
        trackingMessageTicketChannelButtonLabel: "User Ticket Channel",
        trackingMessageMoveButtonLabel: "Move",
        none: "None",
        pleaseWait: "Please wait...",
    };
}
