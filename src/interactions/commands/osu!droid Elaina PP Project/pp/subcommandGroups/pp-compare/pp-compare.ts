import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { UserBindCollectionManager } from "@database/managers/elainaDb/UserBindCollectionManager";
import { UserBind } from "@database/utils/elainaDb/UserBind";
import { Symbols } from "@enums/utils/Symbols";
import { SlashSubcommandGroup } from "structures/core/SlashSubcommandGroup";
import { PPEntry } from "@structures/dpp/PPEntry";
import { OnButtonPageChange } from "@structures/utils/OnButtonPageChange";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import {
    PPLocalization,
    PPStrings,
} from "@localization/interactions/commands/osu!droid Elaina PP Project/pp/PPLocalization";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { User, Collection, GuildMember, EmbedBuilder, bold } from "discord.js";

export const run: SlashSubcommandGroup["run"] = async (_, interaction) => {
    const localization: PPLocalization = new PPLocalization(
        CommandHelper.getLocale(interaction),
    );

    const dbManager: UserBindCollectionManager =
        DatabaseManager.elainaDb.collections.userBind;
    const subcommand: string = interaction.options.getSubcommand();

    const uidToCompare: number | null =
        interaction.options.getInteger("uidtocompare");
    const userToCompare: User | null =
        interaction.options.getUser("usertocompare");
    const usernameToCompare: string | null =
        interaction.options.getString("usernametocompare");

    const otherUid: number | null = interaction.options.getInteger("otheruid");
    const otherUser: User | null = interaction.options.getUser("otheruser");
    const otherUsername: string | null =
        interaction.options.getString("otherusername");

    let firstBindInfo: UserBind | null = null;
    let secondBindInfo: UserBind | null = null;

    switch (subcommand) {
        case "uid":
            if (uidToCompare === otherUid) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("cannotCompareSamePlayers"),
                    ),
                });
            }

            firstBindInfo = await dbManager.getFromUid(uidToCompare!, {
                projection: {
                    _id: 0,
                    pp: 1,
                    pptotal: 1,
                    username: 1,
                },
            });

            secondBindInfo = otherUid
                ? await dbManager.getFromUid(otherUid, {
                      projection: {
                          _id: 0,
                          pp: 1,
                          pptotal: 1,
                          username: 1,
                      },
                  })
                : await dbManager.getFromUser(interaction.user, {
                      projection: {
                          _id: 0,
                          pp: 1,
                          pptotal: 1,
                          username: 1,
                      },
                  });
            break;
        case "user":
            if (userToCompare!.id === (otherUser ?? interaction.user).id) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("cannotCompareSamePlayers"),
                    ),
                });
            }

            firstBindInfo = await dbManager.getFromUser(userToCompare!);

            secondBindInfo = await dbManager.getFromUser(
                otherUser ?? interaction.user,
            );
            break;
        case "username":
            if (usernameToCompare === otherUsername) {
                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        localization.getTranslation("cannotCompareSamePlayers"),
                    ),
                });
            }

            firstBindInfo = await dbManager.getFromUsername(
                usernameToCompare!,
                {
                    projection: {
                        _id: 0,
                        pp: 1,
                        pptotal: 1,
                        username: 1,
                    },
                },
            );

            secondBindInfo = otherUsername
                ? await dbManager.getFromUsername(otherUsername, {
                      projection: {
                          _id: 0,
                          pp: 1,
                          pptotal: 1,
                          username: 1,
                      },
                  })
                : await dbManager.getFromUser(interaction.user, {
                      projection: {
                          _id: 0,
                          pp: 1,
                          pptotal: 1,
                          username: 1,
                      },
                  });
            break;
    }

    if (!firstBindInfo || !secondBindInfo) {
        if (!secondBindInfo && !otherUid && !otherUser && !otherUsername) {
            return InteractionHelper.reply(interaction, {
                content: MessageCreator.createReject(
                    new ConstantsLocalization(
                        localization.language,
                    ).getTranslation(Constants.selfNotBindedReject),
                ),
            });
        }

        let comparedRejectValue: string = "";

        switch (subcommand) {
            case "uid":
                comparedRejectValue = (
                    !secondBindInfo ? otherUid : uidToCompare
                )!.toString();
                break;
            case "user":
                comparedRejectValue = (
                    !secondBindInfo ? otherUser : userToCompare
                )!.tag;
                break;
            case "username":
                comparedRejectValue = (
                    !secondBindInfo ? otherUsername : usernameToCompare
                )!;
                break;
        }

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("playerNotBinded"),
                localization.getTranslation(<keyof PPStrings>subcommand),
                comparedRejectValue,
            ),
        });
    }

    const firstPlayerPP: Collection<string, PPEntry> = firstBindInfo.pp;
    const secondPlayerPP: Collection<string, PPEntry> = secondBindInfo.pp;
    const ppToCompare: string[] = [];

    for (const key of firstPlayerPP.keys()) {
        if (secondPlayerPP.has(key)) {
            ppToCompare.push(key);
        }
    }

    if (ppToCompare.length === 0) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noSimilarPlayFound"),
            ),
        });
    }

    const firstPlayerPPRank: number = await dbManager.getUserDPPRank(
        firstBindInfo.pptotal,
    );
    const secondPlayerPPRank: number = await dbManager.getUserDPPRank(
        secondBindInfo.pptotal,
    );

    const embed: EmbedBuilder = EmbedCreator.createNormalEmbed({
        author: interaction.user,
        color: (<GuildMember | null>interaction.member)?.displayColor,
    });

    let ppDescription: string = "";

    const BCP47: string = LocaleHelper.convertToBCP47(localization.language);

    if (firstBindInfo.pptotal < secondBindInfo.pptotal) {
        ppDescription = `${bold(
            `${firstBindInfo.pptotal.toFixed(
                2,
            )}pp (#${firstPlayerPPRank.toLocaleString(BCP47)})`,
        )} vs ${bold(
            `${Symbols.crown} ${secondBindInfo.pptotal.toFixed(
                2,
            )}pp (#${secondPlayerPPRank.toLocaleString(BCP47)})`,
        )}`;
    } else if (firstBindInfo.pptotal > secondBindInfo.pptotal) {
        ppDescription = `${bold(
            `${Symbols.crown} ${firstBindInfo.pptotal.toFixed(
                2,
            )}pp (#${firstPlayerPPRank.toLocaleString(BCP47)})`,
        )} vs ${bold(
            `${secondBindInfo.pptotal.toFixed(
                2,
            )}pp (#${secondPlayerPPRank.toLocaleString(BCP47)})`,
        )}`;
    } else {
        ppDescription = `${bold(
            `${firstBindInfo.pptotal.toFixed(
                2,
            )}pp (#${firstPlayerPPRank.toLocaleString(BCP47)})`,
        )} vs ${bold(
            `${secondBindInfo.pptotal.toFixed(
                2,
            )}pp (#${secondPlayerPPRank.toLocaleString(BCP47)})`,
        )}`;
    }

    embed
        .setTitle(localization.getTranslation("topPlaysComparison"))
        .setDescription(
            `${localization.getTranslation("player")}: ${bold(
                firstBindInfo.username,
            )} vs ${bold(secondBindInfo.username)}\n` +
                `${localization.getTranslation("totalPP")}: ${ppDescription}`,
        );

    const getModString = (pp: PPEntry): string => {
        let modstring = pp.mods ? `+${pp.mods}` : "+No Mod";

        if (pp.forceAR || (pp.speedMultiplier && pp.speedMultiplier !== 1)) {
            if (pp.mods) {
                modstring += " ";
            }

            modstring += "(";

            if (pp.forceAR) {
                modstring += `AR${pp.forceAR}`;
            }

            if (pp.speedMultiplier && pp.speedMultiplier !== 1) {
                if (pp.forceAR) {
                    modstring += ", ";
                }

                modstring += `${pp.speedMultiplier}x`;
            }

            modstring += ")";
        }

        return modstring;
    };

    const onPageChange: OnButtonPageChange = async (_, page) => {
        for (
            let i = 5 * (page - 1);
            i < Math.min(ppToCompare.length, 5 + 5 * (page - 1));
            ++i
        ) {
            const key: string = ppToCompare[i];

            const firstPP: PPEntry = firstPlayerPP.get(key)!;
            const secondPP: PPEntry = secondPlayerPP.get(key)!;

            let firstPlayerDescription: string = `${
                firstPP.combo
            }x | ${firstPP.accuracy.toFixed(2)}% | ${firstPP.miss} ${
                Symbols.missIcon
            } | ${firstPP.pp}pp (${getModString(firstPP)})`;
            let secondPlayerDescription: string = `${
                secondPP.combo
            }x | ${secondPP.accuracy.toFixed(2)}% | ${secondPP.miss} ${
                Symbols.missIcon
            } | ${secondPP.pp}pp (${getModString(secondPP)})`;

            if (firstPP.pp < secondPP.pp) {
                secondPlayerDescription = `${bold(secondPlayerDescription)} ${
                    Symbols.crown
                }`;
            } else if (firstPP.pp > secondPP.pp) {
                firstPlayerDescription = `${bold(firstPlayerDescription)} ${
                    Symbols.crown
                }`;
            }

            embed.addFields({
                name: `${i + 1}. ${firstPP.title}`,
                value:
                    `${bold(
                        firstBindInfo!.username,
                    )}: ${firstPlayerDescription}\n` +
                    `${bold(
                        secondBindInfo!.username,
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
        onPageChange,
    );
};

export const config: SlashSubcommandGroup["config"] = {
    permissions: [],
    cooldown: 5,
};
