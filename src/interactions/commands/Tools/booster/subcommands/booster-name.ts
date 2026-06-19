import { DatabaseManager } from "@database/DatabaseManager";
import { SlashSubcommand } from "@structures/core/SlashSubcommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { inlineCode } from "discord.js";

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

    const name = interaction.options.getString("name", true);

    await role.setName(
        name,
        `Booster role name changed by ${interaction.user.tag} (${interaction.user.id})`,
    );

    await InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            `Successfully changed the name of your booster role to ${inlineCode(name)}.`,
        ),
    });
};
