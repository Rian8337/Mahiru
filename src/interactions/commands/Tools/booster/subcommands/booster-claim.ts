import { DatabaseManager } from "@database/DatabaseManager";
import { SlashSubcommand } from "@structures/core/SlashSubcommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashSubcommand<true>["run"] = async (_, interaction) => {
    if (!interaction.inCachedGuild()) {
        return;
    }

    const serverBoosterRole = interaction.guild.roles.premiumSubscriberRole;

    if (!serverBoosterRole) {
        await InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                "I'm sorry, you cannot claim a booster role in this server as it does not have one set up!",
            ),
        });

        return;
    }

    const { member } = interaction;

    if (!member.premiumSince) {
        await InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                "I'm sorry, you cannot claim a booster role as you are not currently boosting the server!",
            ),
        });

        return;
    }

    await InteractionHelper.deferReply(interaction);

    const userBoosterRole =
        await DatabaseManager.aliceDb.collections.boosterRole.getFromDiscordId(
            member.id,
        );

    if (userBoosterRole) {
        await InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                "I'm sorry, you have already claimed your booster role!",
            ),
        });

        return;
    }

    const boosterRoleCount =
        await DatabaseManager.aliceDb.collections.boosterRole.getCount();

    if (boosterRoleCount >= 20) {
        await InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                "I'm sorry, the maximum number of booster roles have already been claimed!",
            ),
        });

        return;
    }

    // Put the new role on top of the nitro booster role so that it takes color/icon precedence over the nitro booster role.
    const role = await interaction.guild.roles.create({
        name: `${interaction.user.username}'s Booster Role`,
        position: serverBoosterRole.position + 1,
        reason: `Booster role claimed by ${interaction.user.tag} (${interaction.user.id})`,
    });

    await DatabaseManager.aliceDb.collections.boosterRole.insert({
        discordId: member.id,
        roleId: role.id,
    });

    await member.roles.add(role, "Booster role claimed");

    await InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            "You have successfully claimed your booster role! Use other subcommands to manage its name, color, and icon.",
        ),
    });
};

export const config: SlashSubcommand["config"] = {
    cooldown: 10,
};
