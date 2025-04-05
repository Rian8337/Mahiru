import { Symbols } from "@enums/utils/Symbols";
import { OnButtonPageChange } from "@structures/utils/OnButtonPageChange";
import { Language } from "@localization/base/Language";
import { MessageButtonCreatorLocalization } from "@localization/utils/creators/MessageButtonCreator/MessageButtonCreatorLocalization";
import { InteractionCollectorCreator } from "@utils/base/InteractionCollectorCreator";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";
import {
    InteractionReplyOptions,
    Message,
    Snowflake,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    APIButtonComponentWithCustomId,
    ButtonComponent,
    APIActionRowComponent,
    APIMessageActionRowComponent,
    APIEmbed,
    isJSONEncodable,
    AttachmentBuilder,
    RepliableInteraction,
} from "discord.js";
import { MessageCreator } from "./MessageCreator";
import { MissAnalyzer } from "@utils/missanalyzer/MissAnalyzer";
import { ReplayData } from "@rian8337/osu-droid-replay-analyzer";
import { OnButtonPressed } from "@structures/utils/OnButtonPressed";
import { OnButtonCollectorEnd } from "@structures/utils/OnButtonCollectorEnd";
import { CacheManager } from "@utils/managers/CacheManager";
import {
    Beatmap,
    IModApplicableToDroid,
    Mod,
    ModMap,
} from "@rian8337/osu-base";
import { TimingDistributionChart } from "@utils/timingdistribution/TimingDistributionChart";

/**
 * A utility to create message buttons.
 */
export abstract class MessageButtonCreator extends InteractionCollectorCreator {
    /**
     * Creates a button-based paging with limited page.
     *
     * If there is only 1 page to view, no buttons will be enabled.
     *
     * @param interaction The interaction that triggered the button-based paging.
     * @param options Options to be used when sending the button-based paging message.
     * @param users The IDs of users who can interact with the buttons.
     * @param startPage The page to start the paging from.
     * @param maxPage The maximum page of the button-based paging.
     * @param duration The duration the button-based paging will be active, in seconds.
     * @param onPageChange The function to be executed when the page is changed.
     * @param onPageChangeArgs Arguments for `onPageChange` function.
     * @returns The message resulted from the interaction's reply.
     */
    static createLimitedButtonBasedPaging(
        interaction: RepliableInteraction,
        options: InteractionReplyOptions,
        users: Snowflake[],
        startPage: number,
        maxPage: number,
        duration: number,
        onPageChange: OnButtonPageChange,
        ...onPageChangeArgs: unknown[]
    ): Promise<Message> {
        return this.createButtonBasedPaging(
            interaction,
            options,
            users,
            startPage,
            duration,
            onPageChange,
            maxPage,
            ...onPageChangeArgs
        );
    }

    /**
     * Creates a button-based paging with limitless page.
     *
     * @param interaction The interaction that triggered the button-based paging.
     * @param options Options to be used when sending the button-based paging message.
     * @param users The IDs of users who can interact with the buttons.
     * @param startPage The page to start the paging from.
     * @param duration The duration the button-based paging will be active, in seconds.
     * @param onPageChange The function to be executed when the page is changed.
     * @param onPageChangeArgs Arguments for `onPageChange` function.
     * @returns The message resulted from the interaction's reply.
     */
    static createLimitlessButtonBasedPaging(
        interaction: RepliableInteraction,
        options: InteractionReplyOptions,
        users: Snowflake[],
        startPage: number,
        duration: number,
        onPageChange: OnButtonPageChange,
        ...onPageChangeArgs: unknown[]
    ): Promise<Message> {
        return this.createButtonBasedPaging(
            interaction,
            options,
            users,
            startPage,
            duration,
            onPageChange,
            Number.POSITIVE_INFINITY,
            ...onPageChangeArgs
        );
    }

