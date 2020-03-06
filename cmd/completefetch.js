const Discord = require('discord.js');

function count_all_message(channel, last_msg, date, daily_counter, cb) {
    channel.messages.fetch({limit: 100, before: last_msg})
        .then(messages => {
            if (!messages.size) return cb(0, null, false, true);
            let bot_messages_amount = messages.filter(message => message.author.bot).size * 2;
            daily_counter -= bot_messages_amount;
            for (const [snowflake, message] of messages.entries()) {
                if (message.createdTimestamp < date) {
                    daily_counter = Math.max(0, daily_counter);
                    console.log(new Date(date).toUTCString() + ": " + daily_counter);
                    return cb(daily_counter, snowflake, true)
                }
                ++daily_counter
            }
            cb(daily_counter, messages.last().id)
        }).catch(console.error)
}

module.exports.run = (client, message, args, maindb, alicedb) => {
    if (message.channel instanceof Discord.DMChannel) return;
    if (!['132783516176875520', '386742340968120321'].includes(message.author.id)) return message.channel.send("❎ **| I'm sorry, you don't have permission to use this.**");
    let current_date = new Date();
    current_date.setUTCHours(0, 0, 0, 0);
    current_date = current_date.getTime();
    let daily_counter = 0;
    let channeldb = alicedb.collection("channeldata");
    let total = 0;
    message.channel.messages.fetch({limit: 1}).then(last_message => {
        let message_id = last_message.first().id;
        count_all_message(message.channel, message_id, current_date, daily_counter, function testResult(count, last_id, iterateDate = false, stopSign = false) {
            if (stopSign) return message.channel.send(`✅ **| ${message.author}, successfully logged ${total.toLocaleString()} messages!**`);
            if (iterateDate) {
                daily_counter += count;
                total += count;
                let query = {timestamp: current_date};
                channeldb.findOne(query, (err, res) => {
                    if (err) return console.log(err);
                    if (res) {
                        let channels = res.channels;
                        let dup = false;
                        for (let i = 0; i < channels.length; i++) {
                            if (channels[i][0] != message.channel.id) continue;
                            channels[i][1] = daily_counter;
                            dup = true;
                            break
                        }
                        if (!dup) channels.push([message.channel.id, daily_counter]);
                        let updateVal = {
                            $set: {
                                channels: channels
                            }
                        };
                        channeldb.updateOne(query, updateVal, err => {
                            if (err) return console.log(err);
                            current_date -= 24 * 3600000;
                            daily_counter = 0;
                            count_all_message(message.channel, last_id, current_date, daily_counter, testResult)
                        })
                    } else {
                        let insertVal = {
                            timestamp: current_date,
                            channels: [[message.channel.id, daily_counter]]
                        };
                        channeldb.insertOne(insertVal, err => {
                            if (err) return console.log(err);
                            current_date -= 24 * 3600000;
                            daily_counter = 0;
                            count_all_message(message.channel, last_id, current_date, daily_counter, testResult)
                        })
                    }
                })
            }
            else count_all_message(message.channel, last_id, current_date, count, testResult)
        })
    })
};

module.exports.config = {
    name: "completefetch",
    description: "Fetches all messages in a channel.",
    usage: "completefetch",
    detail: "None",
    permission: "Specific person (<@132783516176875520> and <@386742340968120321>)"
};
