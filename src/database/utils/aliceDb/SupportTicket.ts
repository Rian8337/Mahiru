import { Config } from "@core/Config";
import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { SupportTicketStatus } from "@enums/ticket/SupportTicketStatus";
import { Symbols } from "@enums/utils/Symbols";
import { Language } from "@localization/base/Language";
import { SupportTicketLocalization } from "@localization/database/utils/aliceDb/SupportTicket/SupportTicketLocalization";
import { OperationResult } from "@structures/core/OperationResult";
import { DatabaseSupportTicket } from "@structures/database/aliceDb/DatabaseSupportTicket";
import { Manager } from "@utils/base/Manager";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { StringHelper } from "@utils/helpers/StringHelper";
import {
    ActionRowBuilder,
    AnyThreadChannel,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    EmbedBuilder,
    ForumChannel,
    Message,
    PublicThreadChannel,
    Snowflake,
    TextChannel,
    TimestampStyles,
    channelLink,
    messageLink,
    time,
    userMention,
} from "discord.js";
import { ObjectId } from "mongodb";

/**
 * Represents a support ticket.
 */
export class SupportTicket extends Manager implements DatabaseSupportTicket {
    readonly id: number;
    assigneeIds: Snowflake[];
    readonly authorId: Snowflake;
    guildChannelId: Snowflake;
    threadChannelId: Snowflake;
    controlPanelMessageId: Snowflake;
    readonly trackingMessageId: Snowflake;
    title: string;
    description: string;
    readonly createdAt: Date;
    status: SupportTicketStatus;
    readonly presetId?: number;
    closedAt?: Date;
    readonly _id?: ObjectId;

    /**
     * Whether this ticket is open.
     */
    get isOpen() {
        return this.status === SupportTicketStatus.open;
    }

    /**
     * Whether this ticket is closed.
     */
    get isClosed() {
        return this.status === SupportTicketStatus.closed;
    }

    /**
     * Whether this ticket can be reopened if it is closed.
     */
    get reopenable() {
        // Disallow reopen if the ticket was closed a week ago.
        return (
            this.closedAt !== undefined &&
            DateTimeFormatHelper.getTimeDifference(this.closedAt) >=
                -3600 * 24 * 7 * 1000
        );
    }

    /**
     * The URL to the thread channel containing this ticket.
     */
    get threadChannelURL() {
        return channelLink(this.threadChannelId, Constants.mainServer);
    }

    /**
     * The URL to the staff tracking message of this ticket.
     */
    get trackingMessageURL() {
        return messageLink(
            Constants.supportTicketStaffChannel,
            this.trackingMessageId,
            Constants.mainServer
        );
    }

    private get dbManager() {
        return DatabaseManager.aliceDb.collections.supportTicket;
    }