    /**
     * Creates a confirmation interaction using buttons.
     *
     * @param interaction The interaction that triggered the confirmation buttons.
     * @param options Options of the confirmation message.
     * @param users The users who can perform confirmation.
     * @param duration The duration the confirmation button collector will remain active, in seconds.
     * @param language The locale of the user who attempted to create the confirmation interaction. Defaults to English.
     * @returns A boolean determining whether the user confirmed.
     */
    static createConfirmation(
        interaction: RepliableInteraction,
        options: InteractionReplyOptions,
        users: Snowflake[],
        duration: number,
        language: Language = "en"
    ): Promise<boolean> {
        const localization = this.getLocalization(language);
        const buttons = this.createConfirmationButtons();

        return new Promise((resolve) =>
            this.createLimitedTimeButtons(
                interaction,
                options,
                buttons,
                users,
                duration,
                async (c, i) => {
                    await i.deferUpdate();

                    c.stop();
                },
                async (c) => {
                    const pressed = c.collector.collected.first();

                    if (pressed) {
                        if (pressed.customId === "confirmationYes") {
                            interaction.isMessageComponent()
                                ? await InteractionHelper.update(interaction, {
                                      content:
                                          MessageCreator.createPrefixedMessage(
                                              localization.getTranslation(
                                                  "pleaseWait"
                                              ),
                                              Symbols.timer
                                          ),
                                  })
                                : await InteractionHelper.reply(interaction, {
                                      content:
                                          MessageCreator.createPrefixedMessage(
                                              localization.getTranslation(
                                                  "pleaseWait"
                                              ),
                                              Symbols.timer
                                          ),
                                  });
                        } else {
                            interaction.isMessageComponent()
                                ? await InteractionHelper.update(interaction, {
                                      content: MessageCreator.createReject(
                                          localization.getTranslation(
                                              "actionCancelled"
                                          )
                                      ),
                                  })
                                : await InteractionHelper.reply(interaction, {
                                      content: MessageCreator.createReject(
                                          localization.getTranslation(
                                              "actionCancelled"
                                          )
                                      ),
                                  });

                            if (!interaction.ephemeral) {
                                setTimeout(() => {
                                    interaction.deleteReply();
                                }, 5 * 1000);
                            }
                        }

                        const index = (<ActionRowBuilder<ButtonBuilder>[]>(
                            options.components
                        )).findIndex((v) => {
                            return (
                                v.components.length === buttons.length &&
                                v.components.every(
                                    (c, i) =>
                                        (<APIButtonComponentWithCustomId>c.data)
                                            .custom_id ===
                                        (<APIButtonComponentWithCustomId>(
                                            buttons[i].data
                                        )).custom_id
                                )
                            );
                        });

                        if (index !== -1) {
                            const newComponents =
                                options.components?.slice() ?? [];

                            newComponents.splice(index, 1);

                            options.components = newComponents;
                        }
                    } else {
                        await InteractionHelper.reply(interaction, {
                            content: MessageCreator.createReject(
                                localization.getTranslation("timedOut")
                            ),
                            components: [],
                        });

                        if (!interaction.ephemeral) {
                            setTimeout(() => {
                                interaction.deleteReply();
                            }, 5 * 1000);
                        }
                    }

                    resolve(pressed?.customId === "confirmationYes");
                }
            )
        );
    }

