import { DatabaseManager } from "@database/DatabaseManager";
import { PrototypePP } from "@database/utils/aliceDb/PrototypePP";
import { OnButtonPageChange } from "@structures/utils/OnButtonPageChange";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { bold, GuildMember, hyperlink } from "discord.js";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { StringHelper } from "@utils/helpers/StringHelper";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { PPLocalization } from "@localization/interactions/commands/osu!droid Elaina PP Project/pp/PPLocalization";
import { ProfileManager } from "@utils/managers/ProfileManager";

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

    const reworkType = interaction.options.getString("rework") ?? "overall";
    const reworkInfo =
        await DatabaseManager.aliceDb.collections.prototypePPType.getFromType(
            reworkType,
            { projection: { _id: 0, name: 1, type: 1 } },
        );

    if (!reworkInfo) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("reworkTypeDoesntExist"),
            ),
        });
    }

    const dbManager = DatabaseManager.aliceDb.collections.prototypePP;
    let ppInfo: PrototypePP | null;

    switch (true) {
        case !!uid:
            ppInfo = await dbManager.getFromUid(uid!, reworkType);
            break;
        case !!username:
            ppInfo = await dbManager.getFromUsername(username!, reworkType);
            break;
        default:
            // If no arguments are specified, default to self
            ppInfo = await dbManager.getFromUser(
                discordid ?? interaction.user.id,
                reworkType,
            );
    }

    if (!ppInfo) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation(
                    uid || username || discordid
                        ? "userInfoNotAvailable"
                        : "selfInfoNotAvailable",
                ),
            ),
        });
    }

    const embed = EmbedCreator.createNormalEmbed({
        author: interaction.user,
        color: (<GuildMember | null>interaction.member)?.displayColor,
    });

    embed.setDescription(
        `${bold(
            StringHelper.formatString(
                localization.getTranslation("ppProfileTitle"),
                hyperlink(
                    ppInfo.username,
                    ProfileManager.getProfileLink(ppInfo.uid),
                ),
            ),
        )}\n` +
            `${localization.getTranslation("reworkTypeEmbedDescription")}: ${bold(reworkInfo.name)}\n` +
            `${localization.getTranslation("totalPP")}: ${bold(
                `${ppInfo.pptotal.toFixed(2)} pp (#${(
                    await dbManager.getUserDPPRank(ppInfo.pptotal, reworkType)
                ).toLocaleString(
                    LocaleHelper.convertToBCP47(localization.language),
                )})`,
            )}\n` +
            `${localization.getTranslation("prevTotalPP")}: ${bold(
                `${ppInfo.prevpptotal.toFixed(2)} pp`,
            )}\n` +
            `Difference: ${bold(
                `${(ppInfo.pptotal - ppInfo.prevpptotal).toFixed(2)} pp`,
            )}\n` +
            `[${localization.getTranslation(
                "ppProfile",
            )}](https://droidpp.osudroid.moe/prototype/profile/${
                ppInfo.uid
            }/${reworkType})\n` +
            `${localization.getTranslation("lastUpdate")}: ${bold(
                `${DateTimeFormatHelper.dateToLocaleString(
                    new Date(ppInfo.lastUpdate),
                    localization.language,
                )}`,
            )}`,
    );

    const entries = [...ppInfo.pp.values()];

    const onPageChange: OnButtonPageChange = async (_, page) => {
        for (let i = 5 * (page - 1); i < 5 + 5 * (page - 1); ++i) {
            const pp = entries.at(i);

            if (pp) {
                let modstring = pp.mods ? `+${pp.mods}` : "";
                if (
                    pp.forceAR ||
                    (pp.speedMultiplier && pp.speedMultiplier !== 1)
                ) {
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

                embed.addFields({
                    name: `${i + 1}. ${pp.title} ${modstring}`,
                    value: `${pp.combo}x | ${pp.accuracy.toFixed(2)}% | ${
                        pp.miss
                    } ❌ | ${bold(pp.prevPP.toString())} ⮕ ${bold(
                        pp.pp.toString(),
                    )} pp (${(pp.pp - pp.prevPP).toFixed(2)} pp)`,
                });
            } else {
                embed.addFields({ name: `${i + 1}. -`, value: "-" });
            }
        }
    };

    MessageButtonCreator.createLimitedButtonBasedPaging(
        interaction,
        { embeds: [embed] },
        [interaction.user.id],
        Math.max(interaction.options.getInteger("page") ?? 1, 1),
        Math.ceil(ppInfo.pp.size / 5),
        120,
        onPageChange,
    );
};
