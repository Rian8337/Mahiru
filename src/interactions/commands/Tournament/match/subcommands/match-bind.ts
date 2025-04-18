import { DatabaseManager } from "@database/DatabaseManager";
import { TournamentMatch } from "@database/utils/elainaDb/TournamentMatch";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { OperationResult } from "structures/core/OperationResult";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { TextBasedChannel, TextChannel, ThreadChannel } from "discord.js";
import { MatchLocalization } from "@localization/interactions/commands/Tournament/match/MatchLocalization";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    const localization: MatchLocalization = new MatchLocalization(
        CommandHelper.getLocale(interaction),
    );

    const id: string = interaction.options.getString("id", true);

    const channel: TextBasedChannel = interaction.channel!;

    if (!(channel instanceof TextChannel)) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("invalidChannelToBind"),
            ),
        });
    }

    const match: TournamentMatch | null =
        await DatabaseManager.elainaDb.collections.tournamentMatch.getById(id);

    if (!match) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("matchDoesntExist"),
            ),
        });
    }

    await channel.threads.fetch();

    await channel.threads.fetchArchived();

    let thread: ThreadChannel | undefined = channel.threads.cache.find(
        (c) => c.name === `${match.matchid} ${match.name}`,
    );

    if (!thread) {
        thread = await channel.threads.create({
            name: `${match.matchid} ${match.name}`,
        });
    } else if (thread.archived && thread.unarchivable) {
        await thread.setArchived(false);
    }

    match.channelId = thread.id;

    const result: OperationResult = await match.updateMatch();

    if (!result.success) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("bindMatchFailed"),
                result.reason!,
            ),
        });
    }

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("bindMatchSuccessful"),
            id,
        ),
    });
};