    /**
     * Creates a support ticket and registers it to the database.
     *
     * @param authorId The author of the ticket.
     * @param title The title of the ticket.
     * @param description The description of the ticket.
     * @param assignees Users who are assigned to the ticket.
     * @param presetId The ID of the ticket preset, if the ticket was made from a preset.
     * @param language The language to create the ticket for. Defaults to English.
     */
    static async create(
        authorId: Snowflake,
        title: string,
        description: string,
        assignees: Snowflake[] = [],
        presetId?: number,
        language: Language = "en"
    ): Promise<OperationResult> {
        const guild = await this.client.guilds.fetch(Constants.mainServer);
        const userChannel = await guild.channels.fetch(
            Constants.supportTicketUserChannel
        );
        const staffChannel = await guild.channels.fetch(
            Constants.supportTicketStaffChannel
        );

        if (
            !(userChannel instanceof TextChannel) ||
            !(staffChannel instanceof TextChannel)
        ) {
            return this.createOperationResult(false, "Invalid channel");
        }

        const dbManager = DatabaseManager.aliceDb.collections.supportTicket;
        const ticketId = await dbManager.getNewId(authorId);
        const threadChannel = await userChannel.threads.create({
            name: `Ticket #${ticketId.toString()} (${authorId})`,
            invitable: false,
            type: ChannelType.PrivateThread,
            reason: "New ticket opened",
        });
        const localization = new SupportTicketLocalization(language);

        const controlPanelMessage = await threadChannel.send({
            content: localization.getTranslation("pleaseWait"),
        });

        const trackingMessage = await staffChannel.send({
            content: localization.getTranslation("pleaseWait"),
        });

        const databaseTicket: DatabaseSupportTicket = {
            authorId: authorId,
            assigneeIds: assignees,
            controlPanelMessageId: controlPanelMessage.id,
            createdAt: new Date(),
            description: description,
            id: ticketId,
            guildChannelId: Constants.supportTicketUserChannel,
            presetId: presetId,
            status: SupportTicketStatus.open,
            title: title,
            threadChannelId: threadChannel.id,
            trackingMessageId: trackingMessage.id,
        };

        const result = await dbManager.insert(databaseTicket);

        if (result.failed()) {
            await threadChannel.delete("Ticket creation failed");
            await trackingMessage.delete();

            return this.createOperationResult(false);
        }

        const ticket = new SupportTicket(databaseTicket);

        await controlPanelMessage.edit({
            content: MessageCreator.createWarn(
                "You may control your ticket from this message or slash commands."
            ),
            embeds: [ticket.toUserEmbed(language)],
            components: ticket.createUserControlPanelButtons(language),
        });
        await controlPanelMessage.pin();

        await trackingMessage.edit({
            content: "",
            embeds: [ticket.toStaffEmbed()],
            components: ticket.createTrackingMessageButtons(),
        });

        await trackingMessage.startThread({
            name: threadChannel.name + " - Staff Discussion",
            reason: "New ticket opened",
        });

        await threadChannel.members.add(authorId);

        return this.createOperationResult(true);
    }

    constructor(
        data: DatabaseSupportTicket = DatabaseManager.aliceDb?.collections
            .supportTicket.defaultDocument ?? {}
    ) {
        super();

        this._id = data._id;
        this.id = data.id;
        this.assigneeIds = data.assigneeIds ?? [];
        this.authorId = data.authorId;
        this.description = data.description;
        this.guildChannelId = data.guildChannelId;
        this.controlPanelMessageId = data.controlPanelMessageId;
        this.createdAt = data.createdAt;
        this.presetId = data.presetId;
        this.status = data.status;
        this.title = data.title;
        this.threadChannelId = data.threadChannelId;
        this.trackingMessageId = data.trackingMessageId;
        this.closedAt = data.closedAt;
    }

    /**
     * Checks whether a user can modify this ticket.
     *
     * @param userId The ID of the user.
     * @returns Whether the user can modify this ticket.
     */
    canModify(userId: Snowflake) {
        return Config.botOwners.includes(userId) || this.authorId === userId;
    }

    /**
     * Closes this ticket.
     *
     * @param language The language of the user who performed this operation.
     * @returns An object containing information about the operation.
     */
    async close(language: Language = "en"): Promise<OperationResult> {
        const localization = this.getLocalization(language);

        if (!this.isOpen) {
            return this.createOperationResult(
                false,
                localization.getTranslation("ticketIsNotOpen")
            );
        }

        const userThreadChannel = await this.getUserThreadChannel();
        if (!userThreadChannel) {
            return this.createOperationResult(
                false,
                localization.getTranslation("cannotGetTicketMessage")
            );
        }

        const staffThreadChannel = await this.getStaffThreadChannel();
        if (!staffThreadChannel) {
            return this.createOperationResult(
                false,
                localization.getTranslation("cannotGetTicketMessage")
            );
        }

        this.status = SupportTicketStatus.closed;
        this.closedAt = new Date();

        const result = await this.dbManager.updateOne(
            {
                id: this.id,
                authorId: this.authorId,
            },
            { $set: { status: this.status, closedAt: this.closedAt } }
        );

        if (result.failed()) {
            return result;
        }

        await this.updateMessages(language);

        if (!userThreadChannel.locked) {
            await userThreadChannel.setLocked(true, "Ticket closed");
        }

        if (!userThreadChannel.archived) {
            await userThreadChannel.setArchived(true, "Ticket closed");
        }

        if (!staffThreadChannel.locked) {
            await staffThreadChannel.setLocked(true, "Ticket closed");
        }

        if (!staffThreadChannel.archived) {
            await staffThreadChannel.setArchived(true, "Ticket closed");
        }

        return this.createOperationResult(true);
    }

