import {
    ApplicationCommandOptionType,
    GuildMember,
    EmbedBuilder,
    bold,
    hyperlink,
} from "discord.js";
import { CommandCategory } from "@enums/core/CommandCategory";
import { Symbols } from "@enums/utils/Symbols";
import { SlashCommand } from "structures/core/SlashCommand";
import { SayobotAPIResponse } from "@structures/sayobot/SayobotAPIResponse";
import { SayobotBeatmap } from "@structures/sayobot/SayobotBeatmap";
import { OnButtonPageChange } from "@structures/utils/OnButtonPageChange";
import { EmbedCreator } from "@utils/creators/EmbedCreator";
import { MessageButtonCreator } from "@utils/creators/MessageButtonCreator";
import { MessageCreator } from "@utils/creators/MessageCreator";
import { DateTimeFormatHelper } from "@utils/helpers/DateTimeFormatHelper";
import { StringHelper } from "@utils/helpers/StringHelper";
import { RESTManager } from "@utils/managers/RESTManager";
import { RankedStatus, RequestResponse } from "@rian8337/osu-base";
import { MapsearchLocalization } from "@localization/interactions/commands/osu! and osu!droid/mapsearch/MapsearchLocalization";
import { CommandHelper } from "@utils/helpers/CommandHelper";
import { LocaleHelper } from "@utils/helpers/LocaleHelper";
import { InteractionHelper } from "@utils/helpers/InteractionHelper";

export const run: SlashCommand["run"] = async (_, interaction) => {
    const localization: MapsearchLocalization = new MapsearchLocalization(
        CommandHelper.getLocale(interaction),
    );

    // Documentation: https://docs.qq.com/doc/DS0lDWndpc0FlVU5B.
    // Defaults to std, type "search for", limit at 100 beatmaps.
    let url: string = "https://api.sayobot.cn/beatmaplist?T=4&L=100&M=1";

    if (interaction.options.getString("keyword")) {
        url += `&K=${encodeURIComponent(
            interaction.options.getString("keyword", true),
        )}`;
    }

    if (
        interaction.options.data.filter((v) => v.name !== "keyword").length > 0
    ) {
        const getInputRange = (mainstr: string): string => {
            return `${interaction.options.getNumber(`min${mainstr}`) ?? 0}~${
                interaction.options.getNumber(`max${mainstr}`) ?? ""
            }`;
        };

        url +=
            '&R="' +
            `star:${getInputRange("stars")},` +
            `AR:${getInputRange("ar")},` +
            `OD:${getInputRange("od")},` +
            `HP:${getInputRange("hp")},` +
            `length:${DateTimeFormatHelper.DHMStoSeconds(
                interaction.options.getString("minduration") ?? "0",
            )}~${
                DateTimeFormatHelper.DHMStoSeconds(
                    interaction.options.getString("minduration") ?? "",
                ) || ""
            },` +
            `BPM:${getInputRange("bpm")}` +
            'end"';
    }

    await InteractionHelper.deferReply(interaction);

    const result: RequestResponse = await RESTManager.request(url);

    if (result.statusCode !== 200) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("requestFailed"),
            ),
        });
    }

    const data: SayobotAPIResponse = JSON.parse(result.data.toString("utf-8"));

    const beatmaps: SayobotBeatmap[] = data.data ?? [];

    if (beatmaps.length === 0) {
        return InteractionHelper.reply(interaction, {
            content: MessageCreator.createReject(
                localization.getTranslation("noBeatmapsFound"),
            ),
        });
    }

    const embed: EmbedBuilder = EmbedCreator.createNormalEmbed({
        author: interaction.user,
        color: (<GuildMember | null>interaction.member)?.displayColor,
        footerText: localization.getTranslation("serviceProvider"),
    });

    const BCP47: string = LocaleHelper.convertToBCP47(localization.language);

    embed.setDescription(
        `${bold(
            localization.getTranslation("beatmapsFound"),
        )}: ${data.results.toLocaleString(BCP47)}`,
    );

    const onPageChange: OnButtonPageChange = async (_, page) => {
        embed.spliceFields(0, embed.data.fields!.length);

        for (
            let i = 5 * (page - 1);
            i < Math.min(beatmaps.length, 5 + 5 * (page - 1));
            ++i
        ) {
            const d: SayobotBeatmap = beatmaps[i];

            let status: string = "Unknown";

            for (const stat in RankedStatus) {
                if (parseInt(stat) === d.approved) {
                    status =
                        RankedStatus[stat] !== "WIP"
                            ? StringHelper.capitalizeString(
                                  RankedStatus[stat],
                                  true,
                              )
                            : RankedStatus[stat];
                    break;
                }
            }

            embed.addFields({
                name: `${i + 1}. ${d.artist} - ${d.title} (${d.creator})`,
                value: `${bold(
                    localization.getTranslation("download"),
                )}: ${hyperlink(
                    "osu!",
                    `https://osu.ppy.sh/d/${d.sid}`,
                )} ${hyperlink(
                    "(no video)",
                    `https://osu.ppy.sh/d/${d.sid}n`,
                )} - ${hyperlink(
                    "Chimu",
                    `https://chimu.moe/en/d/${d.sid}`,
                )} - ${hyperlink(
                    "Sayobot",
                    `https://txy1.sayobot.cn/beatmaps/download/full/${d.sid}`,
                )} ${hyperlink(
                    "(no video)",
                    `https://txy1.sayobot.cn/beatmaps/download/novideo/${d.sid}`,
                )} - ${hyperlink(
                    "Beatconnect",
                    `https://beatconnect.io/b/${d.sid}/`,
                )} - ${hyperlink("Nerina", `https://nerina.pw/d/${d.sid}`)}${
                    d.approved >= RankedStatus.Ranked &&
                    d.approved !== RankedStatus.Qualified
                        ? ` - ${hyperlink(
                              "Ripple",
                              `https://storage.ripple.moe/d/${d.sid}`,
                          )}`
                        : ""
                }\n${bold(
                    localization.getTranslation("lastUpdate"),
                )}: ${DateTimeFormatHelper.dateToLocaleString(
                    new Date(d.lastupdate * 1000),
                    localization.language,
                )} | ${bold(status)}\n${Symbols.heart} ${bold(
                    d.favourite_count.toLocaleString(BCP47),
                )} - ${Symbols.playButton} ${bold(
                    d.play_count.toLocaleString(BCP47),
                )}`,
            });
        }
    };

    MessageButtonCreator.createLimitedButtonBasedPaging(
        interaction,
        { embeds: [embed] },
        [interaction.user.id],
        1,
        Math.ceil(beatmaps.length / 5),
        120,
        onPageChange,
    );
};

