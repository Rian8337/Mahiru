import { DatabaseManager } from "@database/DatabaseManager";
import { AccountTransferLocalization } from "@localization/interactions/commands/osu! and osu!droid/accounttransfer/AccountTransferLocalization";
import { SlashSubcommand } from "@structures/core/SlashSubcommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization = new AccountTransferLocalization(
        CommandHelper.getLocale(interaction),
    );
    const dbManager = DatabaseManager.aliceDb.collections.accountTransfer;
    const uid = interaction.options.getInteger("uid", true);

    await InteractionHelper.deferReply(interaction);

    const accountTransfer = await dbManager.getFromDiscordId(
        interaction.user.id,
    );

    if (!accountTransfer) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noAccountTransfer"),
            ),
        });
    }

    if (!accountTransfer.transferList.includes(uid)) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("accountNotInTransferList"),
            ),
        });
    }

    const result = await dbManager.updateOne(
        { discordId: interaction.user.id },
        { $set: { transferUid: uid } },
    );

    if (result.failed()) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("setTransferAccountFailed"),
                result.reason,
            ),
        });
    }

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("setTransferAccountSuccess"),
            uid.toString(),
        ),
    });
};

export const config: SlashSubcommand["config"] = {
    permissions: [],
};
