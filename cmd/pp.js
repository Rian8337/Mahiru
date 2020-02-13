let Discord = require('discord.js');
let config = require('../config.json');
let osudroid = require('../modules/osu!droid');

function calculatePP(message, whitelist, embed, i, submitted, pplist, playc, playentry, cb) {
	if (!playentry[i]) return cb(false, true);
	let play = playentry[i];
	whitelist.findOne({hashid: play.hash}, (err, wlres) => {
		if (err) {
			console.log(err);
			message.channel.send("❎ **| I'm sorry, I'm having trouble on retrieving the map's whitelist info!**");
			return cb(true)
		}
		let query = {hash: play.hash};
		if (wlres) query = {beatmap_id: wlres.mapid};
		new osudroid.MapInfo().get(query, mapinfo => {
			if (!mapinfo.title) {
				message.channel.send("❎ **| I'm sorry, the map you've played can't be found on osu! beatmap listing, please make sure the map is submitted and up-to-date!**");
				return cb()
			}
			if ((mapinfo.approved == 3 || mapinfo.approved <= 0) && !wlres) {
				message.channel.send("❎ **| I'm sorry, the PP system only accepts ranked, approved, whitelisted, or loved mapset right now!**");
				return cb()
			}
			let beatmapid = mapinfo.beatmap_id;
			let mod = mapinfo.modConvert(play.mod);
			new osudroid.MapStars().calculate({beatmap_id: beatmapid, mods: mod}, star => {
				if (!star.droid_stars) {
					message.channel.send("❎ **| I'm sorry, I'm having trouble on retrieving the map's droid star rating!**");
					return cb()
				}
				let npp = new osudroid.MapPP().calculate({
					stars: star.droid_stars,
					combo: play.combo,
					miss: play.miss,
					acc_percent: play.acc,
					mode: "droid"
				});
				let pp = parseFloat(npp.pp.toString().split(" ")[0]);
				let playinfo = mapinfo.showStatistics(mod, 0);
				let ppentry = [play.hash, playinfo, pp, play.combo, play.acc, play.miss];
				if (isNaN(pp)) {
					message.channel.send("❎ **| I'm sorry, I'm having trouble on retrieving the map's pp data!**");
					return cb()
				}
				playc++;
				let dup = false;
				let weight = 1;
				let old_net_pp = 0;
				for (let i in pplist) {
					weight *= 0.95;
					if (ppentry[0] == pplist[i][0]) {
						old_net_pp = parseFloat((weight * pplist[i][2]).toFixed(2));
						pplist[i] = ppentry;
						dup = true;
						break
					}
				}
				if (!dup) pplist.push(ppentry);
				pplist.sort(function (a, b) {
					return b[2] - a[2]
				});
				while (pplist.length > 75) pplist.pop();
				submitted++;
				weight = 1;
				let found = false;
				for (let x = 0; x < pplist.length; x++) {
					weight *= 0.95;
					if (pplist[x][0] == play.hash) {
						let new_net_pp = parseFloat((weight * pplist[x][2]).toFixed(2)) - old_net_pp;
						embed.addField(`${submitted}. ${playinfo}`, `${play.combo}x | ${play.acc}% | ${play.miss} ❌ | ${pp}pp | *${new_net_pp >= 0 ? `+${new_net_pp}` : `-${new_net_pp}`}pp*`);
						found = true;
						break
					}
				}
				if (!found) embed.addField(`${submitted}. ${playinfo}`, `${play.combo}x | ${play.acc}% | ${play.miss} ❌ | ${pp}pp | **+0.00pp**`);
				cb()
			})
		})
	})
}