    /**
     * Reopens this ticket.
     *
     * @param language The language of the user who performed this operation.
     * @returns An object containing information about the operation.
     */
    async reopen(language: Language = "en"): Promise<OperationResult> {
        const localization = this.getLocalization(language);

        if (this.isOpen) {
            return this.createOperationResult(
                false,
                localization.getTranslation("ticketIsOpen")
            );
        }

        if (!this.reopenable) {
            return this.createOperationResult(
                false,
                localization.getTranslation("ticketIsTooOldToOpen")
            );
        }

        const userThreadChannel = await this.getUserThreadChannel();
        if (!userThreadChannel) {
            return this.createOperationResult(
                false,
                localization.getTranslation("cannotGetTicketMessage")
            );
        }

        const staffThreadChannel = await this.getStaffThreadChannel();
        if (!staffThreadChannel) {
            return this.createOperationResult(
                false,
                localization.getTranslation("cannotGetTicketMessage")
            );
        }

        this.status = SupportTicketStatus.open;
        delete this.closedAt;

        const result = await this.dbManager.updateOne(
            {
                id: this.id,
                authorId: this.authorId,
            },
            { $set: { status: this.status }, $unset: { closedAt: 1 } }
        );

        if (result.failed()) {
            return result;
        }

        await userThreadChannel.setArchived(false, "Ticket reopened");
        await userThreadChannel.setLocked(false, "Ticket reopened");

        await staffThreadChannel.setArchived(false, "Ticket reopened");
        await staffThreadChannel.setLocked(false, "Ticket reopened");

        await this.updateMessages(language);

        return this.createOperationResult(true);
    }

    /**
     * Edits the details of this ticket.
     *
     * @param title The title of the ticket.
     * @param description The description of the ticket.
     * @param language The language of the user who performed this operation. Defaults to English.
     * @returns An object containing information about the operation.
     */
    async edit(
        title: string,
        description: string,
        language: Language = "en"
    ): Promise<OperationResult> {
        const localization = this.getLocalization(language);

        if (!this.isOpen) {
            return this.createOperationResult(
                false,
                localization.getTranslation("ticketIsNotOpen")
            );
        }

        this.title = title;
        this.description = description;

        const result = await this.dbManager.updateOne(
            {
                id: this.id,
                authorId: this.authorId,
            },
            { $set: { title: title, description: description } }
        );

        if (result.failed()) {
            return result;
        }

        await this.updateMessages(language);

        return this.createOperationResult(true);
    }

