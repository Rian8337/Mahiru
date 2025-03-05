import { Config } from "@core/Config";
import { Constants } from "@core/Constants";
import { Language } from "@localization/base/Language";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { CommandHelperLocalization } from "@localization/utils/helpers/CommandHelper/CommandHelperLocalization";
import { Manager } from "@utils/base/Manager";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { SelectMenuCreator } from "@utils/creators/SelectMenuCreator";
import { CommandUtilManager } from "@utils/managers/CommandUtilManager";
import {
    ApplicationCommandOptionType,
    BaseGuildTextChannel,
    BaseInteraction,
    ChannelType,
    ChatInputCommandInteraction,
    CommandInteraction,
    GuildMember,
    Locale,
    PermissionResolvable,
    SelectMenuComponentOptionData,
    Snowflake,
    StringSelectMenuInteraction,
    ThreadChannel,
    User,
} from "discord.js";
import {
    ChannelCooldownKey,
    GlobalCooldownKey,
} from "structures/core/CooldownKey";
import { Permission } from "structures/core/Permission";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { CacheManager } from "../managers/CacheManager";
import { DateTimeFormatHelper } from "./DateTimeFormatHelper";
import { InteractionHelper } from "./InteractionHelper";
import { PermissionHelper } from "./PermissionHelper";

/**
 * Helpers for commands.
 */
export abstract class CommandHelper extends Manager {
    /**
     * Runs a slash subcommand that isn't directly picked by the user via an interaction.
     *
     * The user will be prompted to choose which subcommand to run using a select menu.
     *
     * @param interaction The interaction that triggered the subcommand.
     * @param mainCommandDirectory The directory of the subcommand.
     * @param subcommandChoices The subcommands of the command. The user will be prompted to choose one of these subcommands in order.
     * @param placeholder The placeholder text for the subcommand's select menu.
     */
    static async runSlashSubcommandNotFromInteraction(
        interaction: ChatInputCommandInteraction,
        mainCommandDirectory: string,
        subcommandChoices: SelectMenuComponentOptionData[],
        placeholder: string
    ): Promise<unknown> {
        const selectMenuInteraction =
            await SelectMenuCreator.createStringSelectMenu(
                interaction,
                {
                    content: MessageCreator.createWarn(placeholder),
                },
                subcommandChoices,
                [interaction.user.id],
                20
            );

        if (!selectMenuInteraction) {
            return;
        }

        const pickedSubcommand = selectMenuInteraction.values[0];

        return this.runSlashSubOrGroup(
            selectMenuInteraction,
            await import(
                `${mainCommandDirectory}/subcommands/${pickedSubcommand}`
            )
        );
    }

    /**
     * Gets the preferred locale of an interaction.
     *
     * @param interaction The interaction.
     * @returns The preferred locale of the channel or server, either set locally to bot or from the interaction.
     */
    static getLocale(interaction: BaseInteraction): Language;

    /**
     * Gets the preferred locale of a channel.
     *
     * @param channel The channel.
     * @returns The preferred locale of the channel or server, English if the channel doesn't have a preferred locale.
     */
    static getLocale(channel: BaseGuildTextChannel): Language;

    /**
     * Gets the preferred locale of a user.
     *
     * Keep in mind that this is only for command usage (e.g. in DM). To directly retrieve a user's locale information, use `<UserLocaleCollectionManager>.getUserLocale()`.
     *
     * @param user The user.
     * @returns The preferred locale of the user, English if the user doesn't have a preferred locale.
     */
    static getLocale(user: User): Language;

    /**
     * Gets the preferred locale of a user.
     *
     * Keep in mind that this is only for command usage (e.g. in DM). To directly retrieve a user's locale information, use `<UserLocaleCollectionManager>.getUserLocale()`.
     *
     * @param userId The ID of the user.
     * @returns The preferred locale of the user, English if the user doesn't have a preferred locale.
     */
    static getLocale(userId: Snowflake): Language;

