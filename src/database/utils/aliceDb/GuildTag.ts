import { DatabaseManager } from "@database/DatabaseManager";
import { DatabaseGuildTag } from "structures/database/aliceDb/DatabaseGuildTag";
import { OperationResult } from "structures/core/OperationResult";
import { Manager } from "@utils/base/Manager";
import { ObjectId } from "mongodb";

/**
 * Represents guild-specific tags.
 */
export class GuildTag extends Manager implements DatabaseGuildTag {
    guildid: string;
    author: string;
    name: string;
    date: number;
    content: string;
    attachment_message: string;
    attachments: string[];

    /**
     * The BSON object ID of this document in the database.
     */
    readonly _id?: ObjectId;

    constructor(
        data: DatabaseGuildTag = DatabaseManager.aliceDb?.collections.guildTags
            .defaultDocument ?? {},
    ) {
        super();

        this._id = data._id;
        this.guildid = data.guildid;
        this.author = data.author;
        this.name = data.name;
        this.date = data.date;
        this.content = data.content;
        this.attachment_message = data.attachment_message;
        this.attachments = data.attachments ?? [];
    }

    /**
     * Updates this tag in the tag database.
     *
     * @returns An object containing information about the operation.
     */
    updateTag(): Promise<OperationResult> {
        return DatabaseManager.aliceDb.collections.guildTags.updateOne(
            {
                guildid: this.guildid,
                name: this.name,
            },
            {
                $set: {
                    author: this.author,
                    name: this.name,
                    date: this.date,
                    content: this.content,
                    attachment_message: this.attachment_message,
                    attachments: this.attachments,
                },
            },
        );
    }
}
