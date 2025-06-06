import { DatabaseManager } from "@database/DatabaseManager";
import { PlayerInfo } from "@database/utils/aliceDb/PlayerInfo";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { ProfileLocalization } from "@localization/interactions/commands/osu! and osu!droid/profile/ProfileLocalization";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashSubcommand<false>["run"] = async (_, interaction) => {
    const playerInfo: PlayerInfo | null =
        await DatabaseManager.aliceDb.collections.playerInfo.getFromUser(
            interaction.user,
            {
                projection: {
                    _id: 0,
                    "picture_config.bgColor": 1,
                },
            },
        );

    const color: string = playerInfo?.picture_config.bgColor ?? "#008BFF";

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            new ProfileLocalization(
                CommandHelper.getLocale(interaction),
            ).getTranslation("infoBoxBackgroundColorInfo"),
            color,
        ),
    });
};
