import { Event } from "@structures/core/Event";
import { EventHelper } from "@utils/helpers/EventHelper";
import { GuildChannel } from "discord.js";

export const run: Event["run"] = async (client, channel: GuildChannel) => {
    EventHelper.runUtilities(
        client,
        __dirname,
        channel.guild,
        channel,
        channel
    );
};
