const Discord = require('discord.js');
const osudroid = require('../../modules/osu!droid');

function retrieveWhitelist(whitelist_entries, i, cb) {
    if (!whitelist_entries[i]) cb(null, true);
    cb(whitelist_entries[i])
}

module.exports.run = (client, message, args, maindb) => {
    if (message.channel instanceof Discord.DMChannel) return message.channel.send("❎ **| I'm sorry, this command is not available in DMs.**");
    if (message.author.id != '132783516176875520' && message.author.id != '386742340968120321') return message.channel.send("❎ **| I'm sorry, you don't have the permission to use this. Please ask an Owner!**");
    let whitelistdb = maindb.collection("mapwhitelist");

    whitelistdb.find({}).toArray((err, whitelist_list) => {
        if (err) {
            console.log(err);
            return message.channel.send("Error: Empty database response. Please try again!")
        }
        let i = 0;
        retrieveWhitelist(whitelist_list, i, function whitelistCheck(whitelist, stopSign = false) {
            if (stopSign) return message.channel.send(`✅ **| ${message.author}, dpp entry scan complete!**`);
            console.log(i);
            let beatmap_id = whitelist.mapid;
            let hash = whitelist.hashid;
            new osudroid.MapInfo().get({beatmap_id: beatmap_id, file: false}, mapinfo => {
                if (hash && mapinfo.hash === hash) {
                    ++i;
                    return retrieveWhitelist(whitelist_list, i, whitelistCheck)
                }
                console.log("Whitelist entry outdated");
                let updateVal = {
                    $set: {
                        hash: mapinfo.hash
                    }
                };
                whitelistdb.updateOne({mapid: beatmap_id}, updateVal, err => {
                    if (err) {
                        console.log(err);
                        return retrieveWhitelist(whitelist_list, i, whitelistCheck)
                    }
                    ++i;
                    retrieveWhitelist(whitelist_list, i, whitelistCheck)
                })
            })
        })
    })
};

module.exports.config = {
    name: "scanwhitelist",
    description: "Scans whitelist entries and updates the entry if it's outdated.",
    usage: "scanwhitelist",
    detail: "None",
    permission: "Specific person (<@132783516176875520> and <@386742340968120321>)"
};