    /**
     * Gets the preferred locale of a channel.
     *
     * @param channelId The ID of the channel.
     * @param guildId The ID of the guild.
     * @returns The preferred locale of the channel or server, English if the channel doesn't have a preferred locale.
     */
    static getLocale(channelId: Snowflake, guildId: Snowflake): Language;

    static getLocale(
        input: BaseInteraction | BaseGuildTextChannel | Snowflake | User,
        guildId?: Snowflake
    ): Language {
        let language: Language | undefined;

        if (
            (input instanceof BaseInteraction &&
                input.channel?.type === ChannelType.DM) ||
            input instanceof User ||
            // This indicates user ID.
            (typeof input === "string" && guildId === undefined)
        ) {
            if (input instanceof BaseInteraction) {
                switch (input.locale) {
                    case Locale.Korean:
                        language = "kr";
                        break;
                    case Locale.SpanishES:
                        language = "es";
                        break;
                    case Locale.Indonesian:
                        language = "id";
                        break;
                }
            }

            return (
                language ??
                this.getUserPreferredLocale(
                    input instanceof BaseInteraction
                        ? input.user.id
                        : input instanceof User
                          ? input.id
                          : input
                )
            );
        }

        let channelId: Snowflake;

        if (input instanceof BaseInteraction) {
            channelId = input.channel?.isThread()
                ? input.channel.parentId!
                : input.channelId!;
            guildId = input.guildId!;
        } else if (input instanceof ThreadChannel) {
            channelId = input.parentId!;
            guildId = input.guildId;
        } else if (input instanceof BaseGuildTextChannel) {
            channelId = input.id;
            guildId = input.guildId;
        } else {
            channelId = input;
            guildId = guildId!;
        }

        return (
            CacheManager.channelLocale.get(channelId) ??
            CacheManager.guildLocale.get(guildId) ??
            "en"
        );
    }

    /**
     * Gets the preferred locale of a user.
     *
     * @param interaction The interaction between the user.
     * @returns The user's preferred locale, English if the user doesn't have a preferred locale.
     */
    static getUserPreferredLocale(interaction: BaseInteraction): Language;

    /**
     * Gets the preferred locale of a user.
     *
     * @param user The user.
     * @returns The user's preferred locale, English if the user doesn't have a preferred locale.
     */
    static getUserPreferredLocale(user: User): Language;

    /**
     * Gets the preferred locale of a user.
     *
     * @param userId The ID of the user.
     * @returns The user's preferred locale, English if the user doesn't have a preferred locale.
     */
    static getUserPreferredLocale(userId: Snowflake): Language;

    static getUserPreferredLocale(
        input: BaseInteraction | Snowflake | User
    ): Language {
        const id =
            input instanceof BaseInteraction
                ? input.user.id
                : input instanceof User
                  ? input.id
                  : input;

        return CacheManager.userLocale.get(id) ?? "en";
    }

    /**
     * Runs a slash subcommand or subcommand group that is directly picked
     * by the user via an interaction.
     *
     * Use this if a command has both subcommands and subcommand groups.
     *
     * @param interaction The interaction that triggered the subcommand or subcommand group.
     * @param language The locale of the user who attempted to run the subcommand or subcommand group. Defaults to the locale of the user.
     */
    static runSlashSubcommandOrGroup(
        interaction: ChatInputCommandInteraction,
        language: Language = this.getLocale(interaction)
    ): Promise<unknown> {
        if (interaction.options.getSubcommandGroup(false)) {
            return this.runSlashSubcommandGroup(interaction, language);
        } else {
            return this.runSlashSubcommandFromInteraction(
                interaction,
                language
            );
        }
    }

    /**
     * Runs a slash subcommand that is directly picked by the user via an interaction.
     *
     * @param interaction The interaction that triggered the subcommand.
     * @param language The locale of the user who attempted to run the subcommand. Defaults to the locale of the user.
     */
    static runSlashSubcommandFromInteraction(
        interaction: ChatInputCommandInteraction,
        language: Language = this.getLocale(interaction)
    ): Promise<unknown> {
        return this.runSlashSubOrGroup(
            interaction,
            this.getSlashSubcommand(interaction),
            language
        );
    }