    /**
     * Moves this ticket to a channel.
     *
     * @param channel The channel to move this ticket to.
     * @param language The language of the user who performed this operation. Defaults to English.
     * @returns An object containing information about the operation.
     */
    async move(
        channel: TextChannel | ForumChannel,
        language: Language = "en"
    ): Promise<OperationResult> {
        const localization = this.getLocalization(language);

        if (!this.isOpen) {
            return this.createOperationResult(
                false,
                localization.getTranslation("ticketIsNotOpen")
            );
        }

        const currentUserThreadChannel = await this.getUserThreadChannel();
        if (!currentUserThreadChannel) {
            return this.createOperationResult(
                false,
                localization.getTranslation("cannotGetTicketMessage")
            );
        }

        const newUserThreadChannel = await channel.threads
            .create({
                name: `Ticket #${this.id.toString()} (${this.authorId})`,
                message: {
                    embeds: [this.toUserEmbed(language)],
                    components: this.createUserControlPanelButtons(language),
                },
                invitable: false,
                type:
                    channel instanceof TextChannel
                        ? ChannelType.PrivateThread
                        : ChannelType.PublicThread,
            })
            .catch(() => null);
        if (!newUserThreadChannel) {
            return this.createOperationResult(
                false,
                localization.getTranslation("cannotCreateThread")
            );
        }

        const result = await this.dbManager.updateOne(
            {
                id: this.id,
            },
            {
                $set: {
                    guildChannelId: channel.id,
                    threadChannelId: newUserThreadChannel.id,
                    controlPanelMessageId: newUserThreadChannel.id,
                },
            }
        );

        if (result.failed()) {
            await newUserThreadChannel.delete("Ticket movement failed");

            return result;
        }

        await currentUserThreadChannel.send({
            content: MessageCreator.createWarn(
                localization.getTranslation("ticketMovedNotice"),
                currentUserThreadChannel.toString()
            ),
        });

        await currentUserThreadChannel.setLocked(true, "Ticket moved");
        await currentUserThreadChannel.setArchived(true, "Ticket moved");

        this.guildChannelId = channel.id;
        this.threadChannelId = newUserThreadChannel.id;
        // Starter message ID = thread ID
        this.controlPanelMessageId = newUserThreadChannel.id;

        return this.createOperationResult(
            await this.updateMessages(language),
            localization.getTranslation("cannotGetTicketMessage")
        );
    }

    /**
     * Assigns a user to this ticket.
     *
     * @param userId The ID of the user.
     * @param language The language of the user who performed this operation. Defaults to English.
     * @returns An object containing information about the operation.
     */
    async assign(
        userId: Snowflake,
        language: Language = "en"
    ): Promise<OperationResult> {
        const localization = this.getLocalization(language);

        if (!this.isOpen) {
            return this.createOperationResult(
                false,
                localization.getTranslation("ticketIsNotOpen")
            );
        }

        if (this.assigneeIds.includes(userId)) {
            return this.createOperationResult(
                false,
                localization.getTranslation("userIsAlreadyAssigned")
            );
        }

        const result = await this.dbManager.updateOne(
            {
                id: this.id,
                authorId: this.authorId,
            },
            {
                $addToSet: {
                    assigneeIds: userId,
                },
            }
        );

        if (result.failed()) {
            return result;
        }

        this.assigneeIds.push(userId);

        if (!(await this.updateMessages(language))) {
            return this.createOperationResult(
                false,
                localization.getTranslation("cannotGetTicketMessage")
            );
        }

        return result;
    }

    /**
     * Unassigns a user to this ticket.
     *
     * @param userId The ID of the user.
     * @param language The language of the user who performed this operation. Defaults to English.
     * @returns An object containing information about the operation.
     */
    async unassign(
        userId: Snowflake,
        language: Language = "en"
    ): Promise<OperationResult> {
        const localization = this.getLocalization(language);

        if (!this.isOpen) {
            return this.createOperationResult(
                false,
                localization.getTranslation("ticketIsNotOpen")
            );
        }

        if (!this.assigneeIds.includes(userId)) {
            return this.createOperationResult(
                false,
                localization.getTranslation("userIsNotAssigned")
            );
        }

        const result = await this.dbManager.updateOne(
            {
                id: this.id,
                authorId: this.authorId,
            },
            {
                $pull: {
                    assigneeIds: userId,
                },
            }
        );

        if (result.failed()) {
            return result;
        }

        this.assigneeIds.splice(this.assigneeIds.indexOf(userId), 1);

        if (!(await this.updateMessages(language))) {
            return this.createOperationResult(
                false,
                localization.getTranslation("cannotGetTicketMessage")
            );
        }

        return result;
    }

