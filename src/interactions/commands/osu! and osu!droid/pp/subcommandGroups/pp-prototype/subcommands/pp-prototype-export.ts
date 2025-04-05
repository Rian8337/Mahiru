import { DatabaseManager } from "@database/DatabaseManager";
import { PrototypePP } from "@database/utils/aliceDb/PrototypePP";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { AttachmentBuilder } from "discord.js";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { PPLocalization } from "@localization/interactions/commands/osu!droid Elaina PP Project/pp/PPLocalization";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { Constants } from "@core/Constants";
import { ModUtil } from "@rian8337/osu-base";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization = new PPLocalization(
        CommandHelper.getLocale(interaction)
    );

    const discordid = interaction.options.getUser("user")?.id;
    const uid = interaction.options.getInteger("uid");
    const username = interaction.options.getString("username");

    if ([discordid, uid, username].filter(Boolean).length > 1) {
        interaction.ephemeral = true;

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("tooManyOptions")
            ),
        });
    }

    const dbManager = DatabaseManager.aliceDb.collections.prototypePP;
    const reworkType = interaction.options.getString("rework") ?? "overall";

    let ppInfo: PrototypePP | null;

    switch (true) {
        case !!uid:
            ppInfo = await dbManager.getFromUid(uid!, reworkType);
            break;

        case !!username:
            ppInfo = await dbManager.getFromUsername(username!, reworkType);
            break;

        default: {
            const bindInfo =
                await DatabaseManager.elainaDb.collections.userBind.getFromUser(
                    // If no arguments are specified, default to self
                    discordid ?? interaction.user.id,
                    { projection: { _id: 0, uid: 1 } }
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

            ppInfo = await dbManager.getFromUid(bindInfo.uid, reworkType);
        }
    }

    if (!ppInfo) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation(
                    uid || username || discordid
                        ? "userInfoNotAvailable"
                        : "selfInfoNotAvailable"
                )
            ),
        });
    }

    let csvString: string =
        'UID,Username,"Total PP","Previous Total PP",Diff,"Last Update"\n';

    csvString += `${ppInfo.uid},${ppInfo.username},${ppInfo.pptotal.toFixed(
        2
    )},${ppInfo.prevpptotal.toFixed(2)},${(
        ppInfo.pptotal - ppInfo.prevpptotal
    ).toFixed(2)},"${new Date(ppInfo.lastUpdate).toUTCString()}"\n\n`;

    csvString +=
        '"Map Name",Mods,Combo,Accuracy,Misses,"Live PP","Local PP",Diff\n';

    for (const pp of ppInfo.pp.values()) {
        const modstring = pp.mods
            ? ModUtil.modsToOrderedString(ModUtil.deserializeMods(pp.mods))
            : "NM";

        csvString += `"${pp.title.replace(/"/g, '""')}","${modstring}",${
            pp.combo
        },${pp.accuracy},${pp.miss},${pp.prevPP},${pp.pp},${(
            pp.pp - pp.prevPP
        ).toFixed(2)}\n`;
    }

    const attachment = new AttachmentBuilder(Buffer.from(csvString), {
        name: `prototype_${ppInfo.uid}_${new Date().toUTCString()}.csv`,
    });

    InteractionHelper.reply(interaction, {
        files: [attachment],
    });
};
