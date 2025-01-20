import { Constants } from "@core/Constants";
import { DatabaseManager } from "@database/DatabaseManager";
import { UserBind } from "@database/utils/elainaDb/UserBind";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { RecalcLocalization } from "@localization/interactions/commands/osu!droid Elaina PP Project/recalc/RecalcLocalization";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { PrototypeRecalculationManager } from "@utils/managers/RecalculationManager";
import { FindOptions } from "mongodb";
import { DatabaseUserBind } from "structures/database/elainaDb/DatabaseUserBind";
import { DroidHelper } from "@utils/helpers/DroidHelper";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization = new RecalcLocalization(
        CommandHelper.getLocale(interaction),
    );

    const discordid = interaction.options.getUser("user")?.id;
    let uid = interaction.options.getInteger("uid");
    const username = interaction.options.getString("username");

    if ([discordid, uid, username].filter(Boolean).length > 1) {
        interaction.ephemeral = true;

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("tooManyOptions"),
            ),
        });
    }

    const dbManager = DatabaseManager.elainaDb.collections.userBind;
    const reworkType =
        interaction.options.getString("reworktype") ??
        process.env.CURRENT_REWORK_TYPE!;

    if (
        !(await DatabaseManager.aliceDb.collections.prototypePPType.reworkTypeExists(
            reworkType,
        ))
    ) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("reworkTypeDoesntExist"),
            ),
        });
    }

    if (!uid) {
        let bindInfo: UserBind | null;

        const findOptions: FindOptions<DatabaseUserBind> = {
            projection: {
                _id: 0,
                uid: 1,
            },
        };

        switch (true) {
            case !!username:
                bindInfo = await dbManager.getFromUsername(
                    username!,
                    findOptions,
                );
                break;

            default:
                // If no arguments are specified, default to self
                bindInfo = await dbManager.getFromUser(
                    discordid ?? interaction.user.id,
                    findOptions,
                );
        }

        if (!bindInfo) {
            return InteractionHelper.reply(interaction, {
                content: MessageCreator.createReject(
                    new ConstantsLocalization(
                        localization.language,
                    ).getTranslation(
                        username || discordid
                            ? Constants.userNotBindedReject
                            : Constants.selfNotBindedReject,
                    ),
                ),
            });
        }

        uid = bindInfo.uid;
    }

    const player = await DroidHelper.getPlayer(uid, ["id"]);

    if (!player) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("playerNotFound"),
            ),
        });
    }

    PrototypeRecalculationManager.queue(interaction, uid, reworkType);

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("userQueued"),
            `uid ${uid}`,
        ),
    });
};