    /**
     * Creates an {@link EmbedBuilder} from this {@link SupportTicket} for the user thread channel.
     *
     * @param language The language to create for. Defaults to English.
     */
    toUserEmbed(language: Language = "en"): EmbedBuilder {
        const localization = this.getLocalization(language);

        const embed = EmbedCreator.createNormalEmbed({
            footerText:
                `${localization.getTranslation("embedStatus")}: ${this.statusToString(language)}` +
                (this.presetId !== undefined
                    ? ` | ${StringHelper.formatString(localization.getTranslation("embedTicketFromPreset"), this.presetId.toString())}`
                    : ""),
        })
            .setTitle(this.title)
            .setColor(this.isOpen ? "LuminousVividPink" : "Purple")
            .setTimestamp(this.createdAt)
            .addFields({
                name: localization.getTranslation("embedAuthor"),
                value: `${userMention(this.authorId)} (${this.authorId})`,
                inline: true,
            });

        if (this.closedAt) {
            embed.addFields({
                name: localization.getTranslation("embedCloseDate"),
                value: time(this.closedAt, TimestampStyles.LongDateTime),
                inline: true,
            });
        }

        embed.addFields(
            {
                name: localization.getTranslation("embedTicketAssignees"),
                value:
                    this.assigneeIds
                        .map((v) => `- ${userMention(v)} (${v})`)
                        .join("\n") || localization.getTranslation("none"),
            },
            {
                name: localization.getTranslation("embedTicketDescription"),
                value: this.description,
            }
        );

        return embed;
    }

    /**
     * Creates an {@link EmbedBuilder} from this {@link SupportTicket} for the user thread channel.
     */
    toStaffEmbed(): EmbedBuilder {
        const localization = this.getLocalization("en");

        const embed = EmbedCreator.createNormalEmbed({
            footerText:
                `${localization.getTranslation("embedStatus")}: ${this.statusToString()}` +
                (this.presetId !== undefined
                    ? ` | ${StringHelper.formatString(localization.getTranslation("embedTicketFromPreset"), this.presetId.toString())}`
                    : ""),
        })
            .setTitle(this.title)
            .setColor(this.isOpen ? "Green" : "Purple")
            .setTimestamp(this.createdAt)
            .addFields({
                name: localization.getTranslation("embedAuthor"),
                value: `${userMention(this.authorId)} (${this.authorId})`,
                inline: true,
            });

        if (this.closedAt) {
            embed.addFields({
                name: localization.getTranslation("embedCloseDate"),
                value: time(this.closedAt, TimestampStyles.LongDateTime),
                inline: true,
            });
        }

        embed.addFields(
            {
                name: localization.getTranslation("embedTicketAssignees"),
                value:
                    this.assigneeIds
                        .map((v) => `- ${userMention(v)} (${v})`)
                        .join("\n") || localization.getTranslation("none"),
            },
            {
                name: localization.getTranslation("embedTicketDescription"),
                // Truncate the description for staff embeds.
                value:
                    this.description.length > 250
                        ? this.description.substring(0, 248) + "..."
                        : this.description,
            }
        );

        return embed;
    }