    /**
     * Creates a miss analyzer button.
     *
     * @param interaction The interaction that triggered the button.
     * @param options Options of the message.
     * @param beatmap The beatmap shown in the miss analyzer.
     * @param replayData The replay data.
     * @param mods The mods in the replay. If replay data is from version 3 or later, defaults to the
     * mods in the replay data. Otherwise, it defaults to No Mod.
     * @returns The message resulted from the interaction's reply.
     */
    static createRecentScoreButton(
        interaction: RepliableInteraction,
        options: InteractionReplyOptions,
        beatmap: Beatmap,
        replayData: ReplayData,
        mods = replayData.isReplayV3() ? replayData.convertedMods : new ModMap()
    ): Promise<Message> {
        const missAnalyzerButtonId = "analyzeMissesFromRecent";
        const missAnalyzerButton = new ButtonBuilder()
            .setDisabled(replayData.accuracy.nmiss === 0)
            .setCustomId(missAnalyzerButtonId)
            .setLabel("Analyze First 10 Misses")
            .setStyle(ButtonStyle.Primary)
            .setEmoji(Symbols.magnifyingGlassTiltedRight);

        const timingDistributionButtonId = "timingDistribution";
        const timingDistributionButton = new ButtonBuilder()
            .setCustomId(timingDistributionButtonId)
            .setLabel("View Timing Distribution")
            .setStyle(ButtonStyle.Primary)
            .setEmoji(Symbols.timer);

        CacheManager.exemptedButtonCustomIds.add(missAnalyzerButtonId);
        CacheManager.exemptedButtonCustomIds.add(timingDistributionButtonId);

        return this.createLimitedTimeButtons(
            interaction,
            options,
            [missAnalyzerButton, timingDistributionButton],
            [interaction.user.id],
            60,
            async (c, i) => {
                await i.deferReply({
                    ephemeral: interaction.ephemeral ?? false,
                });

                switch (i.customId) {
                    case missAnalyzerButtonId: {
                        const missAnalyzer = new MissAnalyzer(
                            beatmap,
                            replayData,
                            mods
                        );
                        const missInformations = missAnalyzer.analyze();

                        const options: InteractionReplyOptions = {
                            files: [
                                new AttachmentBuilder(
                                    missInformations[0].draw().toBuffer(),
                                    { name: "miss-1.png" }
                                ),
                            ],
                        };

                        if (missInformations.length === 1) {
                            await InteractionHelper.update(i, options);
                            return;
                        }

                        const buttons: ButtonBuilder[] = [];

                        for (let i = 0; i < missInformations.length; ++i) {
                            const id = missAnalyzerButtonId + (i + 1);

                            CacheManager.exemptedButtonCustomIds.add(id);

                            buttons.push(
                                new ButtonBuilder()
                                    .setCustomId(id)
                                    .setStyle(
                                        i === 0
                                            ? ButtonStyle.Success
                                            : ButtonStyle.Primary
                                    )
                                    .setLabel((i + 1).toString())
                                    // Disable the first button as the first miss will be loaded initially.
                                    .setDisabled(i === 0)
                            );
                        }

                        this.createLimitedTimeButtons(
                            i,
                            options,
                            buttons,
                            [interaction.user.id],
                            90,
                            async (_, i) => {
                                await i.deferUpdate();

                                const pressedIndex = parseInt(
                                    i.customId.replace(missAnalyzerButtonId, "")
                                );
                                const attachment = new AttachmentBuilder(
                                    missInformations[pressedIndex - 1]
                                        .draw()
                                        .toBuffer(),
                                    { name: `miss-${pressedIndex}.png` }
                                );

                                for (let i = 0; i < buttons.length; ++i) {
                                    buttons[i]
                                        .setDisabled(i === pressedIndex - 1)
                                        .setStyle(
                                            missInformations[i].isGenerated
                                                ? ButtonStyle.Secondary
                                                : i === pressedIndex - 1
                                                  ? ButtonStyle.Success
                                                  : ButtonStyle.Primary
                                        );
                                }

                                await i.editReply({
                                    ...options,
                                    flags: undefined,
                                    files: [attachment],
                                });
                            },
                            async (c) => {
                                if (c.componentIsDeleted) {
                                    return;
                                }

                                try {
                                    await InteractionHelper.update(i, {
                                        ...options,
                                        components: [],
                                    });
                                    // eslint-disable-next-line no-empty
                                } catch {}
                            }
                        );

                        // Disable the button
                        missAnalyzerButton.setDisabled(true);
                        break;
                    }

                    case timingDistributionButtonId: {
                        const timingDistributionChart =
                            new TimingDistributionChart(
                                beatmap,
                                mods,
                                replayData.hitObjectData
                            );

                        const chart = timingDistributionChart.generate();

                        const attachment = new AttachmentBuilder(chart, {
                            name: "timingDistribution.png",
                        });

                        await i.editReply({ files: [attachment] });

                        // Disable the button
                        timingDistributionButton.setDisabled(true);
                        break;
                    }
                }

                try {
                    interaction.isMessageComponent()
                        ? await InteractionHelper.update(interaction, options)
                        : await InteractionHelper.reply(interaction, options);
                    // eslint-disable-next-line no-empty
                } catch {}

                if (
                    missAnalyzerButton.data.disabled &&
                    timingDistributionButton.data.disabled
                ) {
                    c.stop();
                }
            },
            async (c) => {
                // Remove the row
                const index = (<ActionRowBuilder<ButtonBuilder>[]>(
                    options.components
                )).findIndex((v) => {
                    if (v.components.length !== 2) {
                        return;
                    }

                    return (
                        (<APIButtonComponentWithCustomId>v.components[0].data)
                            .custom_id ===
                            (<APIButtonComponentWithCustomId>(
                                missAnalyzerButton.data
                            )).custom_id &&
                        (<APIButtonComponentWithCustomId>v.components[1].data)
                            .custom_id ===
                            (<APIButtonComponentWithCustomId>(
                                timingDistributionButton.data
                            )).custom_id
                    );
                });

                if (index !== -1) {
                    const newComponents = options.components?.slice() ?? [];
                    newComponents.splice(index, 1);

                    options.components = newComponents;
                }

                if (!c.componentIsDeleted) {
                    try {
                        interaction.isMessageComponent()
                            ? await InteractionHelper.update(
                                  interaction,
                                  options
                              )
                            : await InteractionHelper.reply(
                                  interaction,
                                  options
                              );
                        // eslint-disable-next-line no-empty
                    } catch {}
                }
            }
        );
    }

