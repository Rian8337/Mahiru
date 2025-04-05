import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { OfficialDatabaseUser } from "@database/official/schema/OfficialDatabaseUser";
import { Symbols } from "@enums/utils/Symbols";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import {
    PPLocalization,
    PPStrings,
} from "@localization/interactions/commands/osu!droid Elaina PP Project/pp/PPLocalization";
import { ModUtil } from "@rian8337/osu-base";
import { Player } from "@rian8337/osu-droid-utilities";
import { SlashSubcommandGroup } from "@structures/core/SlashSubcommandGroup";
import { DatabaseUserBind } from "@structures/database/elainaDb/DatabaseUserBind";
import { OnButtonPageChange } from "@structures/utils/OnButtonPageChange";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { ArrayHelper } from "@utils/helpers/ArrayHelper";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { DroidHelper } from "@utils/helpers/DroidHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { bold, GuildMember } from "discord.js";
import { FindOptions } from "mongodb";

export const run: SlashSubcommandGroup["run"] = async (_, interaction) => {
    const localization = new PPLocalization(
        CommandHelper.getLocale(interaction)
    );

    const dbManager = DatabaseManager.elainaDb.collections.userBind;
    const findOptions: FindOptions<DatabaseUserBind> = {
        projection: {
            _id: 0,
            uid: 1,
        },
    };

    const subcommand = interaction.options.getSubcommand();

    const uidToCompare = interaction.options.getInteger("uidtocompare");
    const userToCompare = interaction.options.getUser("usertocompare");
    const usernameToCompare =
        interaction.options.getString("usernametocompare");

    const otherUid = interaction.options.getInteger("otheruid");
    const otherUser = interaction.options.getUser("otheruser");
    const otherUsername = interaction.options.getString("otherusername");

    let firstPlayer:
        | Player
        | Pick<OfficialDatabaseUser, "id" | "username" | "pp">
        | null = null;
    let secondPlayer:
        | Player
        | Pick<OfficialDatabaseUser, "id" | "username" | "pp">
        | null = null;
    const playerKeys = [
        "id",
        "username",
        "pp",
    ] satisfies (keyof OfficialDatabaseUser)[];

    await InteractionHelper.deferReply(interaction);

    switch (subcommand) {
        case "uid":
            if (uidToCompare === otherUid) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("cannotCompareSamePlayers")
                    ),
                });
            }

            firstPlayer = await DroidHelper.getPlayer(
                uidToCompare!,
                playerKeys
            );

            if (otherUid) {
                secondPlayer = await DroidHelper.getPlayer(
                    otherUid,
                    playerKeys
                );
            } else {
                const bindInfo = await dbManager.getFromUser(interaction.user);

                if (!bindInfo) {
                    return InteractionHelper.reply(interaction, {
                        content: MessageCreator.createReject(
                            new ConstantsLocalization(
                                localization.language
                            ).getTranslation(Constants.selfNotBindedReject)
                        ),
                    });
                }

                secondPlayer = await DroidHelper.getPlayer(
                    bindInfo.uid,
                    playerKeys
                );
            }

            break;

        case "user": {
            if (userToCompare!.id === (otherUser ?? interaction.user).id) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("cannotCompareSamePlayers")
                    ),
                });
            }

            const firstBindInfo = await dbManager.getFromUser(
                userToCompare!,
                findOptions
            );

            const secondBindInfo = await dbManager.getFromUser(
                otherUser ?? interaction.user,
                findOptions
            );

            if (!firstBindInfo || !secondBindInfo) {
                if (
                    !secondBindInfo &&
                    !otherUid &&
                    !otherUser &&
                    !otherUsername
                ) {
                    return InteractionHelper.reply(interaction, {
                        content: MessageCreator.createReject(
                            new ConstantsLocalization(
                                localization.language
                            ).getTranslation(Constants.selfNotBindedReject)
                        ),
                    });
                }

                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("playerNotBinded"),
                        localization.getTranslation(
                            <keyof PPStrings>subcommand
                        ),
                        (!secondBindInfo ? otherUser : userToCompare)!.tag
                    ),
                });
            }

            firstPlayer = await DroidHelper.getPlayer(
                firstBindInfo.uid,
                playerKeys
            );
            secondPlayer = await DroidHelper.getPlayer(
                secondBindInfo.uid,
                playerKeys
            );

            break;
        }

        case "username": {
            if (usernameToCompare === otherUsername) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("cannotCompareSamePlayers")
                    ),
                });
            }

            firstPlayer = await DroidHelper.getPlayer(
                usernameToCompare!,
                playerKeys
            );

            if (otherUsername) {
                secondPlayer = await DroidHelper.getPlayer(
                    otherUsername,
                    playerKeys
                );
            } else {
                const bindInfo = await dbManager.getFromUser(
                    interaction.user,
                    findOptions
                );

                if (!bindInfo) {
                    return InteractionHelper.reply(interaction, {
                        content: MessageCreator.createReject(
                            new ConstantsLocalization(
                                localization.language
                            ).getTranslation(Constants.selfNotBindedReject)
                        ),
                    });
                }

                secondPlayer = await DroidHelper.getPlayer(
                    bindInfo.uid,
                    playerKeys
                );
            }

            break;
        }
    }

    if (!firstPlayer || !secondPlayer) {
        if (!secondPlayer && !otherUid && !otherUser && !otherUsername) {
            return InteractionHelper.reply(interaction, {
                content: MessageCreator.createReject(
                    new ConstantsLocalization(
                        localization.language
                    ).getTranslation(Constants.selfNotBindedReject)
                ),
            });
        }

        let comparedRejectValue = "";

        switch (subcommand) {
            case "uid":
                comparedRejectValue = (
                    !secondPlayer ? otherUid : uidToCompare
                )!.toString();
                break;
            case "user":
                comparedRejectValue = (
                    !secondPlayer ? otherUser : userToCompare
                )!.tag;
                break;
            case "username":
                comparedRejectValue = (
                    !secondPlayer ? otherUsername : usernameToCompare
                )!;
                break;
        }

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("playerNotBinded"),
                localization.getTranslation(<keyof PPStrings>subcommand),
                comparedRejectValue
            ),
        });
    }

    const firstTopScores = ArrayHelper.arrayToCollection(
        await DroidHelper.getTopScores(firstPlayer.id),
        "hash"
    );
    const secondTopScores = ArrayHelper.arrayToCollection(
        await DroidHelper.getTopScores(secondPlayer.id),
        "hash"
    );

    const ppToCompare: string[] = [];

    for (const key of firstTopScores.keys()) {
        if (secondTopScores.has(key)) {
            ppToCompare.push(key);
        }
    }

    if (ppToCompare.length === 0) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noSimilarPlayFound")
            ),
        });
    }

    const embed = EmbedCreator.createNormalEmbed({
        author: interaction.user,
        color: (<GuildMember | null>interaction.member)?.displayColor,
    });

    let ppDescription = "";

    const BCP47 = LocaleHelper.convertToBCP47(localization.language);

    const firstPlayerRank =
        firstPlayer instanceof Player
            ? firstPlayer.rank
            : ((await DroidHelper.getPlayerPPRank(firstPlayer.id)) ?? 0);

    const secondPlayerRank =
        secondPlayer instanceof Player
            ? secondPlayer.rank
            : ((await DroidHelper.getPlayerPPRank(secondPlayer.id)) ?? 0);

    if (firstPlayer.pp < secondPlayer.pp) {
        ppDescription = `${bold(
            `${firstPlayer.pp.toFixed(
                2
            )}pp (#${firstPlayerRank.toLocaleString(BCP47)})`
        )} vs ${bold(
            `${Symbols.crown} ${secondPlayer.pp.toFixed(
                2
            )}pp (#${secondPlayerRank.toLocaleString(BCP47)})`
        )}`;
    } else if (firstPlayer.pp > secondPlayer.pp) {
        ppDescription = `${bold(
            `${Symbols.crown} ${firstPlayer.pp.toFixed(
                2
            )}pp (#${firstPlayerRank.toLocaleString(BCP47)})`
        )} vs ${bold(
            `${secondPlayer.pp.toFixed(
                2
            )}pp (#${secondPlayerRank.toLocaleString(BCP47)})`
        )}`;
    } else {
        ppDescription = `${bold(
            `${firstPlayer.pp.toFixed(
                2
            )}pp (#${firstPlayerRank.toLocaleString(BCP47)})`
        )} vs ${bold(
            `${secondPlayer.pp.toFixed(
                2
            )}pp (#${secondPlayerRank.toLocaleString(BCP47)})`
        )}`;
    }

    embed
        .setTitle(localization.getTranslation("topPlaysComparison"))
        .setDescription(
            `${localization.getTranslation("player")}: ${bold(
                firstPlayer.username
            )} vs ${bold(secondPlayer.username)}\n` +
                `${localization.getTranslation("totalPP")}: ${ppDescription}`
        );

    const onPageChange: OnButtonPageChange = async (_, page) => {
        for (
            let i = 5 * (page - 1);
            i < Math.min(ppToCompare.length, 5 + 5 * (page - 1));
            ++i
        ) {
            const key = ppToCompare[i];

            const firstScore = firstTopScores.get(key)!;
            const secondScore = secondTopScores.get(key)!;

            let firstPlayerDescription = `${
                firstScore.combo
            }x | ${(firstScore.accuracy.value() * 100).toFixed(2)}% | ${firstScore.miss} ${
                Symbols.missIcon
            } | ${firstScore.pp}pp (${firstScore.completeModString})`;

            let secondPlayerDescription = `${
                secondScore.combo
            }x | ${(secondScore.accuracy.value() * 100).toFixed(2)}% | ${secondScore.miss} ${
                Symbols.missIcon
            } | ${secondScore.pp}pp (${secondScore.completeModString})`;

            if ((firstScore.pp ?? 0) < (secondScore.pp ?? 0)) {
                secondPlayerDescription = `${bold(secondPlayerDescription)} ${
                    Symbols.crown
                }`;
            } else if ((firstScore.pp ?? 0) > (secondScore.pp ?? 0)) {
                firstPlayerDescription = `${bold(firstPlayerDescription)} ${
                    Symbols.crown
                }`;
            }

            embed.addFields({
                name: `${i + 1}. ${firstScore.title}`,
                value:
                    `${bold(
                        firstPlayer.username
                    )}: ${firstPlayerDescription}\n` +
                    `${bold(
                        secondPlayer.username
                    )}: ${secondPlayerDescription}`,
            });
        }
    };

    MessageButtonCreator.createLimitedButtonBasedPaging(
        interaction,
        { embeds: [embed] },
        [interaction.user.id],
        1,
        Math.ceil(ppToCompare.length / 5),
        120,
        onPageChange
    );
};