    /**
     * Creates buttons for the user "control panel" message.
     *
     * @param language The language to create the buttons for.
     * @returns An array of {@link ActionRowBuilder} containing the buttons.
     */
    private createUserControlPanelButtons(
        language: Language = "en"
    ): ActionRowBuilder<ButtonBuilder>[] {
        const localization = this.getLocalization(language);
        const rowBuilder = new ActionRowBuilder<ButtonBuilder>();

        if (this.isOpen) {
            rowBuilder.addComponents(
                new ButtonBuilder()
                    .setCustomId(`editSupportTicket#${this.threadChannelId}`)
                    .setEmoji(Symbols.pencil)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(!this.isOpen)
                    .setLabel(
                        localization.getTranslation(
                            "userControlPanelEditButtonLabel"
                        )
                    ),
                new ButtonBuilder()
                    .setCustomId(`closeSupportTicket#${this.threadChannelId}`)
                    .setEmoji(Symbols.inboxTray)
                    .setStyle(ButtonStyle.Danger)
                    .setLabel(
                        localization.getTranslation(
                            "userControlPanelCloseButtonLabel"
                        )
                    ),
                new ButtonBuilder()
                    .setCustomId(`moveSupportTicket#${this.threadChannelId}`)
                    .setEmoji(Symbols.books)
                    .setStyle(ButtonStyle.Danger)
                    .setLabel(
                        localization.getTranslation(
                            "userControlPanelMoveButtonLabel"
                        )
                    )
            );
        } else if (this.reopenable) {
            rowBuilder.addComponents(
                new ButtonBuilder()
                    .setCustomId(`reopenSupportTicket#${this.threadChannelId}`)
                    .setEmoji(Symbols.outboxTray)
                    .setStyle(ButtonStyle.Primary)
                    .setLabel(
                        localization.getTranslation(
                            "userControlPanelOpenButtonLabel"
                        )
                    )
            );
        }

        rowBuilder.addComponents(
            new ButtonBuilder()
                .setEmoji(Symbols.magnifyingGlassTiltedRight)
                .setStyle(ButtonStyle.Link)
                .setLabel(
                    localization.getTranslation(
                        "userControlPanelTrackingMessageButtonLabel"
                    )
                )
                .setURL(this.trackingMessageURL)
        );

        return [rowBuilder];
    }

    /**
     * Creates buttons for the staff tracking message.
     *
     * @returns An {@link ActionRowBuilder} containing the buttons.
     */
    private createTrackingMessageButtons(): ActionRowBuilder<ButtonBuilder>[] {
        const localization = this.getLocalization("en");
        const rowBuilders: ActionRowBuilder<ButtonBuilder>[] = [];
        const ticketChannelButton = new ButtonBuilder()
            .setEmoji(Symbols.magnifyingGlassTiltedRight)
            .setStyle(ButtonStyle.Link)
            .setLabel(
                localization.getTranslation(
                    "trackingMessageTicketChannelButtonLabel"
                )
            )
            .setURL(this.threadChannelURL);

        if (this.isOpen) {
            const firstRowBuilder = new ActionRowBuilder<ButtonBuilder>();
            const secondRowBuilder = new ActionRowBuilder<ButtonBuilder>();

            firstRowBuilder.addComponents(
                new ButtonBuilder()
                    .setCustomId(`assignSupportTicket#${this.threadChannelId}`)
                    .setEmoji(Symbols.bookmark)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(!this.isOpen)
                    .setLabel(
                        localization.getTranslation(
                            "trackingMessageAssignButtonLabel"
                        )
                    ),
                new ButtonBuilder()
                    .setCustomId(
                        `unassignSupportTicket#${this.threadChannelId}`
                    )
                    .setEmoji(Symbols.label)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(!this.isOpen)
                    .setLabel(
                        localization.getTranslation(
                            "trackingMessageUnassignButtonLabel"
                        )
                    ),
                new ButtonBuilder()
                    .setCustomId(`editSupportTicket#${this.threadChannelId}`)
                    .setEmoji(Symbols.pencil)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(!this.isOpen)
                    .setLabel(
                        localization.getTranslation(
                            "userControlPanelEditButtonLabel"
                        )
                    ),
                new ButtonBuilder()
                    .setCustomId(`moveSupportTicket#${this.threadChannelId}`)
                    .setEmoji(Symbols.books)
                    .setStyle(ButtonStyle.Danger)
                    .setLabel(
                        localization.getTranslation(
                            "trackingMessageMoveButtonLabel"
                        )
                    ),
                new ButtonBuilder()
                    .setCustomId(`closeSupportTicket#${this.threadChannelId}`)
                    .setEmoji(Symbols.inboxTray)
                    .setStyle(ButtonStyle.Danger)
                    .setLabel(
                        localization.getTranslation(
                            "userControlPanelCloseButtonLabel"
                        )
                    )
            );

            secondRowBuilder.addComponents(ticketChannelButton);

            rowBuilders.push(firstRowBuilder, secondRowBuilder);
        } else {
            const rowBuilder = new ActionRowBuilder<ButtonBuilder>();

            if (this.reopenable) {
                rowBuilder.addComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            `reopenSupportTicket#${this.threadChannelId}`
                        )
                        .setEmoji(Symbols.outboxTray)
                        .setStyle(ButtonStyle.Primary)
                        .setLabel(
                            localization.getTranslation(
                                "userControlPanelOpenButtonLabel"
                            )
                        )
                );
            }

