import { GuildMember, InteractionContextType } from "discord.js";
import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { ApplicationCommandOptionType } from "discord.js";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { CoinsLocalization } from "@localization/interactions/commands/Fun/coins/CoinsLocalization";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashCommand["run"] = async (_, interaction) => {
    const localization = new CoinsLocalization(
        CommandHelper.getLocale(interaction)
    );

    if (
        DateTimeFormatHelper.getTimeDifference(
            (<GuildMember>interaction.member).joinedAt!
        ) >
        -86400 * 1000 * 7
    ) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("userNotInServerForAWeek")
            ),
        });
    }

    CommandHelper.runSlashSubcommandFromInteraction(interaction);
};

export const category: SlashCommand["category"] = CommandCategory.fun;

export const config: SlashCommand["config"] = {
    name: "coins",
    description: "Main command for Mahiru coins.",
    options: [
        {
            name: "add",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Adds Mahiru coins to a user (bot owner only).",
            options: [
                {
                    name: "user",
                    required: true,
                    type: ApplicationCommandOptionType.User,
                    description: "The user to add Mahiru coins to.",
                },
                {
                    name: "amount",
                    required: true,
                    type: ApplicationCommandOptionType.Integer,
                    description: "The amount of Mahiru coins to add.",
                    minValue: 0,
                },
            ],
        },
        {
            name: "claim",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Claim daily Mahiru coins.",
        },
        {
            name: "remove",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Remove Mahiru coins from a user (bot owner only).",
            options: [
                {
                    name: "user",
                    required: true,
                    type: ApplicationCommandOptionType.User,
                    description: "The user to remove Mahiru coins from.",
                },
                {
                    name: "amount",
                    required: true,
                    type: ApplicationCommandOptionType.Integer,
                    description: "The amount of Mahiru coins to remove.",
                    minValue: 0,
                },
            ],
        },
        {
            name: "transfer",
            type: ApplicationCommandOptionType.Subcommand,
            description: "Transfer your Mahiru coins to a user",
            options: [
                {
                    name: "user",
                    required: true,
                    type: ApplicationCommandOptionType.User,
                    description: "The user to transfer Mahiru coins to.",
                },
                {
                    name: "amount",
                    required: true,
                    type: ApplicationCommandOptionType.Integer,
                    description: "The amount of Mahiru coins to transfer.",
                    minValue: 0,
                },
            ],
        },
        {
            name: "view",
            type: ApplicationCommandOptionType.Subcommand,
            description: "View a user's Mahiru coins.",
            options: [
                {
                    name: "user",
                    type: ApplicationCommandOptionType.User,
                    description: "The user to view. Defaults to yourself.",
                },
            ],
        },
    ],
    example: [
        {
            command: "coins claim",
            description: "will claim your daily Mahiru coins.",
        },
        {
            command: "coins transfer",
            arguments: [
                {
                    name: "user",
                    value: "@rian8337",
                },
                {
                    name: "amount",
                    value: 500,
                },
            ],
            description: "will transfer 500 Mahiru coins to Rian8337.",
        },
        {
            command: "coins view",
            arguments: [
                {
                    name: "user",
                    value: "132783516176875520",
                },
            ],
            description:
                "will view the amount of Mahiru coins of the Discord account with that ID.",
        },
    ],
    contexts: [InteractionContextType.Guild],
};