    /**
     * Creates a button collector that lasts for the specified duration.
     *
     * After the duration ends, it is recommended to remove or disable necessary components
     * via {@link onButtonCollectorEnd}.
     *
     * @param interaction The interaction that triggered the button collector.
     * @param options Options for the message.
     * @param buttons The buttons to display.
     * @param users The users who can interact with the buttons.
     * @param duration The duration the collector will remain active, in seconds.
     * @param onButtonPressed The function that will be run when a button is pressed.
     * @param onButtonCollectorEnd The function that will be run when the collector ends.
     * This function should remove or disable necessary components.
     * @returns The message resulted from the interaction's reply.
     */
    static async createLimitedTimeButtons(
        interaction: RepliableInteraction,
        options: InteractionReplyOptions,
        buttons: ButtonBuilder[],
        users: Snowflake[],
        duration: number,
        onButtonPressed: OnButtonPressed,
        onButtonCollectorEnd: OnButtonCollectorEnd
    ): Promise<Message> {
        const components: ActionRowBuilder<ButtonBuilder>[] = [];

        for (let i = 0; i < buttons.length; ++i) {
            if (i % 5 === 0) {
                components.push(new ActionRowBuilder());
            }

            components[components.length - 1].addComponents(buttons[i]);
        }

        options.components ??= [];
        options.components = options.components.slice().concat(components);

        const message = interaction.isMessageComponent()
            ? await InteractionHelper.update(interaction, options)
            : await InteractionHelper.reply(interaction, options);

        if (buttons.length === 0) {
            return message;
        }

        const collectorOptions = this.createButtonCollector(
            message,
            duration,
            (i) =>
                buttons.some(
                    (b) =>
                        (<APIButtonComponentWithCustomId>b.data).custom_id ===
                        i.customId
                ) && users.includes(i.user.id),
            (m) => {
                for (const component of components) {
                    let isFulfilled = false;

                    for (const row of m.components) {
                        if (
                            component.components.length !==
                            row.components.length
                        ) {
                            continue;
                        }

                        if (
                            row.components.every(
                                (c, i) =>
                                    c instanceof ButtonComponent &&
                                    c.customId ===
                                        (<APIButtonComponentWithCustomId>(
                                            buttons[i].data
                                        )).custom_id
                            )
                        ) {
                            isFulfilled = true;
                            break;
                        }
                    }

                    if (!isFulfilled) {
                        return false;
                    }
                }

                return true;
            }
        );

        const { collector } = collectorOptions;

        collector.on("collect", (i) => onButtonPressed(collector, i, options));
        collector.once("end", () =>
            onButtonCollectorEnd(collectorOptions, options)
        );

        return message;
    }

    /**
     * Creates a button-based paging.
     *
     * If there is only 1 page to view, no buttons will be shown.
     *
     * @param interaction The interaction that triggered the button-based paging.
     * @param options Options to be used when sending the button-based paging message.
     * @param users The IDs of users who can interact with the buttons.
     * @param startPage The page to start the paging from.
     * @param duration The duration the button-based paging will be active, in seconds.
     * @param onPageChange The function to be executed when the page is changed.
     * @param maxPage The maximum page.
     * @param onPageChangeArgs Arguments for `onPageChange` function.
     * @returns The collector that collects the button-pressing event.
     */
    private static async createButtonBasedPaging(
        interaction: RepliableInteraction,
        options: InteractionReplyOptions,
        users: Snowflake[],
        startPage: number,
        duration: number,
        onPageChange: OnButtonPageChange,
        maxPage: number,
        ...onPageChangeArgs: unknown[]
    ): Promise<Message> {
        let currentPage = Math.min(startPage, maxPage);
        const buttons = this.createPagingButtons(currentPage, maxPage);

        await onPageChange(options, startPage, ...onPageChangeArgs);

        return this.createLimitedTimeButtons(
            interaction,
            options,
            maxPage > 1 ? buttons : [],
            users,
            duration,
            async (_, i) => {
                await i.deferUpdate();

                switch (i.customId) {
                    case "pagingBackward":
                        currentPage = Math.max(1, currentPage - 10);
                        break;
                    case "pagingBack":
                        if (currentPage === 1) {
                            currentPage = maxPage;
                        } else {
                            --currentPage;
                        }
                        break;
                    case "pagingNext":
                        if (currentPage === maxPage) {
                            currentPage = 1;
                        } else {
                            ++currentPage;
                        }
                        break;
                    case "pagingForward":
                        currentPage = Math.min(currentPage + 10, maxPage);
                        break;
                    default:
                        return;
                }

                const row = <ActionRowBuilder>options.components?.find((c) => {
                    c = <APIActionRowComponent<APIMessageActionRowComponent>>c;

                    return (
                        c.components.length === buttons.length &&
                        c.components.every(
                            (b, i) =>
                                b instanceof ButtonBuilder &&
                                (<APIButtonComponentWithCustomId>b.data)
                                    .custom_id ===
                                    (<APIButtonComponentWithCustomId>(
                                        buttons[i].data
                                    )).custom_id
                        )
                    );
                });

                row?.setComponents(
                    this.createPagingButtons(currentPage, maxPage)
                );

                if (options.embeds) {
                    for (let i = 0; i < options.embeds.length; ++i) {
                        const embed = options.embeds[i];

                        let data: APIEmbed;

                        if (isJSONEncodable(embed)) {
                            data = embed.toJSON();
                        } else {
                            data = embed;
                        }

                        if (data.fields) {
                            data.fields.length = 0;
                        }
                    }
                }

                await onPageChange(options, currentPage, ...onPageChangeArgs);
                await i.editReply({ ...options, flags: undefined });
            },
            async (c) => {
                const index = (<ActionRowBuilder<ButtonBuilder>[]>(
                    options.components
                )).findIndex((v) => {
                    return (
                        v.components.length === buttons.length &&
                        v.components.every(
                            (c, i) =>
                                (<APIButtonComponentWithCustomId>c.data)
                                    .custom_id ===
                                (<APIButtonComponentWithCustomId>(
                                    buttons[i].data
                                )).custom_id
                        )
                    );
                });

                if (index !== -1) {
                    const newComponents = options.components?.slice() ?? [];
                    newComponents.splice(index, 1);

                    options.components = newComponents;
                }

                if (!c.componentIsDeleted) {
                    try {
                        interaction.isMessageComponent()
                            ? await InteractionHelper.update(
                                  interaction,
                                  options
                              )
                            : await InteractionHelper.reply(
                                  interaction,
                                  options
                              );
                        // eslint-disable-next-line no-empty
                    } catch {}
                }
            }
        );
    }

