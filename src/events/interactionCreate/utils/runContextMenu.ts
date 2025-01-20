import { Config } from "@core/Config";
import { ContextMenuCommand } from "structures/core/ContextMenuCommand";
import { EventUtil } from "structures/core/EventUtil";
import { RunContextMenuLocalization } from "@localization/events/interactionCreate/runContextMenu/RunContextMenuLocalization";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import { StringHelper } from "@utils/helpers/StringHelper";
import { BaseInteraction } from "discord.js";
import { consola } from "consola";
import { GlobalCooldownKey } from "@structures/core/CooldownKey";
import { CommandUtilManager } from "@utils/managers/CommandUtilManager";

export const run: EventUtil["run"] = async (
    client,
    interaction: BaseInteraction,
) => {
    if (
        !interaction.isUserContextMenuCommand() &&
        !interaction.isMessageContextMenuCommand()
    ) {
        return;
    }

    // 3 seconds should be enough to get the user's locale
    const localization = new RunContextMenuLocalization(
        CommandHelper.getLocale(interaction),
    );

    const botOwnerExecution = CommandHelper.isExecutedByBotOwner(interaction);

    if (Config.isDebug && !botOwnerExecution) {
        return interaction.reply({
            content: MessageCreator.createReject(
                localization.getTranslation("debugModeActive"),
            ),
            ephemeral: true,
        });
    }

    const command: ContextMenuCommand | undefined = (
        interaction.isMessageContextMenuCommand()
            ? client.interactions.contextMenu.message
            : client.interactions.contextMenu.user
    ).get(interaction.commandName);

    if (!command) {
        return interaction.reply({
            content: MessageCreator.createReject(
                localization.getTranslation("commandNotFound"),
            ),
            ephemeral: true,
        });
    }

    // Check for maintenance
    if (Config.maintenance && !botOwnerExecution) {
        return interaction.reply({
            content: MessageCreator.createReject(
                StringHelper.formatString(
                    localization.getTranslation("maintenanceMode"),
                    Config.maintenanceReason,
                ),
            ),
            ephemeral: true,
        });
    }

    // Command cooldown
    if (!botOwnerExecution) {
        const cooldownKey: GlobalCooldownKey = `${interaction.user.id}:${interaction.commandName}`;

        if (CommandHelper.isCooldownActive(cooldownKey)) {
            return interaction.reply({
                content: MessageCreator.createReject(
                    localization.getTranslation("commandInCooldown"),
                ),
                ephemeral: true,
            });
        }

        CommandHelper.setCooldown(
            cooldownKey,
            Math.max(
                command.config.cooldown ?? 0,
                CommandUtilManager.globalCommandCooldown,
            ),
        );
    }

    // Log used command
    let logMessage = `Context Menu: ${interaction.user.tag}`;

    if (interaction.channel !== null) {
        if (interaction.channel.isDMBased()) {
            logMessage += ` (DM)`;
        } else {
            logMessage += ` (#${interaction.channel.name})`;
        }
    }

    logMessage += `: ${interaction.commandName}`;

    consola.info(logMessage);

    interaction.ephemeral =
        (command.config?.replyEphemeral || Config.maintenance) ?? false;

    if (Config.isDebug && command.config?.instantDeferInDebug !== false) {
        // Attempt to instantly defer in debug mode (slower internet).
        await InteractionHelper.deferReply(interaction);
    }

    // Finally, run the command
    command.run(client, interaction).catch((e: Error) => {
        InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("commandExecutionFailed"),
            ),
        });

        client.emit("error", e);
    });
};

export const config: EventUtil["config"] = {
    description:
        "Responsible for handling message context menus. This event utility cannot be disabled.",
    togglePermissions: [],
    toggleScope: [],
    debugEnabled: true,
};