export const category: SlashCommand["category"] = CommandCategory.osu;

export const config: SlashCommand["config"] = {
    name: "mapsearch",
    description: "Searches for beatmaps. Service provided by Sayobot.",
    options: [
        {
            name: "keyword",
            type: ApplicationCommandOptionType.String,
            description: "The keyword to search for.",
        },
        {
            name: "minstars",
            type: ApplicationCommandOptionType.Number,
            description: "The minimum star rating to search for.",
        },
        {
            name: "maxstars",
            type: ApplicationCommandOptionType.Number,
            description: "The minimum star rating to search for.",
        },
        {
            name: "mincs",
            type: ApplicationCommandOptionType.Number,
            description: "The minimum CS (Circle Size) to search for.",
        },
        {
            name: "maxcs",
            type: ApplicationCommandOptionType.Number,
            description: "The minimum CS (Circle Size) to search for.",
        },
        {
            name: "minar",
            type: ApplicationCommandOptionType.Number,
            description: "The minimum AR (Approach Rate) to search for.",
        },
        {
            name: "maxar",
            type: ApplicationCommandOptionType.Number,
            description: "The minimum AR (Approach Rate) to search for.",
        },
        {
            name: "minod",
            type: ApplicationCommandOptionType.Number,
            description: "The minimum OD (Overall Difficulty) to search for.",
        },
        {
            name: "maxod",
            type: ApplicationCommandOptionType.Number,
            description: "The minimum OD (Overall Difficulty) to search for.",
        },
        {
            name: "minhp",
            type: ApplicationCommandOptionType.Number,
            description: "The minimum HP (health drain rate) to search for.",
        },
        {
            name: "maxhp",
            type: ApplicationCommandOptionType.Number,
            description: "The minimum HP (health drain rate) to search for.",
        },
        {
            name: "minduration",
            type: ApplicationCommandOptionType.String,
            description:
                "The minimum duration to search for, in time format (e.g. 6:01:24:33 or 2d14h55m34s).",
        },
        {
            name: "maxduration",
            type: ApplicationCommandOptionType.String,
            description:
                "The maximum duration to search for, in time format (e.g. 6:01:24:33 or 2d14h55m34s).",
        },
        {
            name: "minbpm",
            type: ApplicationCommandOptionType.Number,
            description: "The minimum BPM to search for.",
        },
        {
            name: "maxbpm",
            type: ApplicationCommandOptionType.Number,
            description: "The maximum BPM to search for.",
        },
    ],
    example: [],
    cooldown: 15,
};