    /**
     * Creates buttons used in paging.
     *
     * ID order: `[pagingBackward, pagingBack, pagingNone, pagingNext, pagingForward]`
     *
     * @param currentPage The current page to be used for button label.
     * @param maxPage The maximum page possible to be used for button label.
     */
    private static createPagingButtons(
        currentPage: number,
        maxPage: number
    ): ButtonBuilder[] {
        CacheManager.exemptedButtonCustomIds.add("pagingBackward");
        CacheManager.exemptedButtonCustomIds.add("pagingBack");
        CacheManager.exemptedButtonCustomIds.add("pagingNone");
        CacheManager.exemptedButtonCustomIds.add("pagingNext");
        CacheManager.exemptedButtonCustomIds.add("pagingForward");

        return [
            new ButtonBuilder()
                .setCustomId("pagingBackward")
                .setEmoji(Symbols.skipBackward)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 1 || maxPage <= 5),
            new ButtonBuilder()
                .setCustomId("pagingBack")
                .setEmoji(Symbols.leftArrow)
                .setStyle(ButtonStyle.Success)
                .setDisabled(
                    maxPage === 1 ||
                        (maxPage === Number.POSITIVE_INFINITY &&
                            currentPage === 1)
                ),
            new ButtonBuilder()
                .setCustomId("pagingNone")
                .setLabel(
                    Number.isFinite(maxPage)
                        ? `${currentPage}/${maxPage}`
                        : currentPage.toString()
                )
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId("pagingNext")
                .setEmoji(Symbols.rightArrow)
                .setStyle(ButtonStyle.Success)
                .setDisabled(maxPage === 1),
            new ButtonBuilder()
                .setCustomId("pagingForward")
                .setEmoji(Symbols.skipForward)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === maxPage || maxPage <= 5),
        ];
    }

    /**
     * Creates buttons used in confirmation.
     *
     * ID order: `[confirmationYes, confirmationNo]`
     */
    private static createConfirmationButtons(): ButtonBuilder[] {
        CacheManager.exemptedButtonCustomIds.add("confirmationYes");
        CacheManager.exemptedButtonCustomIds.add("confirmationNo");

        return [
            new ButtonBuilder()
                .setCustomId("confirmationYes")
                .setEmoji(Symbols.checkmark)
                .setLabel("Yes")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("confirmationNo")
                .setEmoji(Symbols.cross)
                .setLabel("No")
                .setStyle(ButtonStyle.Danger),
        ];
    }

    /**
     * Gets the localization of this creator utility.
     *
     * @param language The language to localize.
     */
    private static getLocalization(
        language: Language
    ): MessageButtonCreatorLocalization {
        return new MessageButtonCreatorLocalization(language);
    }
}
