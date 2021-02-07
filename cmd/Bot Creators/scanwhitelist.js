const Discord = require('discord.js');
const { Db } = require('mongodb');
const osudroid = require('osu-droid');

function sleep(seconds) {
    return new Promise(resolve => {
        setTimeout(resolve, 1000 * seconds);
    });
}

/**
 * @param {Discord.Client} client 
 * @param {Discord.Message} message 
 * @param {string[]} args 
 * @param {Db} maindb 
 */
module.exports.run = async (client, message, args, maindb) => {
    if (!message.isOwner) {
        return message.channel.send("❎ **| I'm sorry, you don't have the permission to use this command.**");
    }

    const whitelistDb = maindb.collection("mapwhitelist");

    let skipMultiplier = 0;
    let outdatedCount = 0;
    let notAvailableCount = 0;
    let deletedCount = 0;
    let i = 0;
    while (true) {
        const entries = await whitelistDb.find({}, {projection: {_id: 0, mapid: 1, hashid: 1}}).sort({mapid: -1}).skip(skipMultiplier * 100).limit(100).toArray();
        ++skipMultiplier;

        if (entries.length === 0) {
            break;
        }

        for await (const entry of entries) {
            const mapinfo = await osudroid.MapInfo.getInformation({beatmapID: entry.mapid});
            await sleep(0.05);
            console.log(++i);
            if (mapinfo.error) {
                console.log("API fetch error");
                continue;
            }
            if (!mapinfo.title) {
                console.log("Whitelist entry not available");
                ++notAvailableCount;
                await whitelistDb.deleteOne({mapid: entry.mapid});
                continue;
            }
            if (mapinfo.approved !== osudroid.rankedStatus.GRAVEYARD) {
                console.log("Map not graveyarded");
                ++deletedCount;
                await whitelistDb.deleteOne({mapid: entry.mapid});
                continue;
            }
            if (entry.hashid !== mapinfo.hash) {
                console.log("Hash outdated");
                ++outdatedCount;
                await whitelistDb.updateOne({mapid: entry.mapid}, {$set: {hashid: mapinfo.hash}});
            }
        }
    }

    message.channel.send(`✅ **| ${message.author}, scan complete! A total of ${outdatedCount} entries were outdated, ${notAvailableCount} entries were not available, and ${deletedCount} entries were deleted.**`);
};

module.exports.config = {
    name: "scanwhitelist",
    description: "Scans whitelist entries and updates the entry if it's outdated.",
    usage: "scanwhitelist",
    detail: "None",
    permission: "Bot Creators"
};