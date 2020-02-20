const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const fs = require("fs");
const http = require("http");
const mongodb = require('mongodb');
require("dotenv").config();
const messageLog = new Discord.WebhookClient(process.env.WEBHOOK_ID, process.env.WEBHOOK_TOKEN);
const elainadbkey = process.env.ELAINA_DB_KEY;
const alicedbkey = process.env.ALICE_DB_KEY;
const droidapikey = process.env.DROID_API_KEY;
const require_api = config.require_api;
let apidown = false;

// Command loading
client.commands = new Discord.Collection();
fs.readdir("./cmd/" , (err, files) => {
	if (err) throw err;
	let cmdfile = files.filter (f => f.split(".").pop() === "js");
	if (cmdfile.length <= 0) {
		console.log("No command found uwu");
		return
	}

	console.log(`Loading ${cmdfile.length} command(s), please wait...`);
	cmdfile.forEach((f, i) => {
		let props = require(`./cmd/${f}`);
		console.log(`${i+1} : ${f} loaded`);
		client.commands.set(props.config.name, props)
	})
});

// Elaina DB
let elainauri = 'mongodb://' + elainadbkey + '@elainadb-shard-00-00-r6qx3.mongodb.net:27017,elainadb-shard-00-01-r6qx3.mongodb.net:27017,elainadb-shard-00-02-r6qx3.mongodb.net:27017/test?ssl=true&replicaSet=ElainaDB-shard-0&authSource=admin&retryWrites=true';
let maindb = '';
let elainadb = new mongodb.MongoClient(elainauri, {useNewUrlParser: true});

elainadb.connect( function(err, db) {
	if (err) throw err;
	maindb = db.db('ElainaDB');
	console.log("Elaina DB connection established");
});

// Alice DB
let aliceuri = 'mongodb+srv://' + alicedbkey + '@alicedb-hoexz.gcp.mongodb.net/test';
let alicedb = '';
let alcdb = new mongodb.MongoClient(aliceuri, {useNewUrlParser: true});

alcdb.connect((err, db) => {
	if (err) throw err;
	alicedb = db.db("AliceDB");
	console.log("Alice DB connection established")
});

// Main client events
client.on("ready", () => {
    console.log("Alice Synthesis Thirty is up and running");
    client.user.setActivity("a!help | a!modhelp", {type: "PLAYING"}).catch(console.error);
    console.log("Webhook initiated");
	
	let i = 1;
    let activity_list = [["a!help | a!modhelp", "PLAYING"], ["version 2.0 live!", "PLAYING"]];
    setInterval(() => {
    	client.user.setActivity(activity_list[i][0], {type: activity_list[i][1]}).catch(console.error);
    	if (i == 0) i++;
    	else i--
	}, 10000)
	
	setInterval(() => {
		if (!apidown) client.commands.get("trackfunc").run(client, message = "", args = {}, maindb);
		client.commands.get("dailytrack").run(client, message = "", args = {}, maindb, alicedb);
		client.commands.get("weeklytrack").run(client, message = "", args = {}, maindb, alicedb);
		//client.commands.get("clantrack").run(client, message = "", args = {}, maindb, alicedb)
	}, 600000);
	
	setInterval(() => {
		http.request(`http://ops.dgsrz.com/api/getuserinfo.php?apiKey=${droidapikey}&uid=51076`, res => {
			res.setEncoding("utf8");
			res.setTimeout(5000);
			let content = '';
			res.on("data", chunk => {
				content += chunk
			});
			res.on("error", err => {
				console.log("API performance degraded");
				apidown = true
			});
			res.on("end", () => {
				try {
					JSON.parse(content.split("<br>")[1]);
					if (apidown) console.log("API performance restored");
					apidown = false
				} catch (e) {
					if (!apidown) console.log("API performance degraded");
					apidown = true
				}
			})
		}).end()
	}, 10000);
	
	// Mudae role assignment reaction-based on droid cafe
	let guild = client.guilds.get("635532651029332000");
	let channel = guild.channels.get("640165306404438026");
	channel.fetchMessage("657597328772956160").then(message => {
		message.react('639481086425956382').catch(console.error);
		let collector = message.createReactionCollector((reaction, user) => reaction.emoji.id === '639481086425956382' && user.id !== client.user.id);
		collector.on("collect", () => {
			message.reactions.find(r => r.emoji.id === '639481086425956382').fetchUsers(10).then(collection => {
				let user = guild.member(collection.find(u => u.id !== client.user.id).id);
				let role = guild.roles.get("640434406200180736");
				if (!user.roles.get(role.id)) user.addRole(role, "Agreed to Mudae rules").catch(console.error);
				else user.removeRole(role, "Disagreed to Mudae rules").catch(console.error);
				message.reactions.forEach(reaction => reaction.remove(user.id).catch(console.error))
			})
		})
	}).catch(console.error);
	
	// Challenge role assignment (reaction-based)
	let interserver = client.guilds.get("316545691545501706");
	let interchannel = interserver.channels.get("669221772083724318");
	interchannel.fetchMessage("674626850164703232").then(message => {
		message.react("✅").catch(console.error);
		let collector = message.createReactionCollector((reaction, user) => reaction.emoji.name === "✅" && user.id !== client.user.id);
		collector.on("collect", () => {
			message.reactions.find(r => r.emoji.name === "✅").fetchUsers(10).then(collection => {
				let user = interserver.member(collection.find(u => u.id !== client.user.id).id);
				let role = interserver.roles.get("674918022116278282");
				if (!user.roles.has(role.id)) user.addRole(role, "Automatic role assignment").catch(console.error);
				else user.removeRole(role, "Automatic role assignment").catch(console.error);
				message.reactions.forEach(reaction => reaction.remove(user.id).catch(console.error))
			})
		})
	}).catch(console.error)
});

