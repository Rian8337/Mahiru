import { Constants } from "@core/Constants";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { SettingsLocalization } from "@localization/interactions/commands/Staff/settings/SettingsLocalization";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { CommandUtilScope } from "structures/utils/CommandUtilScope";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { CommandUtilManager } from "@utils/managers/CommandUtilManager";

export const run: SlashSubcommand<true>["run"] = async (
    client,
    interaction
) => {
    if (!interaction.inCachedGuild()) {
        return;
    }

    const localization = new SettingsLocalization(
        CommandHelper.getLocale(interaction)
    );

    const event = interaction.options.getString("event", true);
    const utility = interaction.options.getString("utility", true);

    const scope =
        <CommandUtilScope>interaction.options.getString("scope") ?? "channel";

    const eventUtilities = client.eventUtilities.get(event);

    if (!eventUtilities) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("eventNotFound")
            ),
        });
    }

    const util = eventUtilities.get(utility);

    if (!util) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("eventUtilityNotFound")
            ),
        });
    }

    if (
        !CommandHelper.userFulfillsCommandPermission(
            interaction,
            util.config.togglePermissions
        )
    ) {
        interaction.ephemeral = true;

        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                new ConstantsLocalization(localization.language).getTranslation(
                    Constants.noPermissionReject
                )
            ),
        });
    }

    await InteractionHelper.deferReply(interaction);

    switch (scope) {
        case "channel":
            await CommandUtilManager.disableUtilityInChannel(
                interaction.channel!.isThread()
                    ? interaction.channel.parent!
                    : interaction.channel!,
                event,
                utility
            );
            break;

        case "guild":
            await CommandUtilManager.disableUtilityInGuild(
                interaction.guildId,
                event,
                utility
            );
            break;

        case "global":
            // Only allow bot owners to globally disable an event utility
            if (!CommandHelper.isExecutedByBotOwner(interaction)) {
                interaction.ephemeral = true;

                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        new ConstantsLocalization(
                            localization.language
                        ).getTranslation(Constants.noPermissionReject)
                    ),
                });
            }

            CommandUtilManager.disableUtilityGlobally(event, utility);
            break;
    }

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("eventUtilityDisableSuccess"),
            utility,
            event
        ),
    });
};