    /**
     * Runs a slash subcommand group picked by the user via an interaction.
     *
     * This should only be used inside a command.
     *
     * @param interaction The interaction that triggered the command.
     * @param language The locale of the user who attempted to run the subcommand group. Defaults to locale of the user.
     */
    static runSlashSubcommandGroup(
        interaction: ChatInputCommandInteraction,
        language: Language = this.getLocale(interaction)
    ): Promise<unknown> {
        return this.runSlashSubOrGroup(
            interaction,
            this.getSlashSubcommandGroup(interaction),
            language
        );
    }

    /**
     * Runs a slash subcommand group or subcommand.
     *
     * @param interaction The interaction that triggered the subcommand group or subcommand.
     * @param subcommand The subcommand to run.
     * @param language The locale of the user who attempted to run the subcommand group or subcommand. Defaults to the locale of the user.
     */
    private static runSlashSubOrGroup(
        interaction: ChatInputCommandInteraction | StringSelectMenuInteraction,
        subcommand?: SlashSubcommand,
        language: Language = this.getLocale(interaction)
    ): Promise<unknown> {
        const localization = this.getLocalization(language);

        if (!subcommand) {
            return InteractionHelper.reply(interaction, {
                content: MessageCreator.createReject(
                    localization.getTranslation("commandNotFound")
                ),
            });
        }

        if (
            subcommand.config?.permissions &&
            !this.userFulfillsCommandPermission(
                interaction,
                subcommand.config.permissions
            )
        ) {
            interaction.ephemeral = true;

            return InteractionHelper.reply(interaction, {
                content: MessageCreator.createReject(
                    `${new ConstantsLocalization(language).getTranslation(
                        Constants.noPermissionReject
                    )} ${localization.getTranslation(
                        "permissionsRequired"
                    )}: \`${PermissionHelper.getPermissionString(
                        subcommand.config.permissions
                    )}\`.`
                ),
            });
        }

        return subcommand.run(this.client, interaction);
    }

    /**
     * Gets the slash subcommand that is run by the user via an interaction.
     *
     * @param interaction The interaction that triggered the subcommand.
     * @returns The subcommand, if found.
     */
    static getSlashSubcommand(
        interaction: ChatInputCommandInteraction
    ): SlashSubcommand | undefined {
        if (!interaction.options.getSubcommand(false)) {
            return;
        }

        const subcommandFileName = [
            interaction.commandName,
            interaction.options.getSubcommandGroup(false) ?? "",
            interaction.options.getSubcommand(),
        ]
            .filter(Boolean)
            .join("-");

        return this.client.interactions.chatInput
            .get(interaction.commandName)
            ?.subcommands.get(subcommandFileName);
    }

    /**
     * Gets the slash subcommand group that is run by the user via an interaction.
     *
     * @param interaction The interaction that triggered the subcommand group.
     * @returns The subcommand group, if found.
     */
    static getSlashSubcommandGroup(
        interaction: ChatInputCommandInteraction
    ): SlashSubcommand | undefined {
        if (!interaction.options.getSubcommandGroup(false)) {
            return;
        }

        const subcommandGroupName = [
            interaction.commandName,
            interaction.options.getSubcommandGroup(),
        ].join("-");

        return this.client.interactions.chatInput
            .get(interaction.commandName)
            ?.subcommandGroups.get(subcommandGroupName);
    }

    /**
     * Checks if an interaction fulfills a command's permissions.
     *
     * @param message The interaction that executed the command.
     * @param permissions The command's permissions.
     * @returns Whether the interaction can run the command.
     */
    static userFulfillsCommandPermission(
        interaction: BaseInteraction,
        permissions: Permission[]
    ): boolean {
        for (const p of permissions) {
            switch (p) {
                case "BotOwner":
                    return this.isExecutedByBotOwner(interaction);

                case "Special":
                    return true;
            }
        }

        return this.checkPermission(
            interaction,
            ...(permissions as PermissionResolvable[])
        );
    }