            rowBuilder.addComponents(ticketChannelButton);

            rowBuilders.push(rowBuilder);
        }

        return rowBuilders;
    }

    /**
     * Converts the status of this ticket to its string equivalent.
     *
     * @param language The language to get the string from.
     * @returns The string representation.
     */
    statusToString(language: Language = "en") {
        const localization = this.getLocalization(language);

        switch (this.status) {
            case SupportTicketStatus.open:
                return localization.getTranslation("embedTicketOpen");
            case SupportTicketStatus.closed:
                return localization.getTranslation("embedTicketClosed");
        }
    }

    private async getUserThreadChannel(): Promise<AnyThreadChannel | null> {
        const guild = await this.client.guilds
            .fetch(Constants.mainServer)
            .catch(() => null);

        if (!guild) {
            return null;
        }

        const channel = await guild.channels
            .fetch(this.guildChannelId)
            .catch(() => null);

        if (
            !channel ||
            (channel.type !== ChannelType.GuildText &&
                channel.type !== ChannelType.GuildForum)
        ) {
            return null;
        }

        return channel.threads.fetch(this.threadChannelId).catch(() => null);
    }

    private async getStaffThreadChannel(): Promise<PublicThreadChannel<false> | null> {
        const guild = await this.client.guilds
            .fetch(Constants.mainServer)
            .catch(() => null);

        if (!guild) {
            return null;
        }

        const channel = await guild.channels
            .fetch(Constants.supportTicketStaffChannel)
            .catch(() => null);

        if (!(channel instanceof TextChannel)) {
            return null;
        }

        return channel.threads
            .fetch(this.trackingMessageId)
            .catch(() => null) as Promise<PublicThreadChannel<false> | null>;
    }

    private async updateMessages(language: Language = "en"): Promise<boolean> {
        const controlPanelMessage = await this.getUserControlPanelMessage();
        if (!controlPanelMessage) {
            return false;
        }

        await controlPanelMessage.edit({
            embeds: [this.toUserEmbed(language)],
            components: this.createUserControlPanelButtons(language),
        });

        const trackingMessage = await this.getTrackingMessage();
        if (!trackingMessage) {
            return false;
        }

        await trackingMessage.edit({
            embeds: [this.toStaffEmbed()],
            components: this.createTrackingMessageButtons(),
        });

        return true;
    }

    private async getUserControlPanelMessage(): Promise<Message<true> | null> {
        const thread = await this.getUserThreadChannel();

        return (
            thread?.messages
                .fetch(this.controlPanelMessageId)
                .catch(() => null) ?? null
        );
    }

    private async getTrackingMessage(): Promise<Message<true> | null> {
        const guild = await this.client.guilds
            .fetch(Constants.mainServer)
            .catch(() => null);

        if (!guild) {
            return null;
        }

        const channel = await guild.channels
            .fetch(Constants.supportTicketStaffChannel)
            .catch(() => null);

        if (!(channel instanceof TextChannel)) {
            return null;
        }

        return channel.messages.fetch(this.trackingMessageId).catch(() => null);
    }

    private getLocalization(language: Language) {
        return new SupportTicketLocalization(language);
    }
}
