import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { UserBind } from "@database/utils/elainaDb/UserBind";
import {
    ApplicationCommandOptionType,
    InteractionReplyOptions,
} from "discord.js";
import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { GuildMember } from "discord.js";
import { Player, Score } from "@rian8337/osu-droid-utilities";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { RecentLocalization } from "@localization/interactions/commands/osu! and osu!droid/recent/RecentLocalization";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { Modes } from "@rian8337/osu-base";
import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { ReplayHelper } from "@utils/helpers/ReplayHelper";
import { PPProcessorRESTManager } from "@utils/managers/PPProcessorRESTManager";
import { RecentPlay } from "@database/utils/aliceDb/RecentPlay";
import { ScoreHelper } from "@utils/helpers/ScoreHelper";
import { StringHelper } from "@utils/helpers/StringHelper";
import { OfficialDatabaseUser } from "@database/official/schema/OfficialDatabaseUser";
import { DroidHelper } from "@utils/helpers/DroidHelper";
import { OfficialDatabaseScore } from "@database/official/schema/OfficialDatabaseScore";

export const run: SlashCommand["run"] = async (_, interaction) => {
    const localization = new RecentLocalization(
        CommandHelper.getLocale(interaction),
    );

    const discordid = interaction.options.getUser("user")?.id;
    let uid = interaction.options.getInteger("uid");
    const username = interaction.options.getString("username");
    const considerNonOverwrite =
        interaction.options.getBoolean("considernonoverwrite") ?? true;

    if ([discordid, uid, username].filter(Boolean).length > 1) {
        interaction.ephemeral = true;

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("tooManyOptions"),
            ),
        });
    }

    await InteractionHelper.deferReply(interaction);

    const dbManager = DatabaseManager.elainaDb.collections.userBind;
    let bindInfo: UserBind | null = null;
    let player: Pick<OfficialDatabaseUser, "id" | "username"> | Player | null =
        null;

    switch (true) {
        case !!uid:
            player = await DroidHelper.getPlayer(uid!, ["id", "username"]);

            uid ??= player?.id ?? null;

            break;
        case !!username:
            if (!StringHelper.isUsernameValid(username)) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("playerNotFound"),
                    ),
                });
            }

            player = await DroidHelper.getPlayer(username, ["id", "username"]);

            uid ??= player?.id ?? null;

            break;
        default:
            // If no arguments are specified, default to self
            bindInfo = await dbManager.getFromUser(
                discordid ?? interaction.user.id,
                {
                    projection: {
                        _id: 0,
                        uid: 1,
                    },
                },
            );

            if (!bindInfo) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        new ConstantsLocalization(
                            localization.language,
                        ).getTranslation(
                            discordid
                                ? Constants.userNotBindedReject
                                : Constants.selfNotBindedReject,
                        ),
                    ),
                });
            }

            player = await DroidHelper.getPlayer(bindInfo.uid, [
                "id",
                "username",
            ]);
    }

    if (!player) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("playerNotFound"),
            ),
        });
    }

    const index = interaction.options.getInteger("index") ?? 1;
    let score:
        | Pick<
              OfficialDatabaseScore,
              | "id"
              | "uid"
              | "hash"
              | "score"
              | "filename"
              | "mode"
              | "combo"
              | "miss"
              | "perfect"
              | "good"
              | "bad"
              | "mark"
              | "date"
          >
        | Score
        | RecentPlay
        | undefined;

    if (player instanceof Player) {
        const recentPlays = considerNonOverwrite
            ? await ScoreHelper.getRecentScores(player.id, player.recentPlays)
            : player.recentPlays;

        if (recentPlays.length === 0) {
            return InteractionHelper.reply(interaction, {
                content: MessageCreator.createReject(
                    localization.getTranslation("playerHasNoRecentPlays"),
                ),
            });
        }

        score = recentPlays[index - 1];
    } else {
        const recentPlays = await DroidHelper.getRecentScores(
            player.id,
            undefined,
            undefined,
            [
                "id",
                "uid",
                "hash",
                "score",
                "filename",
                "mode",
                "combo",
                "miss",
                "perfect",
                "good",
                "bad",
                "mark",
                "date",
            ],
        ).then((res) =>
            considerNonOverwrite
                ? ScoreHelper.getRecentScores(player.id, res)
                : res,
        );

        if (recentPlays.length === 0) {
            return InteractionHelper.reply(interaction, {
                content: MessageCreator.createReject(
                    localization.getTranslation("playerHasNoRecentPlays"),
                ),
            });
        }

        score = recentPlays[index - 1];
    }

    if (!score) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("playIndexOutOfBounds"),
                index.toString(),
            ),
        });
    }

    BeatmapManager.setChannelLatestBeatmap(interaction.channelId, score.hash);

    const scoreAttribs =
        score instanceof RecentPlay
            ? (score.droidAttribs ?? null)
            : (
                  await PPProcessorRESTManager.getOnlineScoreAttributes(
                      score.uid,
                      score.hash,
                      Modes.droid,
                      PPCalculationMethod.live,
                  )
              )?.attributes;

    const options: InteractionReplyOptions = {
        content: MessageCreator.createAccept(
            localization.getTranslation("recentPlayDisplay"),
            player.username,
        ),
        embeds: [
            await EmbedCreator.createRecentPlayEmbed(
                score,
                (<GuildMember | null>interaction.member)?.displayColor,
                scoreAttribs,
                score instanceof RecentPlay
                    ? (score.osuAttribs ?? null)
                    : undefined,
                localization.language,
            ),
        ],
    };

    const replay = await ReplayHelper.analyzeReplay(score);

    if (!replay.data) {
        return InteractionHelper.reply(interaction, options);
    }

    const beatmapInfo = await BeatmapManager.getBeatmap(score.hash);

    if (beatmapInfo?.hasDownloadedBeatmap()) {
        MessageButtonCreator.createRecentScoreButton(
            interaction,
            options,
            beatmapInfo.beatmap,
            replay.data,
        );
    } else {
        InteractionHelper.reply(interaction, options);
    }
};

