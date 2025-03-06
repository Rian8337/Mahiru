import { Constants } from "@core/Constants";
import { MainServerVoiceChannels as VoiceChannels } from "@enums/utils/MainServerVoiceChannels";
import { Symbols } from "@enums/utils/Symbols";
import { EventUtil } from "@structures/core/EventUtil";
import { Guild, GuildPremiumTier, Snowflake } from "discord.js";

interface VoiceChannelSetting {
    readonly id: Snowflake;
    readonly name: string;
    readonly bitrate: number;
}

function createVoiceChannelSetting(
    id: VoiceChannels,
    bitrateKbps?: 64 | 96 | 128 | 256 | 384,
    order?: number
): VoiceChannelSetting {
    if (bitrateKbps === undefined) {
        switch (id) {
            case VoiceChannels.main64Kbps:
            case VoiceChannels.fancy64Kbps:
            case VoiceChannels.streaming64Kbps:
            case VoiceChannels.music64Kbps:
            case VoiceChannels.fancyMusic64Kbps:
                bitrateKbps = 64;
                break;

            case VoiceChannels.main128Kbps:
            case VoiceChannels.fancy128Kbps:
            case VoiceChannels.streaming128Kbps:
            case VoiceChannels.music128Kbps:
            case VoiceChannels.fancyMusic128Kbps:
                bitrateKbps = 128;
                break;

            case VoiceChannels.main256Kbps:
            case VoiceChannels.fancy256Kbps:
            case VoiceChannels.streaming256Kbps:
            case VoiceChannels.music256Kbps:
            case VoiceChannels.fancyMusic256Kbps:
                bitrateKbps = 256;
                break;

            case VoiceChannels.main384Kbps:
            case VoiceChannels.fancy384Kbps:
            case VoiceChannels.streaming384Kbps:
            case VoiceChannels.music384Kbps:
            case VoiceChannels.fancyMusic384Kbps:
                bitrateKbps = 384;
                break;
        }
    }

    return {
        id: id,
        get name(): string {
            switch (this.id) {
                case VoiceChannels.main64Kbps:
                case VoiceChannels.main128Kbps:
                case VoiceChannels.main256Kbps:
                case VoiceChannels.main384Kbps:
                    return `${Symbols.speaker} ${bitrateKbps}kbps${order ? ` (#${order})` : ""}`;

                case VoiceChannels.fancy64Kbps:
                case VoiceChannels.fancy128Kbps:
                case VoiceChannels.fancy256Kbps:
                case VoiceChannels.fancy384Kbps:
                    return `${Symbols.speaker} Fancy (${bitrateKbps}kbps)${order ? ` (#${order})` : ""}`;

                case VoiceChannels.streaming64Kbps:
                case VoiceChannels.streaming128Kbps:
                case VoiceChannels.streaming256Kbps:
                case VoiceChannels.streaming384Kbps:
                    return `Streaming (${bitrateKbps}kbps)${order ? ` (#${order})` : ""}`;

                case VoiceChannels.music64Kbps:
                case VoiceChannels.music128Kbps:
                case VoiceChannels.music256Kbps:
                case VoiceChannels.music384Kbps:
                    return `${Symbols.music} Music (${bitrateKbps}kbps)${order ? ` (#${order})` : ""}`;

                case VoiceChannels.fancyMusic64Kbps:
                case VoiceChannels.fancyMusic128Kbps:
                case VoiceChannels.fancyMusic256Kbps:
                case VoiceChannels.fancyMusic384Kbps:
                    return `${Symbols.music} Fancy Music (${bitrateKbps}kbps)${order ? ` (#${order})` : ""}`;

                default:
                    throw new Error("Invalid voice channel");
            }
        },
        bitrate: bitrateKbps * 1000,
    };
}

export const run: EventUtil["run"] = async (
    _,
    oldGuild: Guild,
    newGuild: Guild
) => {
    if (
        newGuild.id !== Constants.mainServer ||
        oldGuild.premiumTier === newGuild.premiumTier
    ) {
        return;
    }

    const voiceChannelSettings: VoiceChannelSetting[] = [];

    switch (newGuild.premiumTier) {
        case GuildPremiumTier.None:
            // Set all voice channels to 64kbps, but set voice channels' names and bitrate beyond 64kbps to 96kbps
            voiceChannelSettings.push(
                createVoiceChannelSetting(VoiceChannels.main64Kbps),
                createVoiceChannelSetting(VoiceChannels.main128Kbps, 96, 1),
                createVoiceChannelSetting(VoiceChannels.main256Kbps, 96, 2),
                createVoiceChannelSetting(VoiceChannels.main384Kbps, 96, 3),
                createVoiceChannelSetting(VoiceChannels.fancy64Kbps),
                createVoiceChannelSetting(VoiceChannels.fancy128Kbps, 96, 1),
                createVoiceChannelSetting(VoiceChannels.fancy256Kbps, 96, 2),
                createVoiceChannelSetting(VoiceChannels.fancy384Kbps, 96, 3),
                createVoiceChannelSetting(VoiceChannels.streaming64Kbps),
                createVoiceChannelSetting(
                    VoiceChannels.streaming128Kbps,
                    96,
                    1
                ),
                createVoiceChannelSetting(
                    VoiceChannels.streaming256Kbps,
                    96,
                    2
                ),
                createVoiceChannelSetting(
                    VoiceChannels.streaming384Kbps,
                    96,
                    3
                ),
                createVoiceChannelSetting(VoiceChannels.music64Kbps),
                createVoiceChannelSetting(VoiceChannels.music128Kbps, 96, 1),
                createVoiceChannelSetting(VoiceChannels.music256Kbps, 96, 2),
                createVoiceChannelSetting(VoiceChannels.music384Kbps, 96, 3),
                createVoiceChannelSetting(VoiceChannels.fancyMusic64Kbps),
                createVoiceChannelSetting(
                    VoiceChannels.fancyMusic128Kbps,
                    96,
                    1
                ),
                createVoiceChannelSetting(
                    VoiceChannels.fancyMusic256Kbps,
                    96,
                    2
                ),
                createVoiceChannelSetting(
                    VoiceChannels.fancyMusic384Kbps,
                    96,
                    3
                )
            );
            break;

        case GuildPremiumTier.Tier1:
            // Set all 64kbps voice channels' names, but set voice channels' names and bitrate beyond 128kbps to 128kbps
            voiceChannelSettings.push(
                createVoiceChannelSetting(VoiceChannels.main64Kbps),
                createVoiceChannelSetting(
                    VoiceChannels.main128Kbps,
                    undefined,
                    1
                ),
                createVoiceChannelSetting(VoiceChannels.main256Kbps, 128, 2),
                createVoiceChannelSetting(VoiceChannels.main384Kbps, 128, 3),
                createVoiceChannelSetting(VoiceChannels.fancy64Kbps),
                createVoiceChannelSetting(
                    VoiceChannels.fancy128Kbps,
                    undefined,
                    1
                ),
                createVoiceChannelSetting(VoiceChannels.fancy256Kbps, 128, 2),
                createVoiceChannelSetting(VoiceChannels.fancy384Kbps, 128, 3),
                createVoiceChannelSetting(VoiceChannels.streaming64Kbps),
                createVoiceChannelSetting(
                    VoiceChannels.streaming128Kbps,
                    undefined,
                    1
                ),
                createVoiceChannelSetting(
                    VoiceChannels.streaming256Kbps,
                    128,
                    2
                ),
                createVoiceChannelSetting(
                    VoiceChannels.streaming384Kbps,
                    128,
                    3
                ),
                createVoiceChannelSetting(VoiceChannels.music64Kbps),
                createVoiceChannelSetting(
                    VoiceChannels.music128Kbps,
                    undefined,
                    1
                ),
                createVoiceChannelSetting(VoiceChannels.music256Kbps, 128, 2),
                createVoiceChannelSetting(VoiceChannels.music384Kbps, 128, 3),
                createVoiceChannelSetting(VoiceChannels.fancyMusic64Kbps),
                createVoiceChannelSetting(
                    VoiceChannels.fancyMusic128Kbps,
                    undefined,
                    1
                ),
                createVoiceChannelSetting(
                    VoiceChannels.fancyMusic256Kbps,
                    128,
                    2
                ),
                createVoiceChannelSetting(
                    VoiceChannels.fancyMusic384Kbps,
                    128,
                    3
                )
            );
            break;

        case GuildPremiumTier.Tier2:
            // Set all 64kbps and 128kbps voice channels' names and bitrates, but set voice channels' names and bitrate beyond 256kbps to 256kbps
            voiceChannelSettings.push(
                createVoiceChannelSetting(VoiceChannels.main64Kbps),
                createVoiceChannelSetting(VoiceChannels.main128Kbps),
                createVoiceChannelSetting(
                    VoiceChannels.main256Kbps,
                    undefined,
                    1
                ),
                createVoiceChannelSetting(VoiceChannels.main384Kbps, 256, 2),
                createVoiceChannelSetting(VoiceChannels.fancy64Kbps),
                createVoiceChannelSetting(VoiceChannels.fancy128Kbps),
                createVoiceChannelSetting(
                    VoiceChannels.fancy256Kbps,
                    undefined,
                    1
                ),
                createVoiceChannelSetting(VoiceChannels.fancy384Kbps, 256, 2),
                createVoiceChannelSetting(VoiceChannels.streaming64Kbps),
                createVoiceChannelSetting(VoiceChannels.streaming128Kbps),
                createVoiceChannelSetting(
                    VoiceChannels.streaming256Kbps,
                    undefined,
                    1
                ),
                createVoiceChannelSetting(
                    VoiceChannels.streaming384Kbps,
                    256,
                    2
                ),
                createVoiceChannelSetting(VoiceChannels.music64Kbps),
                createVoiceChannelSetting(VoiceChannels.music128Kbps),
                createVoiceChannelSetting(
                    VoiceChannels.music256Kbps,
                    undefined,
                    1
                ),
                createVoiceChannelSetting(VoiceChannels.music384Kbps, 256, 2),
                createVoiceChannelSetting(VoiceChannels.fancyMusic64Kbps),
                createVoiceChannelSetting(VoiceChannels.fancyMusic128Kbps),
                createVoiceChannelSetting(
                    VoiceChannels.fancyMusic256Kbps,
                    undefined,
                    1
                ),
                createVoiceChannelSetting(
                    VoiceChannels.fancyMusic384Kbps,
                    256,
                    2
                )
            );
            break;

        case GuildPremiumTier.Tier3:
            // Set all voice channels' names and bitrates to their default values
            voiceChannelSettings.push(
                createVoiceChannelSetting(VoiceChannels.main64Kbps),
                createVoiceChannelSetting(VoiceChannels.main128Kbps),
                createVoiceChannelSetting(VoiceChannels.main256Kbps),
                createVoiceChannelSetting(VoiceChannels.main384Kbps),
                createVoiceChannelSetting(VoiceChannels.fancy64Kbps),
                createVoiceChannelSetting(VoiceChannels.fancy128Kbps),
                createVoiceChannelSetting(VoiceChannels.fancy256Kbps),
                createVoiceChannelSetting(VoiceChannels.fancy384Kbps),
                createVoiceChannelSetting(VoiceChannels.streaming64Kbps),
                createVoiceChannelSetting(VoiceChannels.streaming128Kbps),
                createVoiceChannelSetting(VoiceChannels.streaming256Kbps),
                createVoiceChannelSetting(VoiceChannels.streaming384Kbps),
                createVoiceChannelSetting(VoiceChannels.music64Kbps),
                createVoiceChannelSetting(VoiceChannels.music128Kbps),
                createVoiceChannelSetting(VoiceChannels.music256Kbps),
                createVoiceChannelSetting(VoiceChannels.music384Kbps),
                createVoiceChannelSetting(VoiceChannels.fancyMusic64Kbps),
                createVoiceChannelSetting(VoiceChannels.fancyMusic128Kbps),
                createVoiceChannelSetting(VoiceChannels.fancyMusic256Kbps),
                createVoiceChannelSetting(VoiceChannels.fancyMusic384Kbps)
            );
            break;
    }

    const reason = "Server boost level change";

    for (const voiceChannelSetting of voiceChannelSettings) {
        const voiceChannel = await newGuild.channels.fetch(
            voiceChannelSetting.id
        );

        if (!voiceChannel?.isVoiceBased()) {
            continue;
        }

        await voiceChannel.setName(voiceChannelSetting.name, reason);
        await voiceChannel.setBitrate(voiceChannelSetting.bitrate, reason);
    }
};

export const config: EventUtil["config"] = {
    description:
        "Responsible for updating voice channel bitrates and names whenever server boost level changes.",
    togglePermissions: ["BotOwner"],
    toggleScope: ["GUILD"],
};
