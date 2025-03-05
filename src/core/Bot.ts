import { lstat, readdir } from "fs/promises";
import { join } from "path";
import {
    ApplicationCommandData,
    Client,
    Collection,
    GatewayIntentBits,
    Partials,
    Snowflake,
} from "discord.js";
import { consola } from "consola";
import { SlashCommand } from "structures/core/SlashCommand";
import { Event } from "structures/core/Event";
import { LoungeLockManager } from "@utils/managers/LoungeLockManager";
import { ProfileManager } from "@utils/managers/ProfileManager";
import { DatabaseManager } from "@database/DatabaseManager";
import { CommandUtilManager } from "@utils/managers/CommandUtilManager";
import { EventUtil } from "structures/core/EventUtil";
import { StringHelper } from "@utils/helpers/StringHelper";
import { Manager } from "@utils/base/Manager";
import { SlashSubcommand } from "structures/core/SlashSubcommand";
import { ModalCommand } from "structures/core/ModalCommand";
import { BotInteractions } from "structures/core/BotInteractions";
import { ContextMenuCommand } from "structures/core/ContextMenuCommand";
import { Config } from "./Config";
import { AutocompleteHandler } from "@structures/core/AutocompleteHandler";
import { AutocompleteSubhandler } from "@structures/core/AutocompleteSubhandler";
import { ButtonCommand } from "@structures/core/ButtonCommand";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { AnniversaryTriviaManager } from "@utils/managers/AnniversaryTriviaManager";
import { PunishmentManager } from "@utils/managers/PunishmentManager";

/**
 * The starting point of the bot.
 *
 * Upon initialization, the bot will automatically log in.
 */
export class Bot extends Client<true> {
    /**
     * The interactions that this bot has.
     */
    readonly interactions: BotInteractions = {
        autocomplete: new Collection(),
        button: new Collection(),
        chatInput: new Collection(),
        contextMenu: {
            message: new Collection(),
            user: new Collection(),
        },
        modalSubmit: new Collection(),
    };

    /**
     * The event utilities that this bot has, mapped by the event's name, and each utility mapped by its name.
     */
    readonly eventUtilities = new Collection<
        string,
        Collection<string, EventUtil>
    >();

