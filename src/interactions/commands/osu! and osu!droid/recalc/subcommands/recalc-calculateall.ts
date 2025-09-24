import { DatabaseManager } from "@database/DatabaseManager";
import { PrototypePP } from "@database/utils/aliceDb/PrototypePP";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { RecalcLocalization } from "@localization/interactions/commands/osu!droid Elaina PP Project/recalc/RecalcLocalization";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { consola } from "consola";
import { PrototypeRecalculationManager } from "@utils/managers/PrototypeRecalculationManager";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    if (!interaction.channel?.isSendable()) {
        return;
    }

    const localization = new RecalcLocalization(
        CommandHelper.getLocale(interaction)
    );

    const prototypeDbManager = DatabaseManager.aliceDb.collections.prototypePP;
    const prototypeTypeDbManager =
        DatabaseManager.aliceDb.collections.prototypePPType;

    let calculatedCount = 0;

    let player: PrototypePP | undefined;
    const reworkType = process.env.CURRENT_REWORK_TYPE;

    if (!reworkType) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("reworkTypeDoesntExist")
            ),
        });
    }

    // If rework doesn't exist in the database, a name must be supplied.
    if (!(await prototypeTypeDbManager.reworkTypeExists(reworkType))) {
        const reworkName = interaction.options.getString("reworkname");

        if (!reworkName) {
            return InteractionHelper.reply(interaction, {
                content: MessageCreator.createReject(
                    localization.getTranslation("reworkNameMissing")
                ),
            });
        }

        await prototypeTypeDbManager.insert({
            name: reworkName,
            type: reworkType,
        });

        // New rework - clone overall reworks to this rework for now. Recalculation will be done later down the line.
        await prototypeDbManager.cloneOverallToRework(reworkType);
    }

    await InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("fullRecalcInProgress")
        ),
    });

    if (interaction.options.getBoolean("resetprogress")) {
        await prototypeDbManager.updateMany({}, { $set: { scanDone: false } });
    }

    while (
        (player = (
            await prototypeDbManager.getUnscannedPlayers(1, reworkType)
        ).first())
    ) {
        consola.info(
            `Now calculating player ${player.uid} for rework ${reworkType}`
        );

        await PrototypeRecalculationManager.calculatePlayer(
            player.uid,
            reworkType
        );

        consola.info(
            `${++calculatedCount} players recalculated for rework ${reworkType}`
        );
    }

    interaction.channel.send({
        content: MessageCreator.createAccept(
            localization.getTranslation("fullRecalcSuccess"),
            interaction.user.toString()
        ),
    });
};

export const config: SlashSubcommand["config"] = {
    permissions: ["BotOwner"],
};
