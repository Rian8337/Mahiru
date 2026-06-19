import { DatabaseManager } from "@database/DatabaseManager";
import { RoleColorType } from "@enums/interactions/RoleColorType";
import { SlashSubcommand } from "@structures/core/SlashSubcommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { StringHelper } from "@utils/helpers/StringHelper";
import { ColorResolvable, Constants, GuildFeature } from "discord.js";

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

    const type = interaction.options.getString("type", true) as RoleColorType;

    switch (type) {
        case RoleColorType.Solid: {
            const primaryColor = interaction.options.getString("primarycolor");

            if (!primaryColor) {
                await InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        "I'm sorry, you must provide a color for solid color type!",
                    ),
                });

                return;
            }

            if (!StringHelper.isValidHexCode(primaryColor)) {
                await InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        "I'm sorry, the provided primary color is not a valid hex code!",
                    ),
                });

                return;
            }

            await role.setColors(
                { primaryColor: <ColorResolvable>primaryColor },
                `Booster role color changed by ${interaction.user.tag} (${interaction.user.id})`,
            );

            break;
        }

        case RoleColorType.Gradient: {
            if (
                !interaction.guild.features.includes(
                    GuildFeature.EnhancedRoleColors,
                )
            ) {
                await InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        "I'm sorry, the server does not have Enhanced Role Colors enabled!",
                    ),
                });
            }

            const primaryColor = interaction.options.getString("primarycolor");
            const secondaryColor =
                interaction.options.getString("secondarycolor");

            if (!primaryColor || !secondaryColor) {
                await InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        "I'm sorry, you must provide both primary and secondary colors for gradient color type!",
                    ),
                });

                return;
            }

            if (!StringHelper.isValidHexCode(primaryColor)) {
                await InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        "I'm sorry, the primary color is not a valid hex code!",
                    ),
                });

                return;
            }

            if (!StringHelper.isValidHexCode(secondaryColor)) {
                await InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        "I'm sorry, the secondary color is not a valid hex code!",
                    ),
                });

                return;
            }

            await role.setColors(
                {
                    primaryColor: <ColorResolvable>primaryColor,
                    secondaryColor: <ColorResolvable>secondaryColor,
                },
                `Booster role color changed by ${interaction.user.tag} (${interaction.user.id})`,
            );

            break;
        }

        case RoleColorType.Holographic:
            if (
                !interaction.guild.features.includes(
                    GuildFeature.EnhancedRoleColors,
                )
            ) {
                await InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        "I'm sorry, the server does not have Enhanced Role Colors enabled!",
                    ),
                });
            }

            await role.setColors(
                {
                    primaryColor: Constants.HolographicStyle.Primary,
                    secondaryColor: Constants.HolographicStyle.Secondary,
                    tertiaryColor: Constants.HolographicStyle.Tertiary,
                },
                `Booster role color changed by ${interaction.user.tag} (${interaction.user.id})`,
            );

            break;
    }

    await InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            "Successfully changed the color of your booster role.",
        ),
    });
};