    /**
     * Whether the bot has been initialized.
     */
    private isInitialized = false;

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildEmojisAndStickers,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.MessageContent,
            ],
            partials: [
                Partials.Channel,
                Partials.GuildMember,
                Partials.GuildScheduledEvent,
                Partials.User,
                Partials.Message,
                Partials.Reaction,
                Partials.ThreadMember,
            ],
        });

        Manager.init(this);
    }

    /**
     * Initializes the bot.
     */
    async start(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        this.isInitialized = true;

        consola.wrapAll();

        await this.loadSlashCommands();
        await this.loadContextMenuCommands();
        await this.loadModalCommands();
        await this.loadAutocompleteHandlers();
        await this.loadButtonCommands();
        await this.loadEvents();
        await DatabaseManager.init();
        await LocaleHelper.loadLocales();
        await AnniversaryTriviaManager.init();

        await super.login(
            Config.isDebug ? process.env.DEBUG_BOT_TOKEN : process.env.BOT_TOKEN
        );

        await this.initUtils();
        await this.registerDeployCommands();

        consola.success("Discord API connection established");
        consola.success("Mahiru Shiina is up and running");
    }

    /**
     * Loads slash commands from `interactions/commands` directory.
     */
    private async loadSlashCommands(): Promise<void> {
        consola.info("Loading slash commands");

        const commandPath = join(__dirname, "..", "interactions", "commands");
        const folders = await readdir(commandPath);

        let i = 0;

        for (const folder of folders) {
            consola.info("%d. Loading folder %s", ++i, folder);

            const commands = await readdir(join(commandPath, folder));

            let j = 0;

            for (const command of commands) {
                consola.success("%d.%d. %s loaded", i, ++j, command);

                const filePath = join(commandPath, folder, command);

                const file: SlashCommand = await import(
                    `${filePath}/${command}`
                );

                this.interactions.chatInput.set(command, {
                    ...file,
                    subcommandGroups: new Collection(),
                    subcommands: new Collection(),
                });

                await this.loadSlashSubcommandGroups(command, filePath);

                await this.loadSlashSubcommands(command, filePath);
            }
        }

        // Sort command alphabetically by name so that autocomplete
        // returns command list in order.
        this.interactions.chatInput.sort((_, __, a, b) => a.localeCompare(b));
    }

    /**
     * Loads slash subcommand groups from the specified directory and caches them.
     *
     * @param commandName The name of the command.
     * @param commandDirectory The directory of the command.
     */
    private async loadSlashSubcommandGroups(
        commandName: string,
        commandDirectory: string
    ): Promise<void> {
        const subcommandGroupPath = join(commandDirectory, "subcommandGroups");
        let subcommandGroups: string[];

        try {
            subcommandGroups = await readdir(subcommandGroupPath);
        } catch {
            return;
        }

        const collection =
            this.interactions.chatInput.get(commandName)!.subcommandGroups;

        for (const subcommandGroup of subcommandGroups) {
            const filePath = `${subcommandGroupPath}/${subcommandGroup}`;

            const file: SlashSubcommand = await import(
                join(filePath, subcommandGroup)
            );

            collection.set(subcommandGroup, file);

            await this.loadSlashSubcommands(commandName, filePath);
        }
    }

    /**
     * Loads slash subcommands from the specified directory and caches them.
     *
     * @param commandName The name of the command.
     * @param commandDirectory The directory of the command.
     */
    private async loadSlashSubcommands(
        commandName: string,
        commandDirectory: string
    ): Promise<void> {
        const subcommandPath = join(commandDirectory, "subcommands");
        let subcommands: string[];

        try {
            subcommands = await readdir(subcommandPath);
        } catch {
            return;
        }

        const collection =
            this.interactions.chatInput.get(commandName)!.subcommands;

        for (const subcommand of subcommands.filter((v) => v.endsWith(".js"))) {
            const filePath = join(subcommandPath, subcommand);
            const fileStat = await lstat(filePath);

            if (fileStat.isDirectory()) {
                continue;
            }

            const file: SlashSubcommand = await import(filePath);

            collection.set(
                subcommand.substring(0, subcommand.length - 3),
                file
            );
        }
    }

    /**
     * Loads context menu commands from `interactions/contextmenus` directory.
     */
    private async loadContextMenuCommands(): Promise<void> {
        const commandPath = join(
            __dirname,
            "..",
            "interactions",
            "contextmenus"
        );

        const loadCommands = async (
            collection: Collection<string, ContextMenuCommand>,
            folder: string
        ): Promise<void> => {
            const commands = await readdir(join(commandPath, folder));

            consola.info("Loading %s context menu commands", folder);

            let i = 0;

            for (const command of commands.filter((v) => v.endsWith(".js"))) {
                consola.success(
                    "%d. %s loaded",
                    ++i,
                    command.substring(0, command.length - 3)
                );

                const file: ContextMenuCommand = await import(
                    join(commandPath, folder, command)
                );

                collection.set(file.config.name, file);
            }
        };

        await loadCommands(this.interactions.contextMenu.message, "message");
        await loadCommands(this.interactions.contextMenu.user, "user");
    }

    /**
     * Loads modal submit commands from `interactions/modals` directory.
     */
    private async loadModalCommands(): Promise<void> {
        consola.info("Loading modal submit commands");

        const commandPath = join(__dirname, "..", "interactions", "modals");
        const folders = await readdir(commandPath);

        let i = 0;

        for (const folder of folders) {
            consola.info("%d. Loading folder %s", ++i, folder);

            const commands = await readdir(join(commandPath, folder));

            let j = 0;

            for (const command of commands.filter((v) => v.endsWith(".js"))) {
                consola.success(
                    "%d.%d. %s loaded",
                    i,
                    ++j,
                    command.substring(0, command.length - 3)
                );

                const file: ModalCommand = await import(
                    join(commandPath, folder, command)
                );

                this.interactions.modalSubmit.set(
                    command.substring(0, command.length - 3),
                    file
                );
            }
        }
    }

    /**
     * Loads autocomplete handlers from `interactions/autocomplete` directory.
     */
    private async loadAutocompleteHandlers(): Promise<void> {
        consola.info("Loading autocomplete handlers");

        const commandPath = join(
            __dirname,
            "..",
            "interactions",
            "autocomplete"
        );

        const folders = await readdir(commandPath);

        let i = 0;

        for (const folder of folders) {
            consola.info("%d. Loading folder %s", ++i, folder);

            const handlers = await readdir(join(commandPath, folder));

            let j = 0;

            for (const handler of handlers) {
                consola.success("%d.%d. %s loaded", i, ++j, handler);

                const filePath = join(commandPath, folder, handler);

                const file: AutocompleteHandler = await import(
                    `${filePath}/${handler}`
                );

                this.interactions.autocomplete.set(handler, {
                    ...file,
                    subcommandGroups: new Collection(),
                    subcommands: new Collection(),
                });

                await this.loadSubcommandGroupAutocompleteHandlers(
                    handler,
                    filePath
                );

                await this.loadSubcommandAutocompleteHandlers(
                    handler,
                    filePath
                );
            }
        }
    }

    /**
     * Loads subcommand group autocomplete handlers from the specified directory and caches them.
     *
     * @param handlerName The name of the handler.
     * @param handlerDirectory The directory of the handler.
     */
    private async loadSubcommandGroupAutocompleteHandlers(
        handlerName: string,
        handlerDirectory: string
    ): Promise<void> {
        const subcommandGroupHandlerPath = join(
            handlerDirectory,
            "subcommandGroups"
        );
        let subcommandGroupHandlers: string[];

        try {
            subcommandGroupHandlers = await readdir(subcommandGroupHandlerPath);
        } catch {
            return;
        }

        const collection =
            this.interactions.autocomplete.get(handlerName)!.subcommandGroups;

        for (const s of subcommandGroupHandlers) {
            const filePath = `${subcommandGroupHandlerPath}/${s}`;

            const file: AutocompleteSubhandler = await import(
                join(filePath, s)
            );

            collection.set(s, file);

            await this.loadSubcommandAutocompleteHandlers(
                handlerName,
                filePath
            );
        }
    }

    /**
     * Loads subcommand autocomplete handlers from the specified directory and caches them.
     *
     * @param handlerName The name of the handler.
     * @param handlerDirectory The directory of the handler.
     */
    private async loadSubcommandAutocompleteHandlers(
        handlerName: string,
        handlerDirectory: string
    ): Promise<void> {
        const subcommandHandlersPath = join(handlerDirectory, "subcommands");
        let subcommandHandlers: string[];

        try {
            subcommandHandlers = await readdir(subcommandHandlersPath);
        } catch {
            return;
        }

        const collection =
            this.interactions.autocomplete.get(handlerName)!.subcommands;

        for (const s of subcommandHandlers.filter((v) => v.endsWith(".js"))) {
            const filePath = join(subcommandHandlersPath, s);
            const fileStat = await lstat(filePath);

            if (fileStat.isDirectory()) {
                continue;
            }

            const file: AutocompleteSubhandler = await import(filePath);

            collection.set(s.substring(0, s.length - 3), file);
        }
    }

    /**
     * Loads button commands from the `interactions/buttons` directory.
     */
    private async loadButtonCommands(): Promise<void> {
        consola.info("Loading button commands");

        const commandPath = join(__dirname, "..", "interactions", "buttons");
        const folders = await readdir(commandPath);

        let i = 0;

        for (const folder of folders) {
            consola.info("%d. Loading folder %s", ++i, folder);

            const commands = await readdir(join(commandPath, folder));
            let j = 0;

            for (const command of commands.filter((v) => v.endsWith(".js"))) {
                consola.success(
                    "%d.%d. %s loaded",
                    i,
                    ++j,
                    command.substring(0, command.length - 3)
                );

                const file: ButtonCommand = await import(
                    join(commandPath, folder, command)
                );

                this.interactions.button.set(
                    command.substring(0, command.length - 3),
                    file
                );
            }
        }
    }

    /**
     * Loads events and event utilities from `events` directory.
     */
    private async loadEvents(): Promise<void> {
        consola.info("Loading events and event utilities");

        const eventsPath = join(__dirname, "..", "events");
        const events = await readdir(eventsPath);

        let i = 0;

        for (const event of events) {
            const file: Event = await import(join(eventsPath, event, event));

            super.on(event, file.run.bind(null, this));

            const eventUtils = await readdir(join(eventsPath, event, "utils"));

            this.eventUtilities.set(event, new Collection());

            ++i;

            let j = 0;

            for (const eventUtil of eventUtils
                .filter((v) => v.endsWith(".js"))
                .map((v) => v.substring(0, v.length - 3))) {
                consola.success(
                    "%d.%d. %s :: %s event utility loaded",
                    i,
                    ++j,
                    event,
                    eventUtil
                );

                const eventUtility: EventUtil = await import(
                    join(eventsPath, event, "utils", eventUtil)
                );

                this.eventUtilities.get(event)!.set(eventUtil, eventUtility);
            }
        }
    }

    /**
     * Initializes utilities.
     */
    private async initUtils(): Promise<void> {
        ProfileManager.init();
        await CommandUtilManager.init();
        await LoungeLockManager.init();
        await PunishmentManager.init();
    }

    /**
     * Registers deploy and undeploy commands to register other commands.
     *
     * @param forceRegister Whether to force register the commands.
     */
    private async registerDeployCommands(
        forceRegister?: boolean
    ): Promise<void> {
        const deployCommandID = <Snowflake>(
            (Config.isDebug
                ? process.env.DEBUG_BOT_DEPLOY_ID
                : process.env.BOT_DEPLOY_ID)
        );
        const undeployCommandID = <Snowflake>(
            (Config.isDebug
                ? process.env.DEBUG_BOT_UNDEPLOY_ID
                : process.env.BOT_UNDEPLOY_ID)
        );

        const registerCommand = async (name: string): Promise<void> => {
            consola.info(`Registering ${name} command`);

            const command = this.interactions.chatInput.get(name)!;

            const data: ApplicationCommandData = {
                name: command.config.name,
                description: command.config.description,
                options: command.config.options,
            };

            const applicationCommand =
                await this.application.commands.create(data);

            consola.info(
                `Command ${name} registered with ID ${applicationCommand?.id}`
            );

            consola.info(
                `${StringHelper.capitalizeString(name)} command registered`
            );
        };

        if (
            forceRegister ||
            !(await this.application.commands.fetch(deployCommandID))
        ) {
            await registerCommand("deploy");
        }

        if (
            forceRegister ||
            !(await this.application.commands.fetch(undeployCommandID))
        ) {
            await registerCommand("undeploy");
        }
    }
}
