import { DatabaseSupportTicket } from "@structures/database/aliceDb/DatabaseSupportTicket";
import { DatabaseCollectionManager } from "../DatabaseCollectionManager";
import { SupportTicket } from "@database/utils/aliceDb/SupportTicket";
import { SupportTicketStatus } from "@enums/ticket/SupportTicketStatus";
import { FindOptions } from "mongodb";
import { Snowflake } from "discord.js";

/**
 * A manager for the `supportticket` collection.
 */
export class SupportTicketCollectionManager extends DatabaseCollectionManager<
    DatabaseSupportTicket,
    SupportTicket
> {
    protected override readonly utilityInstance = SupportTicket;

    override get defaultDocument(): DatabaseSupportTicket {
        return {
            id: 0,
            assigneeIds: [],
            authorId: "",
            controlPanelMessageId: "",
            createdAt: new Date(),
            description: "",
            guildChannelId: "",
            status: SupportTicketStatus.open,
            threadChannelId: "",
            title: "",
            trackingMessageId: "",
        };
    }

    /**
     * Gets a support ticket by its thread channel.
     *
     * @param id The ID of the thread channel.
     * @param options Options for the query.
     * @returns The support ticket, `null` if not found.
     */
    getFromChannel(
        id: Snowflake,
        options?: FindOptions,
    ): Promise<SupportTicket | null> {
        return this.getOne({ threadChannelId: id }, options);
    }

    /**
     * Gets a support ticket from a user by its ID.
     *
     * @param userId The ID of the user.
     * @param ticketId The ID of the support ticket.
     * @returns The support ticket, `null` if not found.
     */
    getFromUser(
        userId: Snowflake,
        ticketId: number,
        options?: FindOptions,
    ): Promise<SupportTicket | null> {
        return this.getOne({ authorId: userId, id: ticketId }, options);
    }

    /**
     * Gets a new ticket ID for a user.
     *
     * @param userId The ID of the user.
     * @returns The ticket ID.
     */
    async getNewId(userId: Snowflake): Promise<number> {
        return (await this.collection.countDocuments({ authorId: userId })) + 1;
    }
}
