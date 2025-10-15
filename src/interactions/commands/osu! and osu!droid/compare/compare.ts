import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { OfficialDatabaseUser } from "@database/official/schema/OfficialDatabaseUser";
import { UserBind } from "@database/utils/elainaDb/UserBind";
import { CommandCategory } from "@enums/core/CommandCategory";
import { PPCalculationMethod } from "@enums/utils/PPCalculationMethod";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { CompareLocalization } from "@localization/interactions/commands/osu! and osu!droid/compare/CompareLocalization";
import { Modes } from "@rian8337/osu-base";
import { Player } from "@rian8337/osu-droid-utilities";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DroidHelper } from "@utils/helpers/DroidHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { ReplayHelper } from "@utils/helpers/ReplayHelper";
import { StringHelper } from "@utils/helpers/StringHelper";
import { BeatmapManager } from "@utils/managers/BeatmapManager";
import { PPProcessorRESTManager } from "@utils/managers/PPProcessorRESTManager";
import {
    ApplicationCommandOptionType,
    GuildMember,
    InteractionReplyOptions,
} from "discord.js";
import { SlashCommand } from "structures/core/SlashCommand";

export const run: SlashCommand["run"] = async (_, interaction) => {
    const localization = new CompareLocalization(
        CommandHelper.getLocale(interaction)
    );

    const cachedBeatmapHash = BeatmapManager.getChannelLatestBeatmap(
        interaction.channelId
    );

    if (!cachedBeatmapHash) {
        interaction.ephemeral = true;

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noCachedBeatmap")
            ),
        });
    }

    if (interaction.options.data.length > 1) {
        interaction.ephemeral = true;

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("tooManyOptions")
            ),
        });
    }

    await InteractionHelper.deferReply(interaction);

    const discordid = interaction.options.getUser("user")?.id;
    let uid = interaction.options.getInteger("uid");
    const username = interaction.options.getString("username");

    const dbManager = DatabaseManager.elainaDb.collections.userBind;

    let bindInfo: UserBind | null | undefined;
    let player: Pick<OfficialDatabaseUser, "id" | "username"> | Player | null =
        null;

    switch (true) {
        case !!uid:
            player = await DroidHelper.getPlayer(uid, ["id", "username"]);

            break;
        case !!username:
            if (!StringHelper.isUsernameValid(username)) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("playerNotFound")
                    ),
                });
            }

            player = await DroidHelper.getPlayer(username, ["id", "username"]);

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
                }
            );

            if (!bindInfo) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        new ConstantsLocalization(
                            localization.language
                        ).getTranslation(
                            discordid
                                ? Constants.userNotBindedReject
                                : Constants.selfNotBindedReject
                        )
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
                localization.getTranslation("playerNotFound")
            ),
        });
    }

    uid = player.id;

    const score = await DroidHelper.getScore(uid, cachedBeatmapHash, [
        "id",
        "uid",
        "filename",
        "hash",
        "mods",
        "score",
        "combo",
        "mark",
        "perfect",
        "good",
        "bad",
        "miss",
        "date",
        "slider_tick_hit",
        "slider_end_hit",
    ]);

    if (!score) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation(
                    uid || discordid || username
                        ? "userScoreNotFound"
                        : "selfScoreNotFound"
                )
            ),
        });
    }

    const scoreAttribs = await PPProcessorRESTManager.getOnlineScoreAttributes(
        score.uid,
        score.hash,
        Modes.droid,
        PPCalculationMethod.live
    );

    const options: InteractionReplyOptions = {
        content: MessageCreator.createAccept(
            localization.getTranslation("comparePlayDisplay"),
            player.username
        ),
        embeds: [
            await EmbedCreator.createRecentPlayEmbed(
                score,
                (interaction.member as GuildMember | null)?.displayColor,
                scoreAttribs?.attributes,
                undefined,
                localization.language
            ),
        ],
    };

    const replay = await ReplayHelper.analyzeReplay(score);

    if (!replay.data) {
        return InteractionHelper.reply(interaction, options);
    }

    const beatmapInfo = await BeatmapManager.getBeatmap(score.hash);

    void MessageButtonCreator.createRecentScoreButton(
        interaction,
        options,
        beatmapInfo?.beatmap,
        score,
        player.username,
        replay
    );
};

export const category: SlashCommand["category"] = CommandCategory.osu;

export const config: SlashCommand["config"] = {
    name: "compare",
    description: "Compares yours or a player's score among others.",
    options: [
        {
            name: "user",
            type: ApplicationCommandOptionType.User,
            description: "The Discord user to compare.",
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
    ],
    example: [
        {
            command: "compare",
            description: "will compare your score among others.",
        },
        {
            command: "compare",
            arguments: [
                {
                    name: "uid",
                    value: 51076,
                },
            ],
            description:
                "will compare the score of an osu!droid account with uid 51076.",
        },
        {
            command: "compare",
            arguments: [
                {
                    name: "username",
                    value: "NeroYuki",
                },
            ],
            description:
                "will compare the score of an osu!droid account with username NeroYuki.",
        },
        {
            command: "compare",
            arguments: [
                {
                    name: "user",
                    value: "@Rian8337#0001",
                },
            ],
            description: "will compare the score of Rian8337.",
        },
    ],
    cooldown: 5,
};
