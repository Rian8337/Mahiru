import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { OfficialDatabaseUser } from "@database/official/schema/OfficialDatabaseUser";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { PPLocalization } from "@localization/interactions/commands/osu!droid Elaina PP Project/pp/PPLocalization";
import { Player, Score } from "@rian8337/osu-droid-utilities";
import { SlashSubcommand } from "@structures/core/SlashSubcommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { PPHelper } from "@utils/helpers/PPHelper";
import { DroidHelper } from "@utils/helpers/DroidHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { NumberHelper } from "@utils/helpers/NumberHelper";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization = new PPLocalization(
        CommandHelper.getLocale(interaction),
    );

    const discordid = interaction.options.getUser("user")?.id;
    const uid = interaction.options.getInteger("uid");
    const username = interaction.options.getString("username");

    if ([discordid, uid, username].filter(Boolean).length > 1) {
        interaction.ephemeral = true;

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("tooManyOptions"),
            ),
        });
    }

    await InteractionHelper.deferReply(interaction);

    let player:
        | Pick<OfficialDatabaseUser, "id" | "username" | "pp">
        | Player
        | null = null;

    switch (true) {
        case !!uid:
            player = await DroidHelper.getPlayer(uid, ["id", "username", "pp"]);
            break;

        case !!username:
            player = await DroidHelper.getPlayer(username, [
                "id",
                "username",
                "pp",
            ]);
            break;

        default: {
            // If no arguments are specified, default to self
            const bindInfo =
                await DatabaseManager.elainaDb.collections.userBind.getFromUser(
                    discordid ?? interaction.user.id,
                    { projection: { _id: 0, uid: 1 } },
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
                "pp",
            ]);
        }
    }

    if (!player) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("profileNotFound"),
            ),
        });
    }

    const ppValue = interaction.options.getNumber("pp", true);
    const BCP47 = LocaleHelper.convertToBCP47(localization.language);

    const topScores = await DroidHelper.getTopScores(player.id);

    if (topScores.length === 0) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("profileNotFound"),
            ),
        });
    }

    let playIndex = 0;

    while (
        playIndex < topScores.length &&
        // When pp is null, the play will always be inserted in that index, so we can stop there.
        topScores[playIndex].pp !== null &&
        ppValue < topScores[playIndex].pp!
    ) {
        ++playIndex;
    }

    // Maximum plays is 100, so if the insertion index is 100, it means the pp value is too low.
    if (playIndex === 100) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createAccept(
                localization.getTranslation("whatIfScoreNotEntered"),
                NumberHelper.round(ppValue, 2).toLocaleString(BCP47),
                player.username,
            ),
        });
    }

    // Mock the score.
    topScores.splice(
        playIndex,
        0,
        new Score({
            accuracy: 100,
            combo: 0,
            bad: 0,
            date: 0,
            filename: "",
            good: 0,
            hash: "",
            id: 0,
            mark: "X",
            miss: 0,
            mods: [],
            perfect: 0,
            pp: ppValue,
            ppMultiplier: 1,
            sliderTickHit: null,
            sliderEndHit: null,
            score: 0,
            uid: 0,
            username: "",
        }),
    );

    const totalPP = PPHelper.calculateFinalPerformancePoints(
        topScores.map((s) => s.pp),
    );

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("whatIfScoreEntered"),
            NumberHelper.round(ppValue, 2).toLocaleString(BCP47),
            NumberHelper.round(
                ppValue * Math.pow(0.95, playIndex),
                2,
            ).toLocaleString(BCP47),
            player.username,
            (playIndex + 1).toLocaleString(BCP47),
            NumberHelper.round(totalPP, 2).toLocaleString(BCP47),
            NumberHelper.round(totalPP - player.pp, 2).toLocaleString(BCP47),
        ),
    });
};