    /**
     * Checks whether an interaction has all the specified permissions.
     *
     * Both channel-specific and guild-wide permissions will be considered.
     *
     * @param interaction The interaction.
     * @param permissions The permissions to check for.
     * @returns Whether the guild member has all the specified permissions.
     */
    static checkPermission(
        interaction: BaseInteraction,
        ...permissions: PermissionResolvable[]
    ): boolean {
        if (permissions.length === 0) {
            return true;
        }

        const member = <GuildMember | null>interaction.member;

        if (!member || interaction.channel?.type === ChannelType.DM) {
            return false;
        }

        return interaction.memberPermissions?.has(permissions) ?? false;
    }

    /**
     * Checks if a command triggered by an interaction is enabled globally, in the guild, or in the channel.
     *
     * @param interaction The interaction.
     * @returns Whether the command is enabled.
     */
    static isCommandEnabled(interaction: CommandInteraction): boolean {
        // Hierarchy: global --> guild --> channel
        if (
            CommandUtilManager.globallyDisabledCommands.get(
                interaction.commandName
            ) === -1
        ) {
            return false;
        }

        if (interaction.inGuild()) {
            const guildSetting = CommandUtilManager.guildDisabledCommands.get(
                interaction.guildId
            );

            if (guildSetting?.get(interaction.commandName)?.cooldown === -1) {
                return false;
            }
        }

        return (
            CommandUtilManager.channelDisabledCommands
                .get(interaction.channelId)
                ?.get(interaction.commandName)?.cooldown !== -1
        );
    }

    /**
     * Converts a command option type to its string representation.
     *
     * @param type The command option type to convert.
     * @returns The command option type's string representation.
     */
    static optionTypeToString(type: ApplicationCommandOptionType): string {
        switch (type) {
            case ApplicationCommandOptionType.Boolean:
                return "Boolean";
            case ApplicationCommandOptionType.Channel:
                return "Channel";
            case ApplicationCommandOptionType.Integer:
                return "Integer";
            case ApplicationCommandOptionType.Mentionable:
                return "Mentionable";
            case ApplicationCommandOptionType.Number:
                return "Number";
            case ApplicationCommandOptionType.Role:
                return "Role";
            case ApplicationCommandOptionType.String:
                return "String";
            case ApplicationCommandOptionType.Subcommand:
                return "Subcommand";
            case ApplicationCommandOptionType.SubcommandGroup:
                return "Subcommand Group";
            case ApplicationCommandOptionType.User:
                return "User";
            case ApplicationCommandOptionType.Attachment:
                return "Attachment";
        }
    }

    /**
     * Activates a command's cooldown upon a user.
     *
     * @param key The key of the cooldown.
     * @param cooldown The cooldown to apply, in seconds.
     */
    static setCooldown(
        key: ChannelCooldownKey | GlobalCooldownKey,
        cooldown: number
    ): void {
        if (cooldown === 0) {
            return;
        }

        CacheManager.activeCommandCooldowns.add(key);

        setTimeout(() => {
            CacheManager.activeCommandCooldowns.delete(key);
        }, cooldown * 1000);
    }

    /**
     * Checks whether a cooldown still exists.
     *
     * @param key The key of the cooldown.
     * @returns Whether the cooldown with the specified key still exists.
     */
    static isCooldownActive(
        key: ChannelCooldownKey | GlobalCooldownKey
    ): boolean {
        return CacheManager.activeCommandCooldowns.has(key);
    }

    /**
     * Checks if a command triggered by an interaction is executed by a bot owner.
     *
     * @param interaction The interaction.
     * @returns Whether the command is executed by a bot owner.
     */
    static isExecutedByBotOwner(interaction: BaseInteraction): boolean {
        return Config.botOwners.includes(interaction.user.id);
    }

    /**
     * Converts a time format duration input to seconds.
     *
     * @param input The input.
     * @returns The amount of seconds represented by the input.
     */
    static convertStringTimeFormat(input: string): number {
        return DateTimeFormatHelper.DHMStoSeconds(input) || parseFloat(input);
    }

    /**
     * Gets the localization of this helper utility.
     *
     * @param language The language to localize.
     */
    private static getLocalization(
        language: Language
    ): CommandHelperLocalization {
        return new CommandHelperLocalization(language);
    }
}
