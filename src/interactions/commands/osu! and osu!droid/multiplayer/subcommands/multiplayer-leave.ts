import { DatabaseManager } from "@alice-database/DatabaseManager";
import { MultiplayerRoom } from "@alice-database/utils/aliceDb/MultiplayerRoom";
import { OperationResult } from "@alice-interfaces/core/OperationResult";
import { SlashSubcommand } from "@alice-interfaces/core/SlashSubcommand";
import { MultiplayerPlayer } from "@alice-interfaces/multiplayer/MultiplayerPlayer";
import { MultiplayerLocalization } from "@alice-localization/interactions/commands/osu! and osu!droid/multiplayer/MultiplayerLocalization";
import { MessageCreator } from "@alice-utils/creators/MessageCreator";
import { ArrayHelper } from "@alice-utils/helpers/ArrayHelper";
import { CommandHelper } from "@alice-utils/helpers/CommandHelper";
import { InteractionHelper } from "@alice-utils/helpers/InteractionHelper";
import { StringHelper } from "@alice-utils/helpers/StringHelper";

export const run: SlashSubcommand["run"] = async (_, interaction) => {
    const localization: MultiplayerLocalization = new MultiplayerLocalization(
        await CommandHelper.getLocale(interaction)
    );

    const room: MultiplayerRoom | null =
        await DatabaseManager.aliceDb.collections.multiplayerRoom.getFromChannel(
            interaction.channelId
        );

    if (!room) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("selfNotInRoom")
            ),
        });
    }

    room.players.splice(
        room.players.findIndex((v) => v.discordId === interaction.user.id),
        1
    );

    let result: OperationResult;

    const changeHost: boolean = room.settings.roomHost === interaction.user.id;

    if (room.players.length > 0) {
        if (changeHost) {
            room.settings.roomHost =
                ArrayHelper.getRandomArrayElement<MultiplayerPlayer>(
                    room.players
                ).discordId;
        }

        result = await room.updateRoom();
    } else {
        result = await room.deleteRoom();
    }

    if (!result.success) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("playerLeaveFailed"),
                result.reason!
            ),
        });
    }

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            `${localization.getTranslation("playerLeaveSuccess")}${
                changeHost && room.players.length > 0
                    ? `\n\n${StringHelper.formatString(
                          localization.getTranslation(
                              "roomHostChangeNotification"
                          ),
                          `<@${room.settings.roomHost}>`
                      )}`
                    : ""
            }`
        ),
    });
};

export const config: SlashSubcommand["config"] = {
    permissions: [],
};