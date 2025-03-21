import { Constants } from "@core/Constants";
import { SlashCommand } from "structures/core/SlashCommand";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { OperationResult } from "structures/core/OperationResult";
import { CommandUtilScope } from "structures/utils/CommandUtilScope";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { CommandUtilManager } from "@utils/managers/CommandUtilManager";
import { SettingsLocalization } from "@localization/interactions/commands/Staff/settings/SettingsLocalization";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashSubcommand<true>["run"] = async (
    client,
    interaction,
) => {
    if (!interaction.inGuild()) {
        return;
    }

    const localization: SettingsLocalization = new SettingsLocalization(
        CommandHelper.getLocale(interaction),
    );

    const constantsLocalization: ConstantsLocalization =
        new ConstantsLocalization(localization.language);

    const commandName: string = interaction.options.getString("command", true);

    const scope: CommandUtilScope =
        <CommandUtilScope>interaction.options.getString("scope") ?? "channel";

    const command: SlashCommand | undefined =
        client.interactions.chatInput.get(commandName);

    if (!command) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("commandNotFound"),
            ),
        });
    }

    if (
        !CommandHelper.isExecutedByBotOwner(interaction) &&
        command.config.permissions?.some((v) => v === "BotOwner")
    ) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("cannotDisableCommand"),
            ),
        });
    }

    let result: OperationResult | undefined;

    switch (scope) {
        case "channel":
            if (
                !CommandHelper.userFulfillsCommandPermission(interaction, [
                    "ManageChannels",
                ])
            ) {
                interaction.ephemeral = true;

                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        constantsLocalization.getTranslation(
                            Constants.noPermissionReject,
                        ),
                    ),
                });
            }

            result = await CommandUtilManager.setCommandCooldownInChannel(
                interaction.channel!.isThread()
                    ? interaction.channel.parent!
                    : interaction.channel!,
                commandName,
                -1,
            );
            break;
        case "guild":
            if (
                !CommandHelper.userFulfillsCommandPermission(interaction, [
                    "ManageGuild",
                ])
            ) {
                interaction.ephemeral = true;

                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        constantsLocalization.getTranslation(
                            Constants.noPermissionReject,
                        ),
                    ),
                });
            }

            result = await CommandUtilManager.setCommandCooldownInGuild(
                interaction.guildId!,
                commandName,
                -1,
            );
            break;
        case "global":
            // Only allow bot owners to globally disable a command
            if (!CommandHelper.isExecutedByBotOwner(interaction)) {
                interaction.ephemeral = true;

                return InteractionHelper.reply(interaction, {
                    content: MessageCreator.createReject(
                        constantsLocalization.getTranslation(
                            Constants.noPermissionReject,
                        ),
                    ),
                });
            }

            CommandUtilManager.setCommandCooldownGlobally(commandName, -1);
            break;
    }

    if (result && !result.success) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("disableCommandFailed"),
                result.reason!,
            ),
        });
    }

    InteractionHelper.reply(interaction, {
        content: MessageCreator.createAccept(
            localization.getTranslation("disableCommandSuccess"),
            commandName,
        ),
    });
};
