import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { MessageContextMenuCommand } from "structures/core/MessageContextMenuCommand";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { CompareScoreLocalization } from "@localization/interactions/contextmenus/message/compareScore/CompareScoreLocalization";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { Modes } from "@rian8337/osu-base";
import { GuildMember, InteractionReplyOptions } from "discord.js";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { ReplayHelper } from "@utils/helpers/ReplayHelper";
import { PPProcessorRESTManager } from "@utils/managers/PPProcessorRESTManager";
import { DroidHelper } from "@utils/helpers/DroidHelper";

export const run: MessageContextMenuCommand["run"] = async (_, interaction) => {
    const localization = new CompareScoreLocalization(
        CommandHelper.getLocale(interaction),
    );

    const beatmapId = BeatmapManager.getBeatmapIDFromMessage(
        interaction.targetMessage,
    );

    if (!beatmapId) {
        interaction.ephemeral = true;

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("beatmapNotFound"),
            ),
        });
    }

    const bindInfo =
        await DatabaseManager.elainaDb.collections.userBind.getFromUser(
            interaction.user,
            {
                projection: {
                    _id: 0,
                    uid: 1,
                },
            },
        );

    if (!bindInfo) {
        interaction.ephemeral = true;

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                new ConstantsLocalization(localization.language).getTranslation(
                    Constants.selfNotBindedReject,
                ),
            ),
        });
    }

    await InteractionHelper.deferReply(interaction);

    const player = await DroidHelper.getPlayer(bindInfo.uid, [
        "id",
        "username",
    ]);

    if (!player) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("profileNotFound"),
            ),
        });
    }

    const beatmapInfo = await BeatmapManager.getBeatmap(beatmapId);

    if (!beatmapInfo) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("beatmapNotFound"),
            ),
        });
    }

    const score = await DroidHelper.getScore(player.id, beatmapInfo.hash, [
        "id",
        "uid",
        "hash",
        "score",
        "filename",
        "hash",
        "mode",
        "combo",
        "mark",
        "perfect",
        "good",
        "bad",
        "miss",
        "date",
    ]);

    if (!score) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("scoreNotFound"),
            ),
        });
    }

    BeatmapManager.setChannelLatestBeatmap(
        interaction.channelId,
        beatmapInfo.hash,
    );

    const scoreAttribs = await PPProcessorRESTManager.getOnlineScoreAttributes(
        score.uid,
        score.hash,
        Modes.droid,
        PPCalculationMethod.live,
    );

    const options: InteractionReplyOptions = {
        content: MessageCreator.createAccept(
            localization.getTranslation("comparePlayDisplay"),
            player.username,
        ),
        embeds: [
            await EmbedCreator.createRecentPlayEmbed(
                score,
                (<GuildMember | null>interaction.member)?.displayColor,
                scoreAttribs?.attributes,
                undefined,
                localization.language,
            ),
        ],
    };

    const replay = await ReplayHelper.analyzeReplay(score);

    if (!replay.data) {
        return InteractionHelper.reply(interaction, options);
    }

    MessageButtonCreator.createRecentScoreButton(
        interaction,
        options,
        beatmapInfo.beatmap,
        replay.data,
    );
};

export const config: MessageContextMenuCommand["config"] = {
    name: "Compare Score",
};