export const category: SlashCommand["category"] = CommandCategory.osu;

export const config: SlashCommand["config"] = {
    name: "recent",
    description: "Shows the recent play of yourself or a player.",
    options: [
        {
            name: "user",
            type: ApplicationCommandOptionType.User,
            description: "The Discord user to show.",
        },
        {
            name: "uid",
            type: ApplicationCommandOptionType.Integer,
            description: "The uid of the player.",
            minValue: Constants.uidMinLimit,
        },
        {
            name: "username",
            type: ApplicationCommandOptionType.String,
            description: "The username of the player.",
            minLength: 2,
            maxLength: 20,
            autocomplete: true,
        },
        {
            name: "index",
            type: ApplicationCommandOptionType.Integer,
            description:
                "The n-th play to show, ranging from 1 to 50. Defaults to the most recent play.",
            minValue: 1,
            maxValue: 50,
        },
        {
            name: "considernonoverwrite",
            type: ApplicationCommandOptionType.Boolean,
            description:
                "Whether to take non-overwritten plays into consideration. Defaults to true.",
        },
    ],
    example: [
        {
            command: "recent",
            description: "will show your most recent play.",
        },
        {
            command: "recent",
            arguments: [
                {
                    name: "uid",
                    value: 51076,
                },
                {
                    name: "index",
                    value: 5,
                },
            ],
            description: "will show the 5th most recent play of uid 51076.",
        },
        {
            command: "recent",
            arguments: [
                {
                    name: "username",
                    value: "NeroYuki",
                },
                {
                    name: "index",
                    value: 2,
                },
            ],
            description:
                "will show the 2nd most recent play of username NeroYuki.",
        },
        {
            command: "recent",
            arguments: [
                {
                    name: "user",
                    value: "@Rian8337#0001",
                },
            ],
            description: "will show the most recent play of Rian8337.",
        },
    ],
    cooldown: 5,
};
