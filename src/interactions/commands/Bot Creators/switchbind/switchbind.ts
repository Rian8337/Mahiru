import { DatabaseManager } from "@database/DatabaseManager";
import { CommandCategory } from "@enums/core/CommandCategory";
import { SlashCommand } from "structures/core/SlashCommand";
import { Constants } from "@core/Constants";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { ApplicationCommandOptionType } from "discord.js";
import { SwitchbindLocalization } from "@localization/interactions/commands/Bot Creators/switchbind/SwitchbindLocalization";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";

export const run: SlashCommand["run"] = async (client, interaction) => {
    const localization = new SwitchbindLocalization(
        CommandHelper.getLocale(interaction),
    );

    if (
        !CommandHelper.isExecutedByBotOwner(interaction) &&
        (!interaction.inCachedGuild() ||
            !interaction.member.roles.cache.has("803154670380908575"))
    ) {
        interaction.ephemeral = true;

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                new ConstantsLocalization(localization.language).getTranslation(
                    Constants.noPermissionReject,
                ),
            ),
        });
    }

    await InteractionHelper.deferReply(interaction);

    const from = interaction.options.getUser("from", true);
    const to = interaction.options.getUser("to", true);

    const bindInfo =
        await DatabaseManager.elainaDb.collections.userBind.getFromUser(from);

    if (!bindInfo) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("uidNotBinded"),
            ),
        });
    }

    const result = await bindInfo.moveBind(to.id, localization.language);

    if (result.failed()) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("switchFailed"),
                result.reason,
            ),
        });
    }

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("switchSuccessful"),
        ),
    });
};

export const category: SlashCommand["category"] = CommandCategory.botCreators;

export const config: SlashCommand["config"] = {
    name: "switchbind",
    description: "Switches a Discord account bind to another Discord account.",
    options: [
        {
            name: "from",
            required: true,
            type: ApplicationCommandOptionType.User,
            description: "The user to switch the bind from.",
        },
        {
            name: "to",
            required: true,
            type: ApplicationCommandOptionType.User,
            description: "The user to switch the bind to.",
        },
    ],
    example: [
        {
            command: "switchbind from:51076 to:@Rian8337#0001",
            arguments: [
                {
                    name: "from",
                    value: "@neroyuki",
                },
                {
                    name: "to",
                    value: "@rian8337",
                },
            ],
            description:
                "will switch the Discord account bind from neroyuki to rian8337.",
        },
        {
            command:
                "switchbind from:386742340968120321 user:132783516176875520",
            arguments: [
                {
                    name: "from",
                    value: "386742340968120321",
                },
                {
                    name: "user",
                    value: "132783516176875520",
                },
            ],
            description:
                "will switch the Discord account bind from the Discord account with ID 386742340968120321 to the Discord account with ID 132783516176875520.",
        },
    ],
    permissions: ["Special"],
};
