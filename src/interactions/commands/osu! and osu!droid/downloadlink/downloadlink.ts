import { CommandCategory } from "@enums/core/CommandCategory";
import { DownloadlinkLocalization } from "@localization/interactions/commands/osu! and osu!droid/downloadlink/DownloadlinkLocalization";
import { RankedStatus } from "@rian8337/osu-base";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
} from "discord.js";
import { SlashCommand } from "structures/core/SlashCommand";

export const run: SlashCommand["run"] = async (_, interaction) => {
    const localization = new DownloadlinkLocalization(
        CommandHelper.getLocale(interaction)
    );

    const beatmapHash = BeatmapManager.getChannelLatestBeatmap(
        interaction.channelId
    );

    if (!beatmapHash) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noCachedBeatmap")
            ),
        });
    }

    await InteractionHelper.deferReply(interaction);

    const beatmap = await BeatmapManager.getBeatmap(beatmapHash, {
        checkFile: false,
    });

    if (!beatmap) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("beatmapNotAvailable")
            ),
        });
    }

    const options = EmbedCreator.createBeatmapEmbed(
        beatmap,
        undefined,
        localization.language
    );

    const downloadActionRow =
        new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel("osu!")
                .setStyle(ButtonStyle.Link)
                .setURL(`https://osu.ppy.sh/d/${beatmap.beatmapSetId}`),
            new ButtonBuilder()
                .setLabel("Sayobot")
                .setStyle(ButtonStyle.Link)
                .setURL(
                    `https://txy1.sayobot.cn/beatmaps/download/full/${beatmap.beatmapSetId}`
                ),
            new ButtonBuilder()
                .setLabel("Beatconnect")
                .setStyle(ButtonStyle.Link)
                .setURL(`https://beatconnect.io/b/${beatmap.beatmapSetId}`),
            new ButtonBuilder()
                .setLabel("Nerina")
                .setStyle(ButtonStyle.Link)
                .setURL(`https://api.nerinyan.moe/d/${beatmap.beatmapSetId}`)
        );

    if (
        beatmap.approved >= RankedStatus.ranked &&
        beatmap.approved !== RankedStatus.qualified
    ) {
        downloadActionRow.addComponents(
            new ButtonBuilder()
                .setLabel("Ripple")
                .setStyle(ButtonStyle.Link)
                .setURL(`https://storage.ripple.moe/d/${beatmap.beatmapSetId}`)
        );
    }

    const containerBuilder = options.components![0] as ContainerBuilder;

    containerBuilder
        .spliceComponents(2, containerBuilder.components.length)
        .addActionRowComponents(downloadActionRow);

    InteractionHelper.reply(interaction, options, true);
};

export const category: SlashCommand["category"] = CommandCategory.osu;

export const config: SlashCommand["config"] = {
    name: "downloadlink",
    description:
        "Grabs the download link of the latest beatmap cache in the channel (if any).",
    options: [],
    example: [
        {
            command: "downloadlink",
            description:
                "will grab the download link of the cached beatmap in the channel (if any).",
        },
        {
            command: "downloadlink",
            arguments: [
                {
                    name: "beatmap",
                    value: 1884658,
                },
            ],
            description:
                "will grab the download link of the beatmap with ID 1884658.",
        },
        {
            command: "downloadlink",
            arguments: [
                {
                    name: "beatmap",
                    value: "https://osu.ppy.sh/beatmapsets/902745#osu/1884658",
                },
            ],
            description: "will grab the download link of the linked beatmap.",
        },
        {
            command: "downloadlink",
            arguments: [
                {
                    name: "beatmap",
                    value: "https://osu.ppy.sh/b/1884658",
                },
            ],
            description: "will grab the download link of the linked beatmap.",
        },
    ],
};
