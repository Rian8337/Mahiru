import { DatabaseManager } from "@database/DatabaseManager";
import { SlashSubcommand } from "@structures/core/SlashSubcommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { GuildFeature } from "discord.js";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    if (!interaction.inCachedGuild()) {
        return;
    }

    if (!interaction.guild.features.includes(GuildFeature.RoleIcons)) {
        await InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                "I'm sorry, this server does not have the Role Icons feature enabled!",
            ),
        });

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

    const emoji = await interaction.guild.emojis
        .fetch(interaction.options.getString("emoji", true))
        .catch(() => null);

    if (!emoji) {
        await InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                "I'm sorry, I could not find the emoji you provided!",
            ),
        });

        return;
    }

    await role.setIcon(
        emoji,
        `Booster role icon changed by ${interaction.user.tag} (${interaction.user.id})`,
    );

    await InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            `Successfully changed the icon of your booster role!`,
        ),
    });
};
