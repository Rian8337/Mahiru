const { Message, TextChannel } = require('discord.js');
const { Db } = require('mongodb');

/**
 * @param {Message} message 
 * @param {Db} alicedb 
 */
module.exports.run = async (message, alicedb) => {
    if (!(message.channel instanceof TextChannel)) {
        return;
    }

    const emojis = message.content.match(/<a:.+?:\d+>|<:.+?:\d+>/g) ?? [];
    const emojiDb = alicedb.collection("emojistatistics");
    const guildEntry = await emojiDb.findOne({guildID: message.guild.id});
    const guildEmojiStats = guildEntry?.emojiStats ?? [];

    for (const emoji of emojis) {
        const actualEmoji = message.guild.emojis.resolve(emoji);
        
        if (!actualEmoji) {
            continue;
        }

        const emojiIndex = guildEmojiStats.findIndex(v => v.id === actualEmoji.id);
        if (emojiIndex !== -1) {
            ++guildEmojiStats[emojiIndex].count;
        } else {
            guildEmojiStats.push({
                id: actualEmoji.id,
                count: 1
            });
        }
    }

    await emojiDb.updateOne({guildID: message.guild.id}, {$set: {emojiStats: guildEmojiStats}}, {upsert: true});
};

module.exports.config = {
    name: "emojiStatistician"
};