module.exports.run = (client, message, args, maindb) => {
	if (message.channel instanceof Discord.DMChannel) return message.channel.send("This command is not available in DMs");
	let channels = config.pp_channel;
	let found = false;
	for (let i = 0; i < channels.length; i++) {
		if (message.guild.channels.get(channels[i])) {
			found = true;
			break
		}
	}
	if (!found) return message.channel.send("❎ **| I'm sorry, this command is not allowed in here!**");
	let ufind = message.author.id;
	let offset = 1;
	let start = 1;
	if (args[0]) offset = parseInt(args[0]);
	if (args[1]) start = parseInt(args[1]);
	if (isNaN(offset)) offset = 1;
	if (isNaN(start)) start = 1;
	if (offset > 5 || offset < 1) return message.channel.send("❎ **| I cannot submit that many plays at once! I can only do up to 5!**");
	if (start + offset - 1 > 50) return message.channel.send('❎ **| I think you went over the limit. You can only submit up to 50 of your recent plays!**');
	let binddb = maindb.collection("userbind");
	let whitelist = maindb.collection("mapwhitelist");
	let query = {discordid: ufind};
	binddb.find(query).toArray(function (err, userres) {
		if (err) {
			console.log(err);
			return message.channel.send("Error: Empty database response. Please try again!")
		}
		if (!userres[0]) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
		let uid = userres[0].uid;
		let discordid = userres[0].discordid;
		let pplist = [];
		let pptotal = 0;
		let pre_pptotal = 0;
		let submitted = 0;
		let playc = 0;
		if (userres[0].pp) pplist = userres[0].pp;
		if (userres[0].pptotal) pre_pptotal = userres[0].pptotal;
		if (userres[0].playc) playc = userres[0].playc;
		new osudroid.PlayerInfo().get({uid: uid}, player => {
			if (!player.name) return message.channel.send("❎ **| I'm sorry, I cannot find your profile!**");
			if (!player.recent_plays) return message.channel.send("❎ **| I'm sorry, you haven't submitted any play!**");
			let rplay = player.recent_plays;
			let playentry = [];
			let footer = config.avatar_list;
			const index = Math.floor(Math.random() * (footer.length - 1) + 1);
			let rolecheck;
			try {
				rolecheck = message.member.highestRole.hexColor
			} catch (e) {
				rolecheck = "#000000"
			}
			let embed = new Discord.RichEmbed()
				.setTitle("PP submission info")
				.setFooter("Alice Synthesis Thirty", footer[index])
				.setColor(rolecheck);

			for (let i = start - 1; i < start + offset - 1; i++) {
				if (!rplay[i]) break;
				let play = {
					title: "", acc: "", miss: "", combo: "", mod: "", hash: ""
				};
				play.title = rplay[i].filename;
				play.acc = rplay[i].accuracy.toPrecision(4) / 1000;
				play.miss = rplay[i].miss;
				play.combo = rplay[i].combo;
				play.mod = rplay[i].mode;
				play.hash = rplay[i].hash;
				playentry.push(play)
			}
			let i = 0;
			calculatePP(message, whitelist, embed, i, submitted, pplist, playc, playentry, function testResult(error = false, stopSign = false) {
				if (stopSign) {
					let weight = 1;
					for (let i in pplist) {
						pptotal += weight * pplist[i][2];
						weight *= 0.95;
					}
					let diff = pptotal - pre_pptotal;
					embed.setDescription(`Total PP: **${pptotal.toFixed(2)} pp**\nPP gained: **${diff.toFixed(2)} pp**`);
					message.channel.send('✅ **| <@' + discordid + '> successfully submitted your play(s). More info in embed.**', {embed: embed});
					let updateVal = {
						$set: {
							pptotal: pptotal,
							pp: pplist,
							playc: playc
						}
					};
					binddb.updateOne(query, updateVal, function (err) {
						if (err) throw err
					});
					return
				}
				if (!error) i++;
				calculatePP(message, whitelist, embed, i, submitted, pplist, playc, playentry, testResult)
			})
		})
	})
};

module.exports.config = {
	description: "Submits plays from user's profile into the user's droid pp profile. Only allowed in bot channel and pp project channel in osu!droid International Discord server.",
	usage: "pp [offset] [start]",
	detail: "`offset`: The amount of play to submit from 1 to 5, defaults to 1 [Integer]\n`start`: The position in your recent play list that you want to start submitting, up to 50, defaults to 1 [Integer]",
	permission: "None"
};

module.exports.help = {
	name: "pp"
};