client.on("message", message => {
	if (message.author.bot) return;
	let msgArray = message.content.split(/\s+/g);
	let command = msgArray[0];
	let args = msgArray.slice(1);
	if ((message.author.id == '111499800683216896' || message.author.id == '386742340968120321') && message.content.toLowerCase() == 'brb shower') {
		let images = [
			"https://cdn.discordapp.com/attachments/440319362407333939/666825359198519326/unknown.gif",
			"https://cdn.discordapp.com/attachments/316545691545501706/667287014152077322/unknown.gif",
			"https://cdn.discordapp.com/attachments/635532651779981313/666825419298701325/unknown.gif",
			"https://cdn.discordapp.com/attachments/635532651779981313/662844781327810560/unknown.gif",
			"https://cdn.discordapp.com/attachments/635532651779981313/637868500580433921/unknown.gif"
		];
		const index = Math.floor(Math.random() * (images.length - 1) + 1);
		message.channel.send({files: [images[index]]});
	}

	// #trash-talk spam reminder
	if (message.content.startsWith(".")) {
		if (message.guild.id != '316545691545501706') return;
		if (message.channel.name != 'trash-talk') return;
		args = command.slice(1);
		if (!args) return;
		message.channel.send("Hey, is that NSB command I'm seeing? Remember not to spam bots in here!")
	}
	
	// 8ball
	if ((message.content.startsWith("Alice, ") && message.content.endsWith("?")) || (message.author.id == '386742340968120321' && message.content.startsWith("Dear, ") && message.content.endsWith("?"))) {
		if (message.channel instanceof Discord.DMChannel) return message.channel.send("I do not want to respond in DMs!");
		let args = msgArray.slice(0);
		let cmd = client.commands.get("response");
		return cmd.run(client, message, args, maindb, alicedb)
	}
	
	// woi
	if (message.content.toLowerCase().includes("woi")) {
		if (message.author.id == '386742340968120321') return message.channel.send("woi");
	}
	
	// main bot offline notification
	if (message.content.startsWith("&")) {
		let mainbot = message.guild.members.get("391268244796997643");
		if (!mainbot) return;
		let cmd = client.commands.get(command.slice(1));
		if (cmd && mainbot.user.presence.status == 'offline') return message.channel.send("Hey, unfortunately Elaina is offline now! Please use `a!" + cmd.help.name + "`!")
	}
	
	// osu! automatic recognition
	if (message.attachments.size !== 0) client.commands.get("recognition").run(client, message);
	if (message.content.startsWith("https://osu.ppy.sh/")) {
		let a = command.split("/");
		let id = parseInt(a[a.length - 1]);
		if (!isNaN(id)) {
			if (command.indexOf("#osu/") !== -1 || command.indexOf("/b/") !== -1 || command.indexOf("/beatmaps/") !== -1) client.commands.get("autocalc").run(client, message, msgArray);
			else if (command.indexOf("/beatmapsets/") !== -1 || command.indexOf("/s/") !== -1) client.commands.get("autocalc").run(client, message, msgArray, true)
		}
	}
	
	// commands
	if (message.author.id == '386742340968120321' && message.content == "a!apidown") {
		apidown = !apidown;
		return message.channel.send(`✅ **| API down mode has been set to \`${apidown}\`.**`)
	}
	
	if (message.content.includes("m.mugzone.net/chart/")) {
		let cmd = client.commands.get("malodychart");
		cmd.run(client, message, args)
	}
	
	if (message.content.startsWith(config.prefix)) {
		let cmd = client.commands.get(command.slice(config.prefix.length));
		if (cmd) {
			if (apidown && require_api.includes(cmd.help.name)) return message.channel.send("❎ **| I'm sorry, API is currently unstable or down, therefore you cannot use droid-related commands!**");
			if (message.content.startsWith("$")) return message.channel.send("I'm not Mudae!");
			cmd.run(client, message, args, maindb, alicedb)
		}
	}
});

