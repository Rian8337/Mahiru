import { DatabaseManager } from "@database/DatabaseManager";
import { DatabasePlayerSkin } from "structures/database/aliceDb/DatabasePlayerSkin";
import { Manager } from "@utils/base/Manager";
import { ObjectId } from "mongodb";
import { Channel, Snowflake } from "discord.js";
import { SkinPreview } from "@structures/skins/SkinPreview";
import { OperationResult } from "@structures/core/OperationResult";
import { Constants } from "@core/Constants";

/**
 * Represents an information about a Discord user's osu!/osu!droid skin.
 */
export class PlayerSkin extends Manager implements DatabasePlayerSkin {
    discordid: Snowflake;
    description: string;
    url: string;
    name: string;
    previews?: SkinPreview;
    readonly _id?: ObjectId;

    constructor(
        data: DatabasePlayerSkin = DatabaseManager.aliceDb?.collections
            .playerSkins.defaultDocument ?? {},
    ) {
        super();

        this._id = data._id;
        this.discordid = data.discordid;
        this.description = data.description;
        this.name = data.name;
        this.url = data.url;
        this.previews = data.previews;
    }

    /**
     * Deletes this skin.
     *
     * @returns An object containing information about the operation.
     */
    async delete(): Promise<OperationResult> {
        if (this.previews) {
            // Delete attachments
            const skinChannel: Channel | null =
                await this.client.channels.fetch(Constants.skinPreviewChannel);

            if (skinChannel?.isTextBased()) {
                for (const preview of Object.values(this.previews)) {
                    await skinChannel.messages.delete(preview.messageId);
                }
            }
        }

        return DatabaseManager.aliceDb.collections.playerSkins.deleteOne({
            name: this.name,
        });
    }
}
