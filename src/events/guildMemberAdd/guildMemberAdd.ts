import { Event } from "@structures/core/Event";
import { EventHelper } from "@utils/helpers/EventHelper";
import { GuildMember } from "discord.js";

export const run: Event["run"] = async (client, member: GuildMember) => {
    EventHelper.runUtilities(
        client,
        __dirname,
        member.guild,
        undefined,
        member
    );
};
