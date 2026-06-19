import { DatabaseManager } from "@database/DatabaseManager";
import { SlashSubcommand } from "@structures/core/SlashSubcommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    if (!interaction.inCachedGuild()) {
        return;
    }

    await InteractionHelper.deferReply(interaction);

    const userBoosterRole =
        await DatabaseManager.aliceDb.collections.boosterRole.getFromDiscordId(
            interaction.user.id,
        );

    if (!userBoosterRole) {
        await InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                "I'm sorry, you do not have a booster role!",
            ),
        });

        return;
    }

    const role = await interaction.guild.roles.fetch(userBoosterRole.roleId);

    if (!role) {
        await InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                "I'm sorry, I could not find your booster role!",
            ),
        });

        return;
    }

    await role.delete(
        `Booster role removed by ${interaction.user.tag} (${interaction.user.id})`,
    );

    await DatabaseManager.aliceDb.collections.boosterRole.deleteFromDiscordId(
        interaction.user.id,
    );

    await InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            "Successfully removed your booster role.",
        ),
    });
};