// welcome message for international server
client.on("guildMemberAdd", member => {
	let channel = member.guild.channels.get("360716684174032896");
	if (!channel) return;
	console.log("Member joined");
	let joinMessage = `Welcome to ${member.guild.name}'s ${channel}, <@${member.id}>. To verify yourself as someone who plays osu!droid or interested in the game and open the rest of the server, you can follow *any* of the following methods:\n\n- post your osu!droid screenshot (main menu if you are an online player or recent result (score) if you are an offline player)\n\n- post your osu! profile (screenshot or link) and reason why you join this server (don't worry, we don't judge you)\n\nafter that, you can ping Moderator or Helper role and wait for one to come to verify you (you can also ping both roles if you need help), waiting can last from 5 seconds to 1 hour (I know, sorry xd)`;
	channel.send(joinMessage)
});

client.on("guildMemberUpdate", oldMember => {
	if (oldMember.user.bot) return;
	let general = oldMember.guild.channels.get("316545691545501706");
	if (!general || oldMember.roles.find(r => r.name === "Member")) return;
	fs.readFile("welcome.txt", 'utf8', (err, data) => {
		if (err) return console.log(err);
		let welcomeMessage = `Welcome to ${oldMember.guild.name}, <@${oldMember.id}>!`;
		setTimeout(() => {
			oldMember.user.send(data).catch(console.error);
			general.send(welcomeMessage, {files: ["https://i.imgur.com/LLzteLz.jpg"]})
		}, 100)
	})
});

// lounge ban detection
client.on("guildMemberUpdate", (oldMember, newMember) => {
	if (newMember.guild.id != '316545691545501706' || newMember.roles == null) return;
	let role = newMember.roles.find(r => r.name === 'Lounge Pass');
	if (!role) return;
	alicedb.collection("loungelock").find({discordid: newMember.id}).toArray((err, res) => {
		if (err) {
			console.log(err);
			console.log("Unable to retrieve ban data")
		}
		if (!res[0]) return;
		newMember.removeRole(role, "Locked from lounge channel").catch(console.error);
		let embed = new Discord.RichEmbed()
			.setDescription(`${newMember} is locked from lounge channel!`)
			.setColor("#b58d3c");
		newMember.guild.channels.find(c => c.name === config.management_channel).send({embed: embed})
	})
});

// role logging
client.on("guildMemberUpdate", (oldMember, newMember) => {
	if (oldMember.guild.id != '316545691545501706') return;
	if (oldMember.roles.size == newMember.roles.size) return;
	let guild = client.guilds.get('528941000555757598');
	let logchannel = guild.channels.get('655829748957577266');
	let footer = config.avatar_list;
	const index = Math.floor(Math.random() * (footer.length - 1) + 1);
	let embed = new Discord.RichEmbed()
                .setFooter("Alice Synthesis Thirty", footer[index])
                .setTimestamp(new Date());

	if (oldMember.roles.size > newMember.roles.size) {
		oldMember.roles.forEach(role => {
			if (!newMember.roles.get(role.id)) {
                                embed.setDescription("`" + role.name + "` was removed from " + newMember.user.username);
                                embed.setColor(role.hexColor)
			}
		});
		logchannel.send({embed: embed})
	}
	else {
		newMember.roles.forEach(role => {
			if (!oldMember.roles.get(role.id)) {
				embed.setDescription("`" + role.name + "` was added to " + newMember.user.username);
                                embed.setColor(role.hexColor)
			}
		});
		logchannel.send({embed: embed})
	}
});

