import { DatabaseManager } from "@database/DatabaseManager";
import { AnniversaryTriviaSubmitLocalization } from "@localization/interactions/buttons/Anniversary/anniversaryTriviaSubmit/AnniversaryTriviaSubmitLocalization";
import { ButtonCommand } from "@structures/core/ButtonCommand";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { AnniversaryTriviaManager } from "@utils/managers/AnniversaryTriviaManager";
import { CacheManager } from "@utils/managers/CacheManager";

export const run: ButtonCommand["run"] = async (_, interaction) => {
    if (!interaction.inCachedGuild()) {
        return;
    }

    const localization = new AnniversaryTriviaSubmitLocalization(
        CommandHelper.getLocale(interaction),
    );

    await InteractionHelper.deferReply(interaction);

    const player =
        await DatabaseManager.aliceDb.collections.anniversaryTriviaPlayer.getFromId(
            interaction.user.id,
            { projection: { _id: 0, currentAttempt: 1, pastAttempts: 1 } },
        );

    if (!player?.currentAttempt) {
        return;
    }

    const confirmation = await MessageButtonCreator.createConfirmation(
        interaction,
        {
            content: MessageCreator.createWarn(
                localization.getTranslation("confirmSubmission"),
            ),
        },
        [interaction.user.id],
        15,
        localization.language,
    );

    if (!confirmation) {
        return;
    }

    player.pastAttempts.unshift({
        answers: player.currentAttempt.map((v) => {
            return {
                id: v.id,
                answer: v.answer,
            };
        }),
        marks: CacheManager.anniversaryTriviaQuestions.reduce((a, v) => {
            const answer = player.currentAttempt?.find((t) => t.id === v.id);

            return a + (answer?.answer === v.correctAnswer ? v.marks : 0);
        }, 0),
        submissionDate: interaction.createdAt,
    });

    while (player.pastAttempts.length > 5) {
        player.pastAttempts.pop();
    }

    player.currentAttempt = undefined;

    await InteractionHelper.deferUpdate(interaction);

    await DatabaseManager.aliceDb.collections.anniversaryTriviaPlayer.updateOne(
        { discordId: interaction.user.id },
        {
            $unset: { currentAttempt: "" },
            $set: { pastAttempts: player.pastAttempts },
        },
    );

    InteractionHelper.update(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("submissionSuccess"),
            player.pastAttempts.at(-1)!.marks.toString(),
            AnniversaryTriviaManager.maximumMarks.toString(),
        ),
    });
};

export const config: ButtonCommand["config"] = {
    replyEphemeral: true,
    instantDeferInDebug: false,
};