// message logging
client.on("messageUpdate", (oldMessage, newMessage) => {
	if (oldMessage.author.bot) return;
	if (oldMessage.content == newMessage.content) return;
	let logchannel = oldMessage.guild.channels.find(c => c.name === config.log_channel);
	if (!logchannel) return;
	const embed = new Discord.RichEmbed()
		.setAuthor(oldMessage.author.tag, oldMessage.author.avatarURL)
		.setFooter(`Author ID: ${oldMessage.author.id} | Message ID: ${oldMessage.id}`)
		.setTimestamp(new Date())
		.setColor("#00cb16")
		.setTitle("Message edited")
		.addField("Channel", `${oldMessage.channel} | [Go to message](${oldMessage.url})`)
		.addField("Old Message", oldMessage.content.substring(0, 1024))
		.addField("New Message", newMessage.content.substring(0, 1024));
	logchannel.send(embed)
});

client.on("messageDelete", message => {
	if (message.author.bot) return;
	if (message.guild.id == '316545691545501706') {
		if (message.attachments.size == 0) return;
		let attachments = [];
		message.attachments.forEach((attachment) => {
			attachments.push(attachment.proxyURL)
		});
		setTimeout(() => {
                        messageLog.send("Image attached", {files: attachments}).catch(console.error)
                }, 500);
                return
	}
	let logchannel = message.guild.channels.find(c => c.name === config.log_channel);
	if (!logchannel) return;
	const embed = new Discord.RichEmbed()
		.setAuthor(message.author.tag, message.author.avatarURL)
		.setFooter(`Author ID: ${message.author.id} | Message ID: ${message.id}`)
		.setTimestamp(new Date())
		.setColor("#cb8900")
		.setTitle("Message deleted")
		.addField("Channel", message.channel);

	if (message.content) embed.addField("Content", message.content.substring(0, 1024));
	logchannel.send(embed);

	if (message.attachments.size > 0) {
		let attachments = [];
		message.attachments.forEach(attachment => {
			attachments.push(attachment.proxyURL)
		});
		logchannel.send({files: attachments})
	}
});

client.on("messageDeleteBulk", messages => {
	let message = messages.first();
	let logchannel = message.guild.channels.find(c => c.name === config.log_channel);
	if (!logchannel) return;
	const embed = new Discord.RichEmbed()
		.setTitle("Bulk delete performed")
		.setColor("#4354a3")
		.setTimestamp(new Date())
		.addField("Channel", message.channel)
		.addField("Amount of messages", messages.size);
	logchannel.send(embed)
});

// role logging to keep watch on moderators in the server
// role create
client.on("roleCreate", role => {
	if (role.guild.id != '316545691545501706') return;
	let guild = client.guilds.get('528941000555757598');
	let logchannel = guild.channels.get('655829748957577266');
	if (!logchannel) return;
	let footer = config.avatar_list;
	const index = Math.floor(Math.random() * (footer.length - 1) + 1);
	let embed = new Discord.RichEmbed()
		.setTitle("Role created")
		.setFooter("Alice Synthesis Thirty", footer[index])
		.setTimestamp(new Date())
		.setColor(role.hexColor)
		.setDescription("`" + role.name + "` was created");
	logchannel.send({embed: embed})
});

// role delete
client.on("roleDelete", role => {
	if (role.guild.id != '316545691545501706') return;
	let guild = client.guilds.get('528941000555757598');
	let logchannel = guild.channels.get('655829748957577266');
	if (!logchannel) return;
	let footer = config.avatar_list;
	const index = Math.floor(Math.random() * (footer.length - 1) + 1);
	let embed = new Discord.RichEmbed()
		.setTitle("Role deleted")
		.setFooter("Alice Synthesis Thirty", footer[index])
		.setTimestamp(new Date())
		.setColor(role.hexColor)
		.setDescription("`" + role.name + "` was deleted");
	logchannel.send({embed: embed})
});

client.login(process.env.BOT_TOKEN).catch(console.error);
