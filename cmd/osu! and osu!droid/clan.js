const Discord = require('discord.js');
const config = require('../../config.json');
const cd = new Set();

function capitalizeString(string = "") {
    return string.charAt(0).toUpperCase() + string.slice(1)
}

function isEligible(member) {
    let res = 0;
    let eligibleRoleList = config.mute_perm; //mute_permission but used for this command, practically the same
    eligibleRoleList.forEach((id) => {
        if (member.roles.cache.has(id[0])) res = id[1]
    });
    return res
}

function timeConvert(num) {
    let sec = parseInt(num);
    let days = Math.floor(sec / 86400);
    let hours = Math.floor((sec - days * 86400) / 3600);
    let minutes = Math.floor((sec - days * 86400 - hours * 3600) / 60);
    let seconds = sec - days * 86400 - hours * 3600 - minutes * 60;
    return [days, hours, minutes, seconds]
}

function editMember(clanres, page, rolecheck, footer, index) {
    let embed = new Discord.MessageEmbed()
        .setTitle(`${clanres[0].name} Members (Page ${page + 1}/4)`)
        .setFooter("Alice Synthesis Thirty", footer[index])
        .setColor(rolecheck);
    
    let list = clanres[0].member_list;
    let leader = clanres.leader;
    let memberstring = '';
    for (let i = 5 * (page - 1); i < 5 + 5 * (page - 1); i++) {
        if (!list[i]) break;
        memberstring += `${i+1}. <@${list[i].id}> (${list[i].id}) - ${list[i].hasPermission ? `${list[i].id === leader ? "Leader" : "Co-Leader"}` : "Member"}\n`
    }
    embed.setDescription(memberstring);
    return embed
}

function spaceFill(s, l) {
    let a = s.length;
    for (let i = 1; i < l-a; i++) {
        s += ' ';
    }
    return s;
}

function editLeaderboard(res, page) {
    let output = '#   | Clan Name            | Members | Power\n';
    for (let i = page * 20; i < page * 20 + 20; i++) {
        if (res[i]) {
            if (res[i].power && res[i].name) output += spaceFill((i+1).toString(), 4) + ' | ' + spaceFill(res[i].name, 21) + ' | ' + spaceFill(res[i].member_list.length.toLocaleString(), 8) + ' | ' + res[i].power.toLocaleString() + '\n';
            else output += spaceFill((i+1).toString(), 4) + ' | ' + spaceFill(res[i].name, 21) + ' | ' + spaceFill(res[i].member_list.length.toLocaleString(), 8) + ' | ' + res[i].power.toLocaleString() + '\n';
        }
        else output += spaceFill("-", 4) + ' | ' + spaceFill("-", 21) + ' | ' + spaceFill("-", 8) + ' | - \n';
    }
    output += "Current page: " + (page + 1) + "/" + (Math.floor(res.length / 20) + 1);
    return output
}

function editAuction(res, coin, page, rolecheck, footer, index) {
    let embed = new Discord.MessageEmbed()
        .setColor(rolecheck)
        .setFooter(`Alice Synthesis Thirty | Page ${page}/${Math.floor(res.length / 5)}`, footer[index])
        .setDescription(`**${res.length === 1 ? "Auction" : "Auctions"}**: ${res.length.toLocaleString()}`);

    for (let i = 5 * (page - 1); i < 5 + 5 * (page - 1); i++) {
        if (!res[i]) break;
        embed.addField(`**${i+1}. ${res[i].name}**`, `**Auctioneer**: ${res[i].auctioneer}\n**Created at**: ${new Date(res[i].creationdate * 1000).toUTCString()}\n**Expires at**: ${new Date(res[i].expirydate * 1000).toUTCString()}\n\n**Powerup**: ${capitalizeString(res[i].powerup)}\n**Amount**: ${res[i].amount.toLocaleString()}\n**Minimum bid amount**: ${coin}**${res[i].min_price.toLocaleString()}** Alice coins\n**Bidders**: ${res[i].bids.length.toLocaleString()}`)
    }

    return embed
}

module.exports.run = (client, message, args, maindb, alicedb) => {
    if (message.channel instanceof Discord.DMChannel) return;
    //if (message.guild.id != '316545691545501706') return message.channel.send("❎ **| I'm sorry, this command is only available in droid (International) Discord server!**");
    if (args[0] !== "about" && message.author.id !== '386742340968120321' && message.author.id !== '132783516176875520') return message.channel.send("❎ **| I'm sorry, this command is still in testing!**");
    if (cd.has(message.author.id)) return message.channel.send("❎ **| Hey, calm down with the command! I need to rest too, you know.**");
    let binddb = maindb.collection("userbind");
    let clandb = maindb.collection("clandb");
    let pointdb = alicedb.collection("playerpoints");
    let auctiondb = alicedb.collection("auction");
    let coin = client.emojis.cache.get("669532330980802561");
    let curtime = Math.floor(Date.now() / 1000);
    let perm = isEligible(message.member) === -1;
    let query = {};
    let updateVal;
    let insertVal;
    let rolecheck;
    try {
        rolecheck = message.member.roles.highest.hexColor
    } catch (e) {
        rolecheck = "#000000"
    }
    let footer = config.avatar_list;
    const index = Math.floor(Math.random() * footer.length);
    let embed = new Discord.MessageEmbed()
        .setFooter("Alice Synthesis Thirty", footer[index])
        .setColor(rolecheck);

    switch (args[0]) {
        case "about": {
            // everything normal members need to know about clans!
            // ===================================================
            // also has explanation for each commands
            let help_array = [
                [
                    // 1
                    "Introduction",
                    "Welcome to Clans!\n" +
                    "\n" +
                    "This is a new system that emulates the feeling of a real guild-based game. You can make a clan and compete with other clans to gain power points.\n" +
                    "\n" +
                    "__**General Rules and Guidelines**__\n" +
                    "- **All clans must abide by server rules. Failure to do so may result in your clan getting disbanded and potentially getting you banned from the server without any further notice.**\n" +
                    "- **Abuse of the clan system of any kind will result in your clan getting disbanded and potentially getting you banned from the server without any further notice.**\n" +
                    "- This is a heavily team-based system. You'll want to find friends to form a clan with you. Trust me, this will be very hard to keep up without friends!\n" +
                    "- A clan can have up to 25 members (including the clan leader).\n" +
                    "\n" +
                    "Make sure you read this wiki thoroughly before diving in to clans. Stuff will get very confusing, otherwise.\n" +
                    "\n" +
                    "__**Contents**__\n" +
                    "- Page 3: Clan Member Positions\n" +
                    "- Page 4: A Letter to Clan Leaders\n" +
                    "- Page 5: Clan Icons\n" +
                    "- Page 6: Clan Description\n" +
                    "- Page 7: Power Points\n" +
                    "- Page 8: Clan Powerups\n" +
                    "- Page 9-14: Clan Shop\n" +
                    "- Page 15: Auctions\n" +
                    "- Page 16-18: Clan Battles\n" +
                    "- Page 19: Weekly Upkeep\n" +
                    "- Page 20-23: Command Information\n" +
                    "- Page 24-26: Stats for nerds\n" +
                    "- Page 27: A Letter to Moderators"
                ],
                [
                    // 2
                    "Starting",
                    `To start with the system, you can create a clan or join an existing one. It is recommended to have a few ${coin}Alice coins before diving in to the system as this consumes quite a lot of them.\n` +
                    "\n" +
                    `To create a clan, use \`a!clan create <name>\`. This costs ${coin}\`7,500\` Alice coins.\n` +
                    "If you don't want to create a clan, you can join an existing one. You must contact the co-leader or leader of the clan to join the clan."
                ],
                [
                    // 3
                    "Clan Member Positions",
                    "There are three member positions in a clan. They are:\n" +
                    "**1. Member**\n" +
                    "This is the lowest position of a clan member. Any newly joined members will be assigned to this position.\n" +
                    "Clan members in this position have very limited permissions, with only having the ability to buy powerups for their clan via clan shop, which will be explained later.\n" +
                    "**2. Co-Leader**\n" +
                    "This is the second position of a clan member. To acquire this position, clan members must be promoted by the clan leader.\n" +
                    "Clan members in this position have more permissions than regular clan members. They are able to accept new clan members, kick existing clan members, change clan description and icon, activate clan powerups, and start an auction.\n" +
                    "**3. Leader**\n" +
                    "This is the highest position of a clan member. When a new clan is created, the creator will automatically be the clan leader.\n" +
                    "The clan leader has the most permissions out of all clan members. The clan leader can kick co-leaders and normal members, promote normal clan members to co-leaders, demote co-leaders to normal clan members, change clan name, and more."
                ],
                [
                    // 4
                    "A Letter to Clan Leaders",
                    "As mentioned previously in page 2, your clan can have co-leaders to help maintain your clan activity.\n" +
                    "To promote a normal clan member to co-leader, use `a!clan promote <user to promote>`.\n" +
                    "To demote a co-leader to a normal clan member, use `a!clan demote <user to demote>`.\n" +
                    "You will need someone else to monitor your clan in case you went inactive, but be careful on promoting clan members as co-leaders have more powers as described in page 3.\n" +
                    "\n" +
                    "If you want to transfer your leadership to another clan member, there is a way to do that, which will be shown later."
                ],
                [
                    // 5
                    "Clan Icons",
                    "When your clan power reaches 250, you can change your clan's icon. This will be viewed when someone views your clan info or clan member list. You must be at least a co-leader in the clan to change clan icon.\n" +
                    "You can use `a!clan icon set <link>` to set an icon or override an existing one (5-minute cooldown will be applied) and `a!clan icon remove [name]` to remove your clan's icon."
                ],
                [
                    // 6
                    "Clan Description",
                    "A clan has a description box in which the clan can describe stuff about itself.\n" +
                    "\n" +
                    "The description box is accessible using `a!clan description`. You must be at least a co-leader of the clan to perform changes to clan description.\n" +
                    "To edit your clan's description, use `a!clan description edit <text>`. Be mindful that clan descriptions can only have up to 1,024 characters due to Discord's limitation.\n" +
                    "To clear your clan's description, use `a!clan description clear`.\n" +
                    "\n" +
                    "Do note that a moderator can edit or remove your clan's description if it's deemed inappropriate or not bound to server rules as mentioned previously in page 1."
                ],
                [
                    // 7
                    "Power Points",
                    "Power points represents your clan's power.\n" +
                    "\n" +
                    "Clan members can obtain power points for their clan by playing daily and weekly challenges in <#669221772083724318> and by battling other clans. Clan battles will be explained in page 15-17.\n" +
                    "\n" +
                    "However, aside of earning power points, a clan can also lose them!\n" +
                    "If a clan loses to another clan in clan battles, the clan loses power points based on its current power points.\n" +
                    "On top of that, if a clan is unable to pay a weekly upkeep, which will be explained in page 17, the clan loses 50 power points."
                ],
                [
                    // 8
                    "Clan Powerups",
                    "Powerups will amplify the amount of power points exchanged during clan battles, which will be discussed in page 14. Each powerup gives different multiplier and has different required conditions:\n" +
                    "- Buff: awards more points for winner clan if loser clan has enough points\n" +
                    "- Challenge: if the winner clan meets a certain task, awards more points for winner clan if loser clan has enough points\n" +
                    "- Debuff: awards less points for winner clan if loser clan has this active\n" +
                    "- Bomb: if the winner clan does not meet a certain task, awards less points for winner clan\n" +
                    "\n" +
                    "Each powerup has its own `super` and `mega` version, which has a stronger amplifier than its preceeding versions.\n" +
                    "\n" +
                    "You can access powerups section using `a!clan powerup`. Clan leaders and co-leaders are able to activate a powerup using `a!clan powerup activate <powerup>`.\n" +
                    "To view the list of powerups your clan has, use `a!clan powerup list`.\n" +
                    "To view the list of currently active powerups, use `a!clan powerup activelist`.\n" +
                    "\n" +
                    "The amplifiers of each powerup can be found at page 24.\n" +
                    "The next section will discuss about clan shop, which is where you will be able to obtain powerups."
                ],
                [
                    // 9
                    "Clan Shop",
                    "The clan shop offers different items to spice up your clan. Each item has its own cost and power point requirement:\n" +
                    `- Rename clan: ${coin}\`2,500\` Alice coins, clan must have at least 500 power points (7-day cooldown per name change)\n` +
                    `- Clan role: ${coin}\`5,000\` Alice coins, clan must have at least 2,000 power points\n` +
                    `- Clan role color: ${coin}\`500\` Alice coins, clan must have clan role\n` +
                    `- Leadership transfer: ${coin}\`500\` Alice coins, clan must have at least 2 members\n` +
                    `- Powerup: ${coin}\`100\` Alice coins, gives a random powerup for your clan\n` +
                    "\n" +
                    "You can access the shop using `a!clan shop`.\n" +
                    "There will be special events (such as double drop rate of a powerup or discounts) occasionally."
                ],
                [
                    // 10
                    "Clan Shop",
                    "**Clan Rename**\n" +
                    "\n" +
                    "This shop item gives you the ability to change your clan name. Do note that your clan name will be reset if your clan name is deemed inappropriate or not bound to server rules as mentioned previously in page 1.\n" +
                    "You must be the clan's leader and your clan must have at least 500 power points to use this item.\n" +
                    "\n" +
                    `This item costs ${coin}\`2,500\` Alice coins. To buy it, use \`a!clan shop rename <new name>\`.\n` +
                    "Once you buy this item, your clan will be imposed to a 7-day cooldown during which you will not be able to change your clan name."
                ],
                [
                    // 11
                    "Clan Shop",
                    "**Clan Role**\n" +
                    "\n" +
                    "This shop item allows your clan members to have an exclusive role. If you buy a clan rename, the role name will change accordingly.\n" +
                    "This role will be permanent until your clan is disbanded.\n" +
                    "You must be the clan's leader and your clan must have at least 2,000 power points to use this item.\n" +
                    "\n" +
                    `This item costs${coin}\`5,000\` Alice coins. To buy it, use \`a!clan shop role\`.\n` +
                    "Once you buy this item, every member of your clan will be automatically assigned to the role."
                ],
                [
                    // 12
                    "Clan Shop",
                    "**Clan Role Color**\n" +
                    "\n" +
                    "This shop item allows you to change your clan's role color provided that your clan own one. The accepted color format is in hex code, for example `#FFFFFF`.\n" +
                    "You must be the clan's leader and your clan must own a clan role to use this item.\n" +
                    "\n" +
                    `This item costs ${coin}\`500\` Alice coins. To buy it, use \`a!clan shop color <hex color code>\`.\n` +
                    "Once you buy this item, your clan role will be automatically changed to the color you have mentioned."
                ],
                [
                    // 13
                    "Clan Shop",
                    "**Clan Leadership Transfer**\n" +
                    "\n" +
                    "This shop item allows you to transfer your clan's leadership to another clan member. Be cautious with this item as you cannot refund it!\n" +
                    "You must be the clan's leader and your clan must have at least 2 members (including the clan leader) to use this item.\n" +
                    "\n" +
                    `This item costs ${coin}\`500\` Alice coins. To buy it, use \`a!clan shop leader <user to transfer>\`.\n` +
                    "Once you buy this item, your clan member will take the leadership position and you will be demoted to co-leader."
                ],
                [
                    // 14
                    "Clan Shop",
                    "**Powerup**\n" +
                    "\n" +
                    "This shop item gives you a chance to obtain a powerup that can be used during clan battles. Each powerup has different chances, which can be found at page 25.\n" +
                    "\n" +
                    `This item costs ${coin}\`100\` Alice coins. To buy it, use \`a!clan shop powerup\`.\n` +
                    "Once you buy this item, the obtained powerup will be automatically added to your clan's existing powerups."
                ],
                [
                    // 15
                    "Auctions",
                    `If your clan has excess powerups, you can sell them in an auction for ${coin}Alice coins. To initiate an auction, you must be in a clan and must be a co-leader of in it.\n` +
                    "The auction section can be accessed by `a!clan auction`.\n" +
                    `Other clans can bid to an auction using ${coin}Alice coins. The clan who bid the highest amount of it will win the auction.\n` +
                    "Be careful when initiating an auction. You can cancel an auction, however this option is taken out if another clan has bidded to your auction!"
                ],
                [
                    // 16
                    "Clan Battles",
                    "A clan is able to match another clan provided that both clans have more than 0 power points.\n" +
                    "\n" +
                    "To start a battle, both clans must have a representative clan member that's currently not in cooldown and agree to a scheduled time during which the battle will be held. After that, they can contact a referee or moderator to supervise the battle during the previously agreed time. Do note that a newly joined member is imposed to a 4-day cooldown during which the clan member cannot participate in a clan battle.\n" +
                    "\n" +
                    "Before the battle, the referee or moderator will add both clans into match mode by using `a!clan match add <user who match>`. During match mode, a clan cannot activate powerups. Make sure to activate your powerups before battle!\n" +
                    "\n" +
                    "A battle consists of 3 maps, with the first clan to get 2 points first wins."
                ],
                [
                    // 17
                    "Clan Battles",
                    "During battle, the representative of each clan will use the `!roll 1d100` command. The clan with highest roll points will pick a map to play (along with required mods) and specify a challenge for the opposing clan to complete. The challenge must not be impossible and too hard, which in that case the referee or moderator will be able to deny the challenge.\n" +
                    "In addition, the challenge must also be completed by the issuer clan. Therefore, if the opposing clan doesn't pass the challenge, but the issuer clan also doesn't pass the challenge, the challenge will be nullified (is not fulfilled).\n" +
                    "\n" +
                    "After that, the pick will alternate. If a third map is present, both clans will pick a map and then use the `!roll 1d100` command again. The clan who gets the highest points will get their pick played.\n" +
                    "\n" +
                    "After battle, the referee or moderator will use the `a!clan power transfer <user to take> <user to give> [challenge fulfilled? omit if no]` to transfer power points from the losing clan to the winning clan. Active powerups from both clans will automatically be considered and both clans will be put out of match mode after power points have been transferred. The representative of each clan will be put at a 4-day cooldown during which they cannot participate in a clan battle.\n" +
                    "\n" +
                    "In case something goes wrong, the referee or moderator can use `a!clan match remove <user>` to remove the specified user's clan from match mode and `a!clan power <give/take> <user>` to manually transfer power points."
                ],
                [
                    // 18
                    "Clan Battles",
                    "As mentioned previously in page 16, clans can set a challenge for the opposing clan to complete. However, the challenge giver must also be able to complete the challenge.\n" +
                    "If the challenge condition is fulfilled (issuer clan completes the challenge while the opposing clan doesn't), the `bomb` powerup will activate provided that the losing clan has the powerup active.\n" +
                    "However, the `bomb` powerup can be tackled by using the `challenge` powerup. A bomb and challenge powerup with the same tier will cancel each other.\n" +
                    "\n" +
                    "There are multiple challenge types that a clan can give:\n" +
                    "- Combo: at most 80% of the map's full combo\n" +
                    "- Rank: at most S rank (SH if HD is required)\n" +
                    "- Accuracy: at most 99.8%\n" +
                    "- Score: at most 90% of the map's maximum score\n" +
                    "- ScoreV2: at most 990,000\n" +
                    "- Miss: no specific conditions\n" +
                    "- dpp (droid pp): at most 95% of the map's maximum dpp with required mods applied\n" +
                    "- pp: at most 85% of the map's maximum pp with required mods applied\n" +
                    "\n" +
                    "All given challenges must be possible and not too hard for the opposing clan to complete."
                ],
                [
                    // 19
                    "Weekly Upkeep",
                    "Weekly upkeep is a system that prevents high-ranked players from creating and staying in the same clan.\n" +
                    "\n" +
                    `Each week, there will be an upkeep that a clan must pay. Upkeeps will be paid automatically using the clan leader's ${coin}Alice coins each week. The upkeep cost is based on the size of a clan and each clan member's osu!droid rank.\n` +
                    "The formula for weekly upkeep can be found in page 26.\n" +
                    "You can use `a!clan upkeep` to view how much time your clan has before the next upkeep is picked up.\n" +
                    "\n" +
                    "If a clan cannot pay the upkeep, there will be consequences given depending on the situation:\n" +
                    "- If the clan leader doesn't have enough coins, a random member will be kicked, be it a co-leader or a normal clan member\n" +
                    "- If the clan only has 1 member (aka the leader itself) and the condition above is met, the clan's power will decrease by 50\n" +
                    "- If the clan has less than 50 power points and both conditions above are met, the clan will be disbanded"
                ],
                [
                    // 20
                    "Command Information",
                    "`a!clan about`\n" +
                    "Prints this wiki.\n" +
                    "\n" +
                    "`a!clan accept <user>`\n" +
                    "Accepts a user to your clan (Co-Leader+ only).\n" +
                    "\n" +
                    "`a!clan auction <params>`\n" +
                    "The base command for auctions (Co-Leader+ only).\n" +
                    "Parameters:\n" +
                    "- `bid <name> <amount>`: Bids to an existing auction. The auction name and amount of Alice coins to bid is required.\n" +
                    "- `cancel <name>`: Cancels an existing auction. If a clan has bidded to the auction, this is not possible.\n" +
                    "- `create <name> <powerup> <amount> <min. price> <duration (in seconds)>`: Creates an auction with the specified amount of powerup for the specified duration. Minimal duration is 1 minute and maximum duration is 1 day.\n" +
                    "- `list`: Lists current auctions.\n" +
                    "- `status <name>`: Checks current status of an auction.\n" +
                    "\n" +
                    "`a!clan cooldown <params>`\n" +
                    "The base command for cooldowns.\n" +
                    "Parameters:\n" +
                    "- `battle [user]`: Views the cooldown of a user to participate in a clan battle.\n" +
                    "- `join [user]`: Views the cooldown of a user to join a new clan and the user's old clan (if available)."
                ],
                [
                    // 21
                    "Command Information",
                    "`a!clan create <name>`\n" +
                    "Creates a clan with the specified name. Name must be less than 20 characters.\n" +
                    "\n" +
                    "`a!clan description <params>`\n" +
                    "The base command for clan description (Co-Leader+ / Moderator only).\n" +
                    "Parameters:\n" +
                    "- `clear [clan]`: Clears your clan's description. Moderators can specify a clan name to clear other clan's description.\n" +
                    "- `edit <text>`: Edits your clan's description.\n" +
                    "\n" +
                    "`a!clan demote <user>`\n" +
                    "Demotes a co-leader to normal clan member (Clan Leader / Moderator only).\n" +
                    "\n" +
                    "`a!clan disband [clan]`\n" +
                    "Disbands your current clan. Moderators can specify a clan name to disband other clans (Clan Leader / Moderator only).\n" +
                    "\n" +
                    "`a!clan lb [page]`\n" +
                    "Shows a leaderboard of clans based on power points.\n" +
                    "\n" +
                    "`a!clan icon <params>`\n" +
                    "The base command for clan icons (Co-Leader+ / Moderator only).\n" +
                    "Parameters:\n" +
                    "- `remove [clan]`: Removes your current clan icon. Moderators can specify a clan name to remove other clan's icon.\n" +
                    "- `set <link>`: Sets your clan icon to the specified link.\n" +
                    "\n" +
                    "`a!clan info [name]`\n" +
                    "Shows information of a clan. If name is omitted, your current clan information will be shown."
                ],
                [
                    // 22
                    "Command Information",
                    "`a!clan kick <user>`\n" +
                    "Kicks a user from your clan provided that the user is lower position-wise (Co-Leader+ only).\n" +
                    "\n" +
                    "`a!clan leave`\n" +
                    "Leaves your current clan.\n" +
                    "\n" +
                    "`a!clan match <params>`\n" +
                    "The base command for clan match mode (Referee / Moderator only).\n" +
                    "Parameters:\n" +
                    "- `add <user>`: Adds the specified user's clan into match mode.\n" +
                    "- `remove <user>`: Removes the specified user's clan from match mode.\n" +
                    "\n" +
                    "`a!clan members [name]`\n" +
                    "Shows members of a clan. If name is omitted, your current's clan members will be shown.\n" +
                    "\n" +
                    "`a!clan power <params>`\n" +
                    "The base command for power points (Referee / Moderator only).\n" +
                    "Parameters:\n" +
                    "- `give <user> <amount>`: Gives the specified amount of points to the specified user's clan.\n" +
                    "- `take <user> <amount>`: Takes the specified amount of points from the specified user's clan.\n" +
                    "- `transfer <user to take> <user to give> [challenge passed?]`: Transfers power points from a clan (the firstly mentioned user) to another clan (the secondly mentioned user). The third argument must be specified with anything if challenge requirements are fulfilled."
                ],
                [
                    // 23
                    "Command Information",
                    "`a!clan powerup <params>`\n" +
                    "The base command for powerups.\n" +
                    "Parameters:\n" +
                    "- `activate <powerup>`: Activates a powerup provided your clan has sufficient amount of the specified powerup and your clan currently doesn't have an active powerup of the same type. For example, you cannot activate a `bomb` powerup if your clan already have a `bomb` powerup active (Co-Leader+ only).\n" +
                    "- `activelist`: Shows current active powerups of your clan.\n" +
                    "- `list`: Lists current powerups that your clan has.\n" +
                    "\n" +
                    "`a!clan promote <user>`\n" +
                    "Promotes a normal clan member to a co-leader (Clan Leader only).\n" +
                    "\n" +
                    "`a!clan shop <params>`\n" +
                    "The base command for clan shop.\n" +
                    "Parameters:\n" +
                    "- `color <hex code>`: Changes the color of your clan role provided that your clan has one (Clan Leader only).\n" +
                    "- `leader <user>`: Transfers your leadership position to the specified user provided that the user is in your clan (Clan Leader only).\n" +
                    "- `powerup`: Buys a random powerup which will be stored automatically to your clan's powerup collection." +
                    "- `rename <name>`: Renames your clan to the specified name (Clan Leader only).\n" +
                    "- `role`: Enables clan role for all members in the clan (Clan Leader only)."
                ],
                [
                    // 24
                    "Stats for nerds",
                    "**Clan Powerup Effects**\n" +
                    "\n" +
                    "Clan powerups will affect an overall multiplier that will amplify the amount of power points given from the losing clan to\n" +
                    "The effects of powerups can stack despite them being in the same category (for example, a superbuff can stack with a normal buff).\n" +
                    "\n" +
                    "Base multiplier: 0.1\n" +
                    "\n" +
                    "These powerups will amplify the multiplier for the winning clan:\n" +
                    "- Megabuff: `multiplier *= 2.0`\n" +
                    "- Megachallenge: `multiplier *= 1.7`\n" +
                    "- Superbuff: `multiplier *= 1.6`\n" +
                    "- Superchallenge: `multiplier *= 1.3`\n" +
                    "- Buff: `multiplier *= 1.2`\n" +
                    "- Challenge: `multiplier *= 1.05`\n" +
                    "\n" +
                    "These powerups will amplify the multiplier for the losing clan:\n" +
                    "- Megadebuff: `multiplier /= 1.8`\n" +
                    "- Megabomb: `multiplier /= 1.7`\n" +
                    "- Superdebuff: `multiplier /= 1.5`\n" +
                    "- Superbomb: `multiplier /= 1.3`\n" +
                    "- Debuff: `multiplier /= 1.1`\n" +
                    "- Bomb: `multiplier /= 1.05`\n" +
                    "\n" +
                    "`Final points = min(losing clan's power points, floor(losing clan's power points * multiplier))`"
                ],
                [
                    // 25
                    "Stats for nerds",
                    "**Powerup Loot Drop Rate**\n" +
                    "\n" +
                    "When buying powerups from the shop, there is a chance for each powerup to appear:\n" +
                    "- Nothing: 20%\n" +
                    "- Bomb: 30%\n" +
                    "- Challenge: 25%\n" +
                    "- Debuff: 7.5%\n" +
                    "- Buff: 7.5%\n" +
                    "- Superbomb: 4%\n" +
                    "- Superchallenge: 4%\n" +
                    "- Superdebuff: 1%\n" +
                    "- Superbuff: 1%\n" +
                    "\n" +
                    "The mega version of each powerup type can only be obtained through special events."
                ],
                [
                    // 26
                    "Stats for nerds",
                    "**Weekly Upkeep Cost**\n" +
                    "\n" +
                    "As mentioned previously in page 17, the weekly upkeep cost is based on the size of a clan and each clan member's osu!droid rank.\n" +
                    "The weekly upkeep cost has a base of `200`.\n" +
                    "After that, the following formula will be applied for each clan member:\n" +
                    "`f(x) = 500 - 34.74 * ln(x)`\n" +
                    "where *x* is the clan member's current osu!droid rank.\n" +
                    "\n" +
                    "Which means, the final upkeep cost is `200 + f(x1) + f(x2) + f(x3) + ... + f(xn)`\n" +
                    "where *n* is the amount of clan members in a clan."
                ],
                [
                    // 27
                    "A Letter to Moderators",
                    "To help the moderation of clans, all moderators are able to apply these following commands to any clans:\n" +
                    "- `a!clan description clear <clan>`\n" +
                    "- `a!clan demote <user>`\n" +
                    "- `a!clan disband [clan]`\n" +
                    "- `a!clan icon remove <clan>`\n" +
                    "- `a!clan kick <user>`\n" +
                    "- `a!clan match add <user>`\n" +
                    "- `a!clan match remove <user>`\n" +
                    "- `a!clan power give <user> <amount>`\n" +
                    "- `a!clan power take <user> <amount>`\n" +
                    "- `a!clan power transfer <user to take> <user to give> [challenge passed?]`"
                ]
            ];
            let page = 1;
            embed.setTitle(help_array[page - 1][0]).setAuthor("Clans Wiki", "https://image.frl/p/beyefgeq5m7tobjg.jpg").setDescription(help_array[page - 1][1]).setFooter(`Alice Synthesis Thirty | Page ${page}/${help_array.length}`, footer[index]);
            message.channel.send({embed: embed}).then(msg => {
                const collector = message.channel.createMessageCollector(m => m.author.id === message.author.id, {time: 600000});
                collector.on("collect", m => {
                    let page_number = parseInt(m.content);
                    if (isNaN(page_number) || page_number < 1 || page_number > help_array.length) return;
                    m.delete().catch(console.error);
                    page = page_number;
                    embed.setTitle(help_array[page - 1][0]).setDescription(help_array[page - 1][1]).setFooter(`Alice Synthesis Thirty | Page ${page}/${help_array.length}`, footer[index]);
                    msg.edit({embed: embed}).catch(console.error)
                })
            });
            break
        }
        case "info": {
            // view info of a clan
            // ============================
            // if args[1] is not specified,
            // it will search for the user's
            // clan
            query = {discordid: message.author.id};
            binddb.findOne(query, (err, userres) => {
                if (err) {
                    console.log(err);
                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                }
                let clan = userres.clan;
                if (args[1]) clan = args.slice(1).join(" ");
                if (!clan) return message.channel.send("❎ **| I'm sorry, you are currently not in a clan! Please enter a clan name!**");
                query = {name: clan};
                clandb.findOne(query, (err, clanres) => {
                    if (err) {
                        console.log(err);
                        return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                    }
                    if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");
                    let power = clanres.power;
                    let clandate = clanres.createdAt * 1000;
                    let members = clanres.member_list.length;
                    let clanrole = message.guild.roles.cache.find((r) => r.name === clan);
                    if (clanrole) embed.setColor(clanrole.hexColor);
                    embed.setTitle(clan)
                        .addField("Clan Leader", `<@${clanres.leader}>\n(${clanres.leader})`, true)
                        .addField("Power", power.toLocaleString(), true)
                        .addField("Members", members.toLocaleString(), true)
                        .addField("Created at", new Date(clandate).toUTCString());
                    if (clanres.icon) embed.setThumbnail(clanres.icon);
                    if (clanres.description) embed.setDescription(clanres.description);
                    message.channel.send({embed: embed}).catch(console.error);
                })
            });
            cd.add(message.author.id);
            setTimeout(() => {
                cd.delete(message.author.id)
            }, 4000);
            break
        }
        case "members": {
            // view members of a clan
            // =================================
            // not really special, just
            // like other lbs one it uses paging
            let page = 1;
            query = {discordid: message.author.id};
            binddb.findOne(query, (err, userres) => {
                if (err) {
                    console.log(err);
                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                }
                let clan = userres.clan;
                if (args[1]) clan = args.slice(1).join(" ");
                if (!clan) return message.channel.send("❎ **| I'm sorry, you are currently not in a clan! Please enter a clan name!**");
                query = {name: clan};
                clandb.findOne(query, (err, clanres) => {
                    if (err) {
                        console.log(err);
                        return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                    }
                    if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");
                    let clanrole = message.guild.roles.cache.find((r) => r.name === clan);
                    if (clanrole) rolecheck = clanrole.hexColor;
                    let embed = editMember(clanres, page, rolecheck, footer, index);
                    message.channel.send({embed: embed}).then(msg => {
                        msg.react("⏮️").then(() => {
                            msg.react("⬅️").then(() => {
                                msg.react("➡️").then(() => {
                                    msg.react("⏭️").catch(console.error)
                                })
                            })
                        });

                        let backward = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '⏮️' && user.id === message.author.id, {time: 45000});
                        let back = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '⬅️' && user.id === message.author.id, {time: 45000});
                        let next = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '➡️' && user.id === message.author.id, {time: 45000});
                        let forward = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '⏭️' && user.id === message.author.id, {time: 45000});

                        backward.on('collect', () => {
                            if (page === 1) return msg.reactions.cache.forEach((reaction) => reaction.users.remove(message.author.id).catch(console.error));
                            else page = 1;
                            msg.reactions.cache.forEach((reaction) => reaction.users.remove(message.author.id).catch(console.error));
                            embed = editMember(clanres, page, rolecheck, footer, index);
                            msg.edit({embed: embed}).catch(console.error)
                        });

                        back.on('collect', () => {
                            if (page === 1) page = 4;
                            else page--;
                            msg.reactions.cache.forEach((reaction) => reaction.users.remove(message.author.id).catch(console.error));
                            embed = editMember(clanres, page, rolecheck, footer, index);
                            msg.edit({embed: embed}).catch(console.error)
                        });

                        next.on('collect', () => {
                            if (page === 4) page = 1;
                            else page++;
                            msg.reactions.cache.forEach((reaction) => reaction.users.remove(message.author.id).catch(console.error));
                            embed = editMember(clanres, page, rolecheck, footer, index);
                            msg.edit({embed: embed}).catch(console.error);
                        });

                        forward.on('collect', () => {
                            if (page === 4) return msg.reactions.cache.forEach((reaction) => reaction.users.remove(message.author.id).catch(console.error));
                            else page = 4;
                            msg.reactions.cache.forEach((reaction) => reaction.users.remove(message.author.id).catch(console.error));
                            embed = editMember(clanres, page, rolecheck, footer, index);
                            msg.edit({embed: embed}).catch(console.error)
                        });

                        backward.on("end", () => {
                            msg.reactions.cache.forEach((reaction) => reaction.users.remove(message.author.id));
                            msg.reactions.cache.forEach((reaction) => reaction.users.remove(client.user.id))
                        })
                    })
                })
            });
            cd.add(message.author.id);
            setTimeout(() => {
                cd.delete(message.author.id)
            }, 5000);
            break
        }
        case "lb": {
            // views leaderboard of clans based on power points
            // ================================================
            // will be able to specify page
            let page = 0;
            if (parseInt(args[1]) > 0) page = parseInt(args[1]) - 1;
            clandb.find({}, {projection: {_id: 0, name: 1, member_list: 1, power: 1}}).sort({power: -1}).toArray((err, clanres) => {
                if (err) {
                    console.log(err);
                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                }
                if (!clanres[page*20]) return message.channel.send("Nah we don't have that much clan :p");
                let output = editLeaderboard(clanres, page);
                message.channel.send('```c\n' + output + '```').then(msg => {
                    msg.react("⏮️").then(() => {
                        msg.react("⬅️").then(() => {
                            msg.react("➡️").then(() => {
                                msg.react("⏭️").catch(console.error)
                            })
                        })
                    });

                    let backward = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '⏮️' && user.id === message.author.id, {time: 120000});
                    let back = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '⬅️' && user.id === message.author.id, {time: 120000});
                    let next = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '➡️' && user.id === message.author.id, {time: 120000});
                    let forward = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '⏭️' && user.id === message.author.id, {time: 120000});

                    backward.on('collect', () => {
                        page = 0;
                        output = editLeaderboard(clanres, page);
                        msg.edit('```c\n' + output + '```').catch(console.error);
                        msg.reactions.cache.forEach((reaction) => reaction.users.remove(message.author.id).catch(console.error))
                    });

                    back.on('collect', () => {
                        if (page === 0) page = Math.floor(clanres.length / 20);
                        else page--;
                        output = editLeaderboard(clanres, page);
                        msg.edit('```c\n' + output + '```').catch(console.error);
                        msg.reactions.cache.forEach((reaction) => reaction.users.remove(message.author.id).catch(console.error))
                    });

                    next.on('collect', () => {
                        if ((page + 1) * 20 >= clanres.length) page = 0;
                        else page++;
                        output = editLeaderboard(clanres, page);
                        msg.edit('```c\n' + output + '```').catch(console.error);
                        msg.reactions.cache.forEach((reaction) => reaction.users.remove(message.author.id).catch(console.error))
                    });

                    forward.on('collect', () => {
                        page = Math.floor(clanres.length / 20);
                        output = editLeaderboard(clanres, page);
                        msg.edit('```c\n' + output + '```').catch(console.error);
                        msg.reactions.cache.forEach((reaction) => reaction.users.remove(message.author.id).catch(console.error))
                    });

                    backward.on("end", () => {
                        msg.reactions.cache.forEach((reaction) => reaction.users.remove(message.author.id));
                        msg.reactions.cache.forEach((reaction) => reaction.users.remove(client.user.id))
                    })
                })
            });
            cd.add(message.author.id);
            setTimeout(() => {
                cd.delete(message.author.id)
            }, 4000);
            break
        }
        case "upkeep": {
            // views weekly uptime pickup of the user's clan
            // =============================================
            // allows a clan to prepare for their weekly
            // upkeep so that it is not sudden
            query = {discordid: message.author.id};
            binddb.findOne(query, (err, userres) => {
                if (err) {
                    console.log(err);
                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                }
                if (!userres) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                if (!userres.clan) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                let clan = userres.clan;
                query = {name: clan};
                clandb.findOne(query, (err, clanres) => {
                    if (err) {
                        console.log(err);
                        return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                    }
                    if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find your clan!**");
                    let time = timeConvert(clanres.weeklyfee - curtime);
                    message.channel.send(`✅ **| ${message.author}, your clan's weekly upkeep will be picked up in ${time[0] === 0 ? "" : `${time[0] === 1 ? `${time[0]} day` : `${time[0]} days`}`}${time[1] === 0 ? "" : `${time[0] === 0 ? "" : ", "}${time[1] === 1 ? `${time[1]} hour` : `${time[1]} hours`}`}${time[2] === 0 ? "" : `${time[1] === 0 ? "" : ", "}${time[2] === 1 ? `${time[2]} minute` : `${time[2]} minutes`}`}${time[3] === 0 ? "" : `${time[2] === 0 ? "" : ", "}${time[3] === 1 ? `${time[3]} second` : `${time[3]} seconds`}`}.**`)
                })
            });
            cd.add(message.author.id);
            setTimeout(() => {
                cd.delete(message.author.id)
            }, 4000);
            break
        }
        case "accept": {
            let toaccept = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[1]));
            if (!toaccept) return message.channel.send("❎ **| Hey, please enter a correct user!**");
            query = {discordid: message.author.id};
            binddb.findOne(query, (err, userres) => {
                if (err) {
                    console.log(err);
                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                }
                if (!userres) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                if (!userres.clan) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                query = {discordid: toaccept.id};
                binddb.findOne(query, (err, joinres) => {
                    if (err) {
                        console.log(err);
                        return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                    }
                    if (!joinres) return message.channel.send("❎ **| I'm sorry, that account is not binded. He/she/you need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                    if (joinres.clan) return message.channel.send("❎ **| I'm sorry, this user is already in a clan!**");
                    if (!joinres.joincooldown) joinres.joincooldown = 0;
                    let cooldown = joinres.joincooldown - curtime;
                    if (cooldown > 0) {
                        let time = timeConvert(cooldown);
                        return message.channel.send(`❎ **| I'm sorry, that user is still in cooldown! Please wait for ${time[0] === 0 ? "" : `${time[0] === 1 ? `${time[0]} day` : `${time[0]} days`}`}${time[1] === 0 ? "" : `${time[0] === 0 ? "" : ", "}${time[1] === 1 ? `${time[1]} hour` : `${time[1]} hours`}`}${time[2] === 0 ? "" : `${time[1] === 0 ? "" : ", "}${time[2] === 1 ? `${time[2]} minute` : `${time[2]} minutes`}`}${time[3] === 0 ? "" : `${time[2] === 0 ? "" : ", "}${time[3] === 1 ? `${time[3]} second` : `${time[3]} seconds`}`}.**`)
                    }
                    if (!joinres.oldjoincooldown) joinres.oldjoincooldown = 0;
                    let oldcooldown = userres.oldjoincooldown - curtime;
                    if (oldcooldown > 0 && userres.oldclan === joinres.clan) {
                        let time = timeConvert(oldcooldown);
                        return message.channel.send(`❎ **| I'm sorry, that user is still in cooldown! Please wait for ${time[0] === 0 ? "" : `${time[0] === 1 ? `${time[0]} day` : `${time[0]} days`}`}${time[1] === 0 ? "" : `${time[0] === 0 ? "" : ", "}${time[1] === 1 ? `${time[1]} hour` : `${time[1]} hours`}`}${time[2] === 0 ? "" : `${time[1] === 0 ? "" : ", "}${time[2] === 1 ? `${time[2]} minute` : `${time[2]} minutes`}`}${time[3] === 0 ? "" : `${time[2] === 0 ? "" : ", "}${time[3] === 1 ? `${time[3]} second` : `${time[3]} seconds`}`}.**`)
                    }
                    let uid = joinres.uid;
                    query = {name: userres.clan};
                    clandb.findOne(query, (err, clanres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find your clan!**");

                        let memberlist = clanres[0].member_list;
                        let cl_index = memberlist.findIndex(member => member.id === message.author.id);
                        if (!memberlist[cl_index][2]) return message.channel.send("❎ **| I'm sorry, you don't have the permission to use this.**");

                        let member_index = memberlist.findIndex(member => member.id === toaccept.id);
                        if (member_index !== -1) return message.channel.send("❎ **| I'm sorry, this user is already in your clan!**");

                        if (memberlist.length >= 25) return message.channel.send("❎ **| I'm sorry, a clan can only have up to 25 members (including leader)!");

                        message.channel.send(`❗**| ${message.author}, are you sure you want to accept ${toaccept} to your clan?**`).then(msg => {
                            msg.react("✅").catch(console.error);
                            let confirmation = false;
                            let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && (user.id === message.author.id || user.id === toaccept.id), {time: 20000});
                            let confirmbox = [];
                            confirm.on("collect", () => {
                                if (!confirmbox.includes(message.author.id)) confirmbox.push(message.author.id);
                                if (!confirmbox.includes(toaccept.id)) confirmbox.push(toaccept.id);
                                if (confirmbox.length === 2) {
                                    confirmation = true;
                                    msg.delete();
                                    let role = message.guild.roles.cache.find((r) => r.name === 'Clans');
                                    let clanrole = message.guild.roles.cache.find((r) => r.name === userres.clan);
                                    if (clanrole) toaccept.roles.add([role, clanrole], "Accepted into clan").catch(console.error);
                                    memberlist.push({
                                        id: toaccept.id,
                                        uid: uid,
                                        hasPermission: false,
                                        battle_cooldown: curtime + 86400 * 4
                                    });
                                    updateVal = {
                                        $set: {
                                            member_list: memberlist
                                        }
                                    };
                                    clandb.updateOne(query, updateVal, err => {
                                        if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                        console.log("Clan data updated")
                                    });
                                    updateVal = {
                                        $set: {
                                            clan: userres.clan
                                        }
                                    };
                                    binddb.updateOne({discordid: toaccept.id}, updateVal, err => {
                                        if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                        message.channel.send(`✅ **| ${message.author}, successfully accepted ${toaccept} as your clan member.**`);
                                        console.log("User data updated")
                                    })
                                }
                            });
                            confirm.on("end", () => {
                                if (!confirmation) {
                                    msg.delete();
                                    message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                                }
                            })
                        })
                    })
                })
            });
            cd.add(message.author.id);
            setTimeout(() => {
                cd.delete(message.author.id)
            }, 2000);
            break
        }
        case "kick": {
            // kicks a user out of a clan
            // ===============================
            // for now this is only restricted
            // to clan leaders and server mods
            let tokick = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[1]));
            if (!tokick) return message.channel.send("❎ **| Hey, please enter a correct user!**");
            if (message.author.id === tokick.id) return message.channel.send("❎ **| Hey, you cannot kick yourself!**");
            let reason = args.slice(2).join(" ");
            if (!reason) return message.channel.send("❎ **| Hey, please enter a reason!**");
            query = {discordid: tokick.id};
            binddb.findOne(query, (err, kickres) => {
                if (err) {
                    console.log(err);
                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                }
                if (!kickres) return message.channel.send("❎ **| I'm sorry, that account is not binded. He/she/you need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                if (!kickres.clan) return message.channel.send("❎ **| I'm sorry, this user is not in any clan!**");
                let clan = kickres.clan;
                query = {name: clan};
                clandb.findOne(query, (err, clanres) => {
                    if (err) {
                        console.log(err);
                        return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                    }
                    if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");
                    if (tokick.id === clanres.leader) return message.channel.send("❎ **| I'm sorry, you cannot kick the leader of the clan!**");

                    let memberlist = clanres.member_list;
                    let perm_index = memberlist.findIndex(member => member.id === message.author.id);
                    if (!memberlist[perm_index].hasPermission && !perm) return message.channel.send("❎ **| I'm sorry, you don't have permission to do this.**");

                    let member_index = clanres.member_list.findIndex(member => member.id === tokick.id);
                    if (member_index === -1) return message.channel.send("❎ **| I'm sorry, this user is not in your clan!");
                    if (memberlist[member_index].hasPermission && message.author.id !== clanres.leader) return message.channel.send("❎ **| I'm sorry, you cannot kick this clan member!**");

                    message.channel.send(`❗**| ${message.author}, are you sure you want to kick the user out from ${perm?`\`${clan}\``:""} clan?**`).then(msg => {
                        msg.react("✅").catch(console.error);
                        let confirmation = false;
                        let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {time: 20000});
                        confirm.on("collect", () => {
                            confirmation = true;
                            msg.delete();
                            let role = message.guild.roles.cache.find((r) => r.name === 'Clans');
                            let clanrole = message.guild.roles.cache.find((r) => r.name === clan);
                            if (clanrole) tokick.roles.remove([role, clanrole], "Kicked from clan").catch(console.error);
                            updateVal = {
                                $set: {
                                    member_list: memberlist.splice(member_index, 1)
                                }
                            };
                            clandb.updateOne(query, updateVal, err => {
                                if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                console.log("Clan data updated")
                            });
                            updateVal = {
                                $set: {
                                    clan: "",
                                    joincooldown: curtime + 86400 * 3,
                                    oldclan: clan,
                                    oldjoincooldown: curtime + 86400 * 14
                                }
                            };
                            binddb.updateOne({discordid: tokick.id}, updateVal, err => {
                                if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                message.channel.send(`✅ **| ${message.author}, successfully kicked user for ${reason}.**`);
                                console.log("User data updated")
                            })
                        });
                        confirm.on("end", () => {
                            if (!confirmation) {
                                msg.delete();
                                message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                            }
                        })
                    })
                })
            });
            cd.add(message.author.id);
            setTimeout(() => {
                cd.delete(message.author.id)
            }, 2500);
            break
        }
        case "leave": {
            // leaves a clan
            // ======================
            // pretty straightforward
            query = {discordid: message.author.id};
            binddb.findOne(query, (err, userres) => {
                if (err) {
                    console.log(err);
                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                }
                if (!userres) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                if (!userres.clan) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                let clan = userres.clan;
                query = {name: clan};
                clandb.findOne(query, (err, clanres) => {
                    if (err) {
                        console.log(err);
                        return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                    }
                    if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");
                    if (message.author.id === clanres.leader) return message.channel.send("❎ **| I'm sorry, you cannot leave as the leader of the clan!**");
                    message.channel.send(`❗**| ${message.author}, are you sure you want to leave your current clan?**`).then(msg => {
                        msg.react("✅").catch(console.error);
                        let confirmation = false;
                        let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {time: 20000});
                        confirm.on("collect", () => {
                            confirmation = true;
                            msg.delete();
                            let role = message.guild.roles.cache.find((r) => r.name === 'Clans');
                            let clanrole = message.guild.roles.cache.find((r) => r.name === clan);
                            if (clanrole) message.member.roles.remove([role, clanrole], "Left the clan").catch(console.error);
                            let memberlist = clanres.member_list;
                            let member_index = memberlist.findIndex(member => member[0] === message.author.id);
                            memberlist.splice(member_index, 1);
                            updateVal = {
                                $set: {
                                    member_list: memberlist
                                }
                            };
                            clandb.updateOne(query, updateVal, err => {
                                if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                console.log("Clan data updated")
                            });
                            updateVal = {
                                $set: {
                                    clan: "",
                                    joincooldown: curtime + 86400 * 3,
                                    oldclan: clan,
                                    oldjoincooldown: curtime + 86400 * 14
                                }
                            };
                            binddb.updateOne({discordid: message.author.id}, updateVal, err => {
                                if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                message.channel.send(`✅ **| ${message.author}, successfully left \`${clan}\` clan.**`);
                                console.log("User clan data updated")
                            })
                        });
                        confirm.on("end", () => {
                            if (!confirmation) {
                                msg.delete();
                                message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                            }
                        })
                    })
                })
            });
            cd.add(message.author.id);
            setTimeout(() => {
                cd.delete(message.author.id)
            }, 2000);
            break
        }
        case "create": {
            // creates a clan
            // =========================
            // this will use Alice coins
            // as currency
            let clanname = args.slice(1).join(" ");
            if (!clanname) return message.channel.send("❎ **| Hey, can you at least give me a clan name?**");
            if (clanname.length > 20) return message.channel.send("❎ **| I'm sorry, clan names can only be 20 characters long!**");
            query = {discordid: message.author.id};
            binddb.findOne(query, (err, userres) => {
                if (err) {
                    console.log(err);
                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                }
                if (!userres) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                if (userres.clan) return message.channel.send("❎ **| I'm sorry, you are already in a clan!**");
                let uid = userres.uid;
                pointdb.findOne(query, (err, pointres) => {
                    if (err) {
                        console.log(err);
                        return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                    }
                    if (!pointres) return message.channel.send(`❎ **| I'm sorry, you don't have enough ${coin}Alice coins to create a clan! Creating a clan costs ${coin}\`7,500\` Alice coins. You currently have ${coin}\`0\` Alice coins.**`);
                    let alicecoins = pointres.alicecoins;
                    if (alicecoins < 7500) return message.channel.send(`❎ **| I'm sorry, you don't have enough ${coin}Alice coins to create a clan! Creating a clan costs ${coin}\`7,500\` Alice coins. You currently have ${coin}\`${alicecoins}\` Alice coins.**`);
                    query = {name: clanname};
                    clandb.findOne(query, (err, clanres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (clanres) return message.channel.send("❎ **| I'm sorry, that name is already taken by other clan!**");
                        message.channel.send(`❗**| ${message.author}, are you sure you want to create a clan named \`${clanname}\` for ${coin}\`7,500\` Alice coins?**`).then(msg => {
                            msg.react("✅").catch(console.error);
                            let confirmation = false;
                            let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {time: 20000});
                            confirm.on("collect", () => {
                                confirmation = true;
                                msg.delete();
                                query = {discordid: message.author.id};
                                updateVal = {
                                    $set: {
                                        alicecoins: alicecoins - 7500
                                    }
                                };
                                pointdb.updateOne(query, updateVal, err => {
                                    if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                    console.log("User coins data updated")
                                });
                                updateVal = {
                                    $set: {
                                        clan: clanname
                                    }
                                };
                                binddb.updateOne(query, updateVal, err => {
                                    if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                    console.log("User data updated")
                                });
                                insertVal = {
                                    name: clanname,
                                    power: 0,
                                    createdAt: curtime,
                                    leader: message.author.id,
                                    description: "",
                                    icon: "",
                                    iconcooldown: 0,
                                    namecooldown: 0,
                                    weeklyfee: curtime + 86400 * 7,
                                    isMatch: false,
                                    powerups: [
                                        {
                                            name: 'megabuff',
                                            amount: 0
                                        },
                                        {
                                            name: 'megadebuff',
                                            amount: 0
                                        },
                                        {
                                            name: 'megachallenge',
                                            amount: 0
                                        },
                                        {
                                            name: 'megabomb',
                                            amount: 0
                                        },
                                        {
                                            name: 'superbuff',
                                            amount: 0
                                        },
                                        {
                                            name: 'superdebuff',
                                            amount: 0
                                        },
                                        {
                                            name: 'superchallenge',
                                            amount: 0
                                        },
                                        {
                                            name: 'superbomb',
                                            amount: 0
                                        },
                                        {
                                            name: 'buff',
                                            amount: 0
                                        },
                                        {
                                            name: 'debuff',
                                            amount: 0
                                        },
                                        {
                                            name: 'challenge',
                                            amount: 0
                                        },
                                        {
                                            name: 'bomb',
                                            amount: 0
                                        }

                                    ],
                                    active_powerups: [],
                                    member_list: [
                                        {
                                            id: message.author.id,
                                            uid: uid,
                                            hasPermission: true,
                                            battle_cooldown: 0
                                        }
                                    ]
                                };
                                clandb.insertOne(insertVal, err => {
                                    if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                    message.channel.send(`✅ **| ${message.author}, successfully created a clan named \`${clanname}\`. You now have ${coin}\`${(alicecoins - 7500).toLocaleString()}\` Alice coins.**`);
                                    console.log("Clan data added")
                                })
                            });
                            confirm.on("end", () => {
                                if (!confirmation) {
                                    msg.delete();
                                    message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                                }
                            })
                        })
                    })
                })
            });
            cd.add(message.author.id);
            setTimeout(() => {
                cd.delete(message.author.id)
            }, 2500);
            break
        }
        case "description": {
            switch (args[1]) {
                case "clear": {
                    query = {discordid: message.author.id};
                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        let clan;
                        if (perm && args[2]) clan = args[2];
                        else {
                            if (!userres) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                            if (!userres.clan) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                            clan = userres.clan
                        }

                        query = {name: clan};
                        clandb.findOne(query, (err, clanres) => {
                            if (err) {
                                console.log(err);
                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                            }
                            if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");

                            let memberlist = clanres.member_list;
                            let member_index = memberlist.findIndex(member => member.id === message.author.id);
                            if (!perm && !memberlist[member_index].hasPermission) return message.channel.send("❎ **| I'm sorry, you don't have permission to do this.**");

                            message.channel.send(`❗**| ${message.author}, are you sure you want to clear ${perm && args[2] ? `\`${args[2]}\` clan's description` : "your clan's description"}?**`).then(msg => {
                                msg.react("✅").catch(console.error);
                                let confirmation = false;
                                let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {time: 20000});
                                confirm.on("collect", () => {
                                    confirmation = true;
                                    msg.delete();

                                    updateVal = {
                                        $set: {
                                            description: ""
                                        }
                                    };
                                    clandb.updateOne(query, updateVal, err => {
                                        if (err) {
                                            console.log(err);
                                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                                        }
                                        message.channel.send(`✅ **| ${message.author}, successfully cleared ${perm && args[2] ? `\`${args[2]}\` clan's description` : "your clan's description"}.**`)
                                    })
                                });
                                confirm.on("end", () => {
                                    if (!confirmation) {
                                        msg.delete();
                                        message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                                    }
                                })
                            })
                        })
                    });
                    break
                }
                case "edit": {
                    let new_desc = args.slice(2).join(" ");
                    if (!new_desc) return message.channel.send("❎ **| Hey, please enter a new description!**");

                    query = {discordid: message.author.id};
                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!userres) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (!userres.clan) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                        let clan = userres.clan;

                        query = {name: clan};
                        clandb.findOne(query, (err, clanres) => {
                            if (err) {
                                console.log(err);
                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                            }
                            if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");

                            let memberlist = clanres.member_list;
                            let member_index = memberlist.findIndex(member => member.id === message.author.id);
                            let hasPermission = memberlist[member_index].hasPermission;
                            if (!hasPermission) return message.channel.send("❎ **| I'm sorry, you don't have permission to do this.**");

                            if (new_desc === clanres.description) return message.channel.send("❎ **| Hey, your new description is the same as the old description!**");

                            message.channel.send(`❗**| ${message.author}, are you sure you want to change your clan's description?**`).then(msg => {
                                msg.react("✅").catch(console.error);
                                let confirmation = false;
                                let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {time: 20000});
                                confirm.on("collect", () => {
                                    confirmation = true;
                                    msg.delete();

                                    updateVal = {
                                        $set: {
                                            description: new_desc
                                        }
                                    };
                                    clandb.updateOne(query, updateVal, err => {
                                        if (err) {
                                            console.log(err);
                                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                                        }
                                        message.channel.send(`✅ **| ${message.author}, successfully changed your clan's description.**`)
                                    })
                                });
                                confirm.on("end", () => {
                                    if (!confirmation) {
                                        msg.delete();
                                        message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                                    }
                                })
                            })
                        })
                    });
                    break
                }
                default: return message.channel.send("❎ **| I'm sorry, looks like your second argument is invalid! Accepted arguments are `clear` and `edit`.**")
            }
            break
        }
        case "promote": {
            // promotes a clan member to co-leader
            // ==================================================
            // co-leaders can do anything that a leader can
            // except changing clan name, disbanding it, changing
            // role color, and promoting other members
            let topromote = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[1]));
            if (!topromote) return message.channel.send("❎ **| Hey, please mention a valid user to promote!**");
            if (topromote.id === message.author.id) return message.channel.send("❎ **| Hey, you cannot promote yourself!**");

            query = {discordid: message.author.id};
            binddb.findOne(query, (err, userres) => {
                if (err) {
                    console.log(err);
                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                }
                if (!userres) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                if (!userres.clan) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                let clan = userres.clan;

                query = {name: clan};
                clandb.findOne(query, (err, clanres) => {
                    if (err) {
                        console.log(err);
                        return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                    }
                    if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");
                    if (message.author.id !== clanres.leader) return message.channel.send("❎ **| I'm sorry, you don't have permission to do this.**");

                    let member_list = clanres.member_list;
                    let member_index = member_list.findIndex(member => member.id === topromote.id);
                    if (member_index === -1) return message.channel.send("❎ **| I'm sorry, the user is not in your clan!**");
                    if (member_list[member_index].hasPermission) return message.channel.send("❎ **| I'm sorry, this user is already a co-leader!**");
                    member_list[member_index].hasPermission = true;

                    message.channel.send(`❗**| ${message.author}, are you sure you want to promote ${topromote} to co-leader?**`).then(msg => {
                        msg.react("✅").catch(console.error);
                        let confirmation = false;
                        let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {time: 20000});
                        confirm.on("collect", () => {
                            confirmation = true;
                            msg.delete();

                            updateVal = {
                                $set: {
                                    member_list: member_list
                                }
                            };
                            clandb.updateOne(query, updateVal, err => {
                                if (err) {
                                    console.log(err);
                                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                                }
                                message.channel.send(`✅ **| ${message.author}, successfully promoted ${topromote} to co-leader.**`)
                            })
                        });
                        confirm.on("end", () => {
                            if (!confirmation) {
                                msg.delete();
                                message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                            }
                        })
                    })
                })
            });
            break
        }
        case "demote": {
            // demotes a clan member to normal member
            // ======================================
            // moderators can demote a user to normal
            // member despite them being outside the
            // clan
            let todemote = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[1]));
            if (!todemote) return message.channel.send("❎ **| Hey, please mention a valid user to demote!**");
            if (todemote.id === message.author.id) return message.channel.send("❎ **| Hey, you cannot demote yourself!**");

            query = {discordid: todemote.id};
            binddb.findOne(query, (err, userres) => {
                if (err) {
                    console.log(err);
                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                }
                if (!userres) return message.channel.send("❎ **| I'm sorry, that account is not binded. He/she needs to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                if (!userres.clan) return message.channel.send("❎ **| I'm sorry, that user is not in a clan!**");
                let clan = userres.clan;

                query = {name: clan};
                clandb.findOne(query, (err, clanres) => {
                    if (err) {
                        console.log(err);
                        return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                    }
                    if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the user's clan!**");
                    if (!perm && message.author.id !== clanres.leader) return message.channel.send("❎ **| I'm sorry, you don't have permission to do this.**");

                    let member_list = clanres.member_list;
                    let member_index = member_list.findIndex(member => member.id === todemote.id);
                    if (!perm && member_index === -1) return message.channel.send("❎ **| I'm sorry, this user is not in a clan!**");
                    if (!member_list[member_index].hasPermission) return message.channel.send("❎ **| I'm sorry, this user is already a normal member!**");
                    member_list[member_index].hasPermission = false;

                    message.channel.send(`❗**| ${message.author}, are you sure you want to demote ${todemote} to normal member?**`).then(msg => {
                        msg.react("✅").catch(console.error);
                        let confirmation = false;
                        let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {time: 20000});
                        confirm.on("collect", () => {
                            confirmation = true;
                            msg.delete();

                            updateVal = {
                                $set: {
                                    member_list: member_list
                                }
                            };
                            clandb.updateOne(query, updateVal, err => {
                                if (err) {
                                    console.log(err);
                                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                                }
                                message.channel.send(`✅ **| ${message.author}, successfully demoted ${todemote} to normal member.**`)
                            })
                        });
                        confirm.on("end", () => {
                            if (!confirmation) {
                                msg.delete();
                                message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                            }
                        })
                    })
                })
            });
            break
        }
        case "disband": {
            // disbands a clan
            // ===========================
            // restricted for clan leaders
            // and server mods
            query = {discordid: message.author.id};
            binddb.findOne(query, (err, userres) => {
                if (err) {
                    console.log(err);
                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                }
                if (!userres && !perm) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                if (!userres.clan && !perm) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                let clanname = '';
                if (perm) {
                    if (args[1]) clanname = args.slice(1).join(" ");
                    else clanname = userres.clan;
                    if (!clanname) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                }
                else clanname = userres.clan;
                query = {name: clanname};
                clandb.findOne(query, (err, clanres) => {
                    if (err) {
                        console.log(err);
                        return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                    }
                    if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");
                    if (message.author.id !== clanres.leader && !perm) return message.channel.send("❎ **| I'm sorry, you don't have permission to use this.**");
                    message.channel.send(`❗**| ${message.author}, are you sure you want to disband ${perm && args[1]?`\`${clanname}\` clan`:"your clan"}?**`).then(msg => {
                        msg.react("✅").catch(console.error);
                        let confirmation = false;
                        let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {time: 20000});
                        confirm.on("collect", () => {
                            confirmation = true;
                            msg.delete();
                            let clanrole = message.guild.roles.cache.find((r) => r.name === clanname);
                            if (clanrole) {
                                clanrole.delete("Clan disbanded").catch(console.error);
                                let role = message.guild.roles.cache.find((r) => r.name === 'Clans');
                                clanres.member_list.forEach((member) => {
                                    message.guild.members.cache.get(member.id).roles.remove(role, "Clan disbanded").catch(console.error)
                                })
                            }
                            updateVal = {
                                $set: {
                                    clan: ""
                                }
                            };
                            binddb.updateMany({clan: clanname}, updateVal, err => {
                                if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**")
                            });
                            auctiondb.deleteMany({auctioneer: clanname}, err => {
                                if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**")
                            });
                            clandb.deleteOne({name: clanname}, err => {
                                if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                message.channel.send(`✅ **| ${message.author}, successfully disbanded ${perm && args[1]?`a clan named \`${clanname}\``:"your clan"}.**`);
                            })
                        });
                        confirm.on("end", () => {
                            if (!confirmation) {
                                msg.delete();
                                message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                            }
                        })
                    })
                })
            });
            cd.add(message.author.id);
            setTimeout(() => {
                cd.delete(message.author.id)
            }, 2000);
            break
        }
        case "icon": {
            // main hub for clan icons
            // ============================
            // removal of icons is allowed
            // for server mods to filter
            // icons that are contradicting
            // server rules
            switch (args[1]) {
                case "set": {
                    // set icon
                    let icon = args[2];
                    if (!icon) return message.channel.send("❎ **| Hey, I don't know what icon to set!**");
                    if (!icon.includes("http")) return message.channel.send("❎ **| Hey, I think that icon link is invalid!**");
                    query = {discordid: message.author.id};
                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!userres) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (!userres.clan) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                        let clan = userres.clan;
                        query = {name: clan};
                        clandb.findOne(query, (err, clanres) => {
                            if (err) {
                                console.log(err);
                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                            }
                            if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");
                            if (message.author.id !== clanres.leader) return message.channel.send("❎ **| I'm sorry, you don't have permission to do this.**");

                            let memberlist = clanres.member_list;
                            let member_index = memberlist.findIndex(member => member.id === message.author.id);
                            let hasPermission = memberlist[member_index].hasPermission;
                            if (!hasPermission) return message.channel.send("❎ **| I'm sorry, you don't have permission to do this.**");

                            if (clanres.power < 250) return message.channel.send("❎ **| I'm sorry, your clan doesn't have enough power points! You need at least 250!**");
                            let cooldown = clanres.iconcooldown - curtime;
                            if (cooldown > 0) {
                                let time = timeConvert(cooldown);
                                return message.channel.send(`❎ **| I'm sorry, your clan is still in cooldown! Please wait for ${time[0] === 0 ? "" : `${time[0] === 1 ? `${time[0]} day` : `${time[0]} days`}`}${time[1] === 0 ? "" : `${time[0] === 0 ? "" : ", "}${time[1] === 1 ? `${time[1]} hour` : `${time[1]} hours`}`}${time[2] === 0 ? "" : `${time[1] === 0 ? "" : ", "}${time[2] === 1 ? `${time[2]} minute` : `${time[2]} minutes`}`}${time[3] === 0 ? "" : `${time[2] === 0 ? "" : ", "}${time[3] === 1 ? `${time[3]} second` : `${time[3]} seconds`}`}.**`)
                            }
                            message.channel.send(`❗**| ${message.author}, are you sure you want to change your clan icon? You wouldn't be able to change it for 5 minutes!**`).then(msg => {
                                msg.react("✅").catch(console.error);
                                let confirmation = false;
                                let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {time: 20000});
                                confirm.on("collect", () => {
                                    confirmation = true;
                                    msg.delete();
                                    updateVal = {
                                        $set: {
                                            icon: icon,
                                            iconcooldown: curtime + 300
                                        }
                                    };
                                    clandb.updateOne(query, updateVal, err => {
                                        if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                        message.channel.send(`✅ **| ${message.author}, successfully set an icon for your clan.**`);
                                    })
                                });
                                confirm.on("end", () => {
                                    if (!confirmation) {
                                        msg.delete();
                                        message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                                    }
                                })
                            })
                        })
                    });
                    break
                }
                case "remove": {
                    // remove icon
                    query = {discordid: message.author.id};
                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!userres && !perm) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (!userres.clan && !perm) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                        let clan = '';
                        if (perm) {
                            if (args[2]) clan = args.slice(2).join(" ");
                            else clan = userres.clan;
                            if (!clan) return message.channel.send("❎ **| Hey, can you at least give me a clan name?**");
                        } else clan = userres.clan;

                        query = {name: clan};
                        clandb.findOne(query, (err, clanres) => {
                            if (err) {
                                console.log(err);
                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                            }
                            if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");

                            let memberlist = clanres.member_list;
                            let member_index = memberlist.findIndex(member => member.id === message.author.id);
                            let hasPermission = memberlist[member_index].hasPermission;
                            if (!hasPermission) return message.channel.send("❎ **| I'm sorry, you don't have permission to do this.**");

                            message.channel.send(`❗**| ${message.author}, are you sure you want to remove ${perm && args[2]?`\`${clan}\``:"your clan"}'s icon?**`).then(msg => {
                                msg.react("✅").catch(console.error);
                                let confirmation = false;
                                let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {time: 20000});
                                confirm.on("collect", () => {
                                    confirmation = true;
                                    msg.delete();
                                    updateVal = {
                                        $set: {
                                            icon: ""
                                        }
                                    };
                                    clandb.updateOne(query, updateVal, err => {
                                        if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                        message.channel.send(`✅ **| ${message.author}, successfully removed icon from ${perm && args[2]?`\`${clan}\``:"your clan"}.**`);
                                    })
                                });
                                confirm.on("end", () => {
                                    if (!confirmation) {
                                        msg.delete();
                                        message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                                    }
                                })
                            })
                        })
                    });
                    break
                }
                default: return message.channel.send("❎ **| I'm sorry, looks like your second argument is invalid! Accepted arguments are `remove` and `set`.**")
            }
            cd.add(message.author.id);
            setTimeout(() => {
                cd.delete(message.author.id)
            }, 3000);
            break
        }
        case "powerup": {
            // main hub for powerups
            // ===============================
            // options to buy, activate, and view currently
            // active and owned powerup will be in this subcommand
            switch (args[1]) {
                case "list": {
                    // views current powerups of the user's clan
                    query = {discordid: message.author.id};
                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!userres) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (!userres.clan) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                        let clan = userres.clan;
                        query = {name: clan};
                        clandb.findOne(query, (err, clanres) => {
                            if (err) {
                                console.log(err);
                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                            }
                            if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");
                            let powerups = clanres.powerups;
                            embed.setTitle(`Current owned powerups by ${clan}`);
                            for (let i = 0; i < powerups.length; i++) embed.addField(capitalizeString(powerups[i].name), powerups[i].amount);
                            message.channel.send({embed: embed}).catch(console.error)
                        })
                    });
                    break
                }
                case "activelist": {
                    // views current active powerups of the user's clan
                    query = {discordid: message.author.id};
                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!userres) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (!userres.clan) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                        let clan = userres.clan;
                        query = {name: clan};
                        clandb.findOne(query, (err, clanres) => {
                            if (err) {
                                console.log(err);
                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                            }
                            if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");
                            let activepowerups = clanres.active_powerups;
                            if (activepowerups.length === 0) return message.channel.send(`❎ **| I'm sorry, \`${clan}\` clan does not have any powerups active!**`);
                            embed.setTitle(`Current active powerups for ${clan}`);
                            let description_string = '';
                            for (let i = 0; i < activepowerups.length; i++) description_string += `**${i+1}. ${capitalizeString(activepowerups[i])}**\n`;
                            embed.setDescription(description_string);
                            message.channel.send({embed: embed}).catch(console.error)
                        })
                    });
                    break
                }
                case "activate": {
                    // activates a powerup
                    // ===============================
                    // can only be done by clan leader
                    let powertype = args[2];
                    if (!powertype) return message.channel.send("❎ **| Hey, I don't know what powerup to activate!**");
                    powertype.toLowerCase();
                    query = {discordid: message.author.id};
                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!userres) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (!userres.clan) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                        let clan = userres.clan;
                        query = {name: clan};
                        clandb.findOne(query, (err, clanres) => {
                            if (err) {
                                console.log(err);
                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                            }
                            if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");

                            let memberlist = clanres.member_list;
                            let member_index = memberlist.findIndex(member => member.id === message.author.id);
                            let hasPermission = memberlist[member_index].hasPermission;
                            if (!hasPermission) return message.channel.send("❎ **| I'm sorry, you don't have permission to do this.**");

                            if (clanres.isMatch) return message.channel.send("❎ **| I'm sorry, your clan is currently in match mode, therefore you cannot activate powerups!**");
                            let powerups = clanres.powerups;
                            let activepowerups = clanres.active_powerups;
                            let powerup_index = powerups.findIndex(powerup => powerup.name === powertype);
                            if (powerup_index === -1) return message.channel.send("❎ **| I'm sorry, I cannot find the powerup type you are looking for!**");

                            if (powerups[powerup_index].amount === 0) return message.channel.send(`❎ **| I'm sorry, your clan doesn't have any \`${powertype}\` powerups! To view your clan's currently owned powerups, use \`a!clan powerup view\`.**`);
                            --powerups[powerup_index].amount;
                            let powercount = powerups[powerup_index].amount;

                            if (activepowerups.includes(powertype)) return message.channel.send(`❎ **| I'm sorry, your clan currently has an active \`${powertype}\` powerup!**`);
                            message.channel.send(`❗**| ${message.author}, are you sure you want to activate \`${powertype}\` powerup for your clan?**`).then(msg => {
                                msg.react("✅").catch(console.error);
                                let confirmation = false;
                                let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {time: 20000});
                                confirm.on("collect", () => {
                                    confirmation = true;
                                    msg.delete();
                                    activepowerups.push(powertype);
                                    updateVal = {
                                        $set: {
                                            powerups: powerups,
                                            active_powerups: activepowerups
                                        }
                                    };
                                    clandb.updateOne(query, updateVal, err => {
                                        if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                        message.channel.send(`✅ **| ${message.author}, successfully activated \`${powertype}\` powerup for your clan. Your clan now has \`${powercount.toLocaleString()}\` remaining ${powertype} powerups.**`)
                                    })
                                });
                                confirm.on("end", () => {
                                    if (!confirmation) {
                                        msg.delete();
                                        message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                                    }
                                })
                            })
                        })
                    });
                    break
                }
                default: return message.channel.send("❎ **| I'm sorry, looks like your second argument is invalid! Accepted arguments are `activelist`, `activate`, and `list`.**")
            }
            cd.add(message.author.id);
            setTimeout(() => {
                cd.delete(message.author.id)
            }, 3000);
            break
        }
        case "shop": {
            // main hub for clan shops
            // ===========================================
            // players can buy clan name change, custom role,
            // clan color change, powerups, etc in here, specified by
            // args[1]. also uses alice coins as currency
            switch (args[1]) {
                case "rename": {
                    // changes the clan name
                    // ============================================
                    // only works for clan leaders, mods can disband
                    // clans with inappropriate names
                    let newname = args.slice(2).join(" ");
                    if (!newname) return message.channel.send("❎ **| Hey, give me a new name for your clan!**");
                    query = {discordid: message.author.id};
                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!userres) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (!userres.clan) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                        let clan = userres.clan;
                        pointdb.findOne(query, (err, pointres) => {
                            if (err) {
                                console.log(err);
                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                            }
                            if (!pointres) return message.channel.send(`❎ **| I'm sorry, you don't have enough ${coin}Alice coins to buy a clan name change! A clan name change costs ${coin}\`2,500\` Alice coins. You currently have ${coin}\`0\` Alice coins.**`);
                            let alicecoins = pointres.alicecoins;
                            if (alicecoins < 2500) return message.channel.send(`❎ **| I'm sorry, you don't have enough ${coin}Alice coins to buy a clan name change! A clan name change costs ${coin}\`2,500\` Alice coins. You currently have ${coin}\`${alicecoins.toLocaleString()}\` Alice coins.**`);
                            query = {name: clan};
                            clandb.findOne(query, (err, clanres) => {
                                if (err) {
                                    console.log(err);
                                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                                }
                                if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");
                                if (message.author.id !== clanres.leader) return message.channel.send("❎ **| I'm sorry, you don't have permission to do this.**");
                                if (clanres.power < 500) return message.channel.send("❎ **| I'm sorry, your clan doesn't have enough power points! You need at least 500!**");
                                let cooldown = clanres.namecooldown - curtime;
                                if (cooldown > 0) {
                                    let time = timeConvert(cooldown);
                                    return message.channel.send(`❎ **| I'm sorry, your clan is still in cooldown! Please wait for ${time[0] === 0 ? "" : `${time[0] === 1 ? `${time[0]} day` : `${time[0]} days`}`}${time[1] === 0 ? "" : `${time[0] === 0 ? "" : ", "}${time[1] === 1 ? `${time[1]} hour` : `${time[1]} hours`}`}${time[2] === 0 ? "" : `${time[1] === 0 ? "" : ", "}${time[2] === 1 ? `${time[2]} minute` : `${time[2]} minutes`}`}${time[3] === 0 ? "" : `${time[2] === 0 ? "" : ", "}${time[3] === 1 ? `${time[3]} second` : `${time[3]} seconds`}`}**`)
                                }
                                message.channel.send(`❗**| ${message.author}, are you sure you want to change your clan name to \`${newname}\` for ${coin}\`2,500\` Alice coins? You wouldn't be able to change it again for 3 days!**`).then(msg => {
                                    msg.react("✅").catch(console.error);
                                    let confirmation = false;
                                    let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {time: 20000});
                                    confirm.on("collect", () => {
                                        confirmation = true;
                                        msg.delete();
                                        let clanrole = message.guild.roles.cache.find(r => r.name === clan);
                                        if (clanrole) clanrole.setName(newname, "Changed clan name").catch(console.error);
                                        updateVal = {
                                            $set: {
                                                clan: newname
                                            }
                                        };
                                        binddb.updateMany({clan: clan}, updateVal, err => {
                                            if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**")
                                        });
                                        updateVal = {
                                            $set: {
                                                name: newname,
                                                namecooldown: curtime + 86400 * 3
                                            }
                                        };
                                        clandb.updateOne(query, updateVal, err => {
                                            if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                            message.channel.send(`✅ **| ${message.author}, successfully changed your clan name to \`${newname}\`. You now have ${coin}\`${(alicecoins - 2500).toLocaleString()}\` Alice coins.**`);
                                        });
                                        updateVal = {
                                            $set: {
                                                alicecoins: alicecoins - 2500
                                            }
                                        };
                                        pointdb.updateOne({discordid: message.author.id}, updateVal, err => {
                                            if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**")
                                        })
                                    });
                                    confirm.on("end", () => {
                                        if (!confirmation) {
                                            msg.delete();
                                            message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                                        }
                                    })
                                })
                            })
                        })
                    });
                    break
                }
                case "role": {
                    // buy a custom role for clan members
                    // =======================================
                    // the custom role will be the clan's name
                    // to make it easier for moderators to
                    // moderate clan names, only works for leaders
                    query = {discordid: message.author.id};
                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!userres) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (!userres.clan) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                        let clan = userres.clan;
                        pointdb.findOne(query, (err, pointres) => {
                            if (!pointres) return message.channel.send(`❎ **| I'm sorry, you don't have enough ${coin}Alice coins to buy a custom role for your clan! A custom role costs ${coin}\`5,000\` Alice coins. You currently have ${coin}\`0\` Alice coins.**`);
                            let alicecoins = pointres.alicecoins;
                            if (alicecoins < 5000) return message.channel.send(`❎ **| I'm sorry, you don't have enough ${coin}Alice coins to buy a custom role for your clan! A custom role costs ${coin}\`5,000\` Alice coins. You currently have ${coin}\`${alicecoins}\` Alice coins.**`);
                            query = {name: clan};
                            clandb.findOne(query, (err, clanres) => {
                                if (err) {
                                    console.log(err);
                                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                                }
                                if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");
                                if (message.author.id !== clanres.leader) return message.channel.send("❎ **| I'm sorry, you don't have permission to do this.**");
                                if (clanres.power < 2000) return message.channel.send("❎ **| I'm sorry, your clan doesn't have enough power points! You need at least 2000!**");
                                let memberlist = clanres.member_list;
                                message.channel.send(`❗**| ${message.author}, are you sure you want to buy a custom clan role for ${coin}\`5,000\` Alice coins?**`).then(msg => {
                                    msg.react("✅").catch(console.error);
                                    let confirmation = false;
                                    let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {time: 20000});
                                    confirm.on("collect", () => {
                                        confirmation = true;
                                        msg.delete();
                                        let clanrole = message.guild.roles.cache.find((r) => r.name === 'Clans');
                                        message.guild.roles.create({data: {
                                            name: clan,
                                            color: "DEFAULT",
                                            permissions: [],
                                            position: clanrole.position - 1
                                        }, reason: "Clan leader bought clan role"}).then(role => {
                                            memberlist.forEach((id) => {
                                                message.guild.members.cache.get(id[0]).roles.add([clanrole, role], "Clan leader bought clan role").catch(console.error)
                                            })
                                        }).catch(console.error);
                                        updateVal = {
                                            $set: {
                                                alicecoins: alicecoins - 5000
                                            }
                                        };
                                        pointdb.updateOne({discordid: message.author.id}, updateVal, err => {
                                            if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                            message.channel.send(`✅ **| ${message.author}, successfully bought clan role for your clan. You now have ${coin}\`${(alicecoins - 5000).toLocaleString()}\` Alice coins.**`)
                                        })
                                    });
                                    confirm.on("end", () => {
                                        if (!confirmation) {
                                            msg.delete();
                                            message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                                        }
                                    })
                                })
                            })
                        })
                    });
                    break
                }
                case "color": {
                    // changes clan role color if one is available
                    // ===========================================
                    // does not affect embed message colors, only
                    // affects clan role color and only supports
                    // integer color format
                    let color = args[2];
                    if (!(/^#[0-9A-F]{6}$/i.test(color))) return message.channel.send("❎ **| I'm sorry, that does not look like a valid hex color!**");
                    query = {discordid: message.author.id};
                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!userres) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (!userres.clan) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                        let clan = userres.clan;
                        let clanrole = message.guild.roles.cache.find((r) => r.name === clan);
                        if (!clanrole) return message.channel.send("❎ **| I'm sorry, your clan doesn't have a custom clan role!**");
                        pointdb.findOne(query, (err, pointres) => {
                            if (!pointres) return message.channel.send(`❎ **| I'm sorry, you don't have enough ${coin}Alice coins to change your clan's custom role color! A role color change costs ${coin}\`500\` Alice coins. You currently have ${coin}\`0\` Alice coins.**`);
                            let alicecoins = pointres.alicecoins;
                            if (alicecoins < 500) return message.channel.send(`❎ **| I'm sorry, you don't have enough ${coin}Alice coins to buy a custom role for your clan! A role color change costs ${coin}\`500\` Alice coins. You currently have ${coin}\`${alicecoins}\` Alice coins.**`);
                            query = {name: clan};
                            clandb.findOne(query, (err, clanres) => {
                                if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");
                                if (message.author.id !== clanres.leader) return message.channel.send("❎ **| I'm sorry, you don't have permission to do this.**");
                                message.channel.send(`❗**| ${message.author}, are you sure you want to buy a clan role color change for ${coin}\`500\` Alice coins?**`).then(msg => {
                                    msg.react("✅").catch(console.error);
                                    let confirmation = false;
                                    let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {time: 20000});
                                    confirm.on("collect", () => {
                                        confirmation = true;
                                        msg.delete();
                                        clanrole.setColor(parseInt(color), "Clan leader changed role color").catch(console.error);
                                        updateVal = {
                                            $set: {
                                                alicecoins: alicecoins - 500
                                            }
                                        };
                                        pointdb.updateOne({discordid: message.author.id}, updateVal, err => {
                                            if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                            message.channel.send(`✅ **| Successfully changed clan role color. You now have ${coin}\`${(alicecoins - 500).toLocaleString()}\` Alice coins.**`)
                                        })
                                    });
                                    confirm.on("end", () => {
                                        if (!confirmation) {
                                            msg.delete();
                                            message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                                        }
                                    })
                                })
                            })
                        })
                    });
                    break
                }
                case "powerup": {
                    // buy powerups with Alice coins
                    // =============================
                    // lootbox (gacha) style
                    query = {discordid: message.author.id};
                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!userres) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (!userres.clan) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                        let clan = userres.clan;
                        pointdb.findOne(query, (err, pointres) => {
                            if (err) {
                                console.log(err);
                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                            }
                            if (!pointres) return message.channel.send(`❎ **| I'm sorry, you don't have enough ${coin}Alice coins to buy a powerup! A powerup costs ${coin}\`100\` Alice coins. You currently have ${coin}\`0\` Alice coins.**`);
                            let alicecoins = pointres.alicecoins;
                            if (alicecoins < 100) return message.channel.send(`❎ **| I'm sorry, you don't have enough ${coin}Alice coins to buy a powerup! A powerup costs ${coin}\`100\` Alice coins. You currently have ${coin}\`${alicecoins}\` Alice coins.**`);
                            query = {name: clan};
                            clandb.findOne(query, (err, clanres) => {
                                if (err) {
                                    console.log(err);
                                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                                }
                                if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");
                                let powerups = clanres.powerups;
                                message.channel.send(`❗**| ${message.author}, are you sure you want to buy a powerup for ${coin}\`100\` Alice coins?**`).then(msg => {
                                    msg.react("✅").catch(console.error);
                                    let confirmation = false;
                                    let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {time: 20000});
                                    confirm.on("collect", () => {
                                        confirmation = true;
                                        msg.delete();
                                        const gachanum = Math.random() * 100;
                                        let powerup = false;
                                        if (gachanum > 20) {
                                            switch (true) {
                                                case (gachanum <= 50): { // 20% chance of not getting anything
                                                    powerup = "bomb"; // 30% chance
                                                    break
                                                }
                                                case (gachanum <= 75): {
                                                    powerup = "challenge"; // 25% chance
                                                    break
                                                }
                                                case (gachanum <= 82.5): {
                                                    powerup = "debuff"; // 7.5% chance
                                                    break
                                                }
                                                case (gachanum <= 90): {
                                                    powerup = "buff"; // 7.5% chance
                                                    break
                                                }
                                                case (gachanum <= 94): {
                                                    powerup = "superbomb"; // 4% chance
                                                    break
                                                }
                                                case (gachanum <= 98): {
                                                    powerup = "superchallenge"; // 4% chance
                                                    break
                                                }
                                                case (gachanum <= 99): {
                                                    powerup = "superdebuff"; // 1% chance
                                                    break
                                                }
                                                case (gachanum <= 100): {
                                                    powerup = "buff" // 1% chance
                                                }
                                            }
                                        }
                                        // reserved for special events
                                        /*if (gachanum > 20) {
                                            switch (true) {
                                                case (gachanum <= 50): { // 20% chance of not getting anything
                                                    powerup = "bomb"; // 30% chance
                                                    break
                                                }
                                                case (gachanum <= 75): {
                                                    powerup = "challenge"; // 25% chance
                                                    break
                                                }
                                                case (gachanum <= 82.5): {
                                                    powerup = "debuff"; // 7.5% chance
                                                    break
                                                }
                                                case (gachanum <= 90): {
                                                    powerup = "buff"; // 7.5% chance
                                                    break
                                                }
                                                case (gachanum <= 94): {
                                                    powerup = "superbomb"; // 4% chance
                                                    break
                                                }
                                                case (gachanum <= 98): {
                                                    powerup = "superchallenge"; // 4% chance
                                                    break
                                                }
                                                case (gachanum <= 99): {
                                                    powerup = "superdebuff"; // 1% chance
                                                    break
                                                }
                                                case (gachanum <= 100): {
                                                    powerup = "buff" // 1% chance
                                                }
                                            }
                                        }*/
                                        if (!powerup) {
                                            message.channel.send(`✅ **| ${message.author}, unfortunately you didn't get anything! You now have ${coin}\`${(alicecoins - 100).toLocaleString()}\` Alice coins.**`);
                                            updateVal = {
                                                $set: {
                                                    alicecoins: alicecoins - 100
                                                }
                                            };
                                            pointdb.updateOne({discordid: message.author.id}, updateVal, err => {
                                                if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**")
                                            });
                                            return
                                        }
                                        let powerup_index = powerups.findIndex(pow => pow.name === powerup);
                                        ++powerups[powerup_index].amount;
                                        let powercount = powerups[powerup_index].amount;
                                        updateVal = {
                                            $set: {
                                                powerups: powerups
                                            }
                                        };
                                        clandb.updateOne(query, updateVal, err => {
                                            if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                            message.channel.send(`✅ **| ${message.author}, you have earned the \`${powerup}\` powerup! Your clan now has \`${powercount.toLocaleString()}\` ${powerup} ${powercount === 1 ? "powerup" : "powerups"}. You now have ${coin}\`${(alicecoins - 100).toLocaleString()}\` Alice coins.**`);
                                        });
                                        updateVal = {
                                            $set: {
                                                alicecoins: alicecoins - 100
                                            }
                                        };
                                        pointdb.updateOne({discordid: message.author.id}, updateVal, err => {
                                            if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**")
                                        })
                                    });
                                    confirm.on("end", () => {
                                        if (!confirmation) {
                                            msg.delete();
                                            message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                                        }
                                    })
                                })
                            })
                        })
                    });
                    break
                }
                case "leader": {
                    // changes the leader of a clan
                    // ============================
                    // only works for clan leaders
                    let totransfer = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[2]));
                    if (!totransfer) return message.channel.send("❎ **| Hey, please enter a valid user to transfer the clan leadership to!**");
                    query = {discordid: message.author.id};
                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!userres) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (!userres.clan) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                        let clan = userres.clan;
                        pointdb.findOne(query, (err, pointres) => {
                            if (err) {
                                console.log(err);
                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                            }
                            if (!pointres) return message.channel.send(`❎ **| I'm sorry, you don't have enough ${coin}Alice coins to transfer clan leadership! A clan leadership transfer costs ${coin}\`500\` Alice coins. You currently have ${coin}\`0\` Alice coins.**`);
                            let alicecoins = pointres.alicecoins;
                            if (alicecoins < 500) return message.channel.send(`❎ **| I'm sorry, you don't have enough ${coin}Alice coins to transfer clan leadership! A clan leadership transfer costs ${coin}\`500\` Alice coins. You currently have ${coin}\`${alicecoins}\` Alice coins.**`);
                            query = {name: clan};
                            clandb.findOne(query, (err, clanres) => {
                                if (err) {
                                    console.log(err);
                                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                                }
                                if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");
                                if (message.author.id !== clanres.leader) return message.channel.send("❎ **| I'm sorry, you don't have permission to do this.**");
                                if (message.author.id === totransfer.id) return message.channel.send("❎ **| You cannot transfer clan leadership to yourself!**");
                                let memberlist = clanres.member_list;
                                if (memberlist.length === 1) return message.channel.send("❎ **| I'm sorry, looks like you are alone in your clan! Who would you transfer leadership to?**");
                                if (clanres.power < 300) return message.channel.send("❎ **| I'm sorry, your clan doesn't have enough power points! You need at least 300!**");

                                let member_index = memberlist.findIndex(member => member.id === totransfer.id);
                                if (member_index === -1) return message.channel.send("❎ **| I'm sorry, this user is not in your clan!");

                                message.channel.send(`❗**| ${message.author}, are you sure you want to transfer clan leadership to ${totransfer} for ${coin}\`500\` Alice coins?**`).then(msg => {
                                    msg.react("✅").catch(console.error);
                                    let confirmation = false;
                                    let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {time: 20000});
                                    confirm.on("collect", () => {
                                        confirmation = true;
                                        msg.delete();

                                        memberlist[member_index].hasPermission = true;
                                        updateVal = {
                                            $set: {
                                                leader: totransfer.id,
                                                member_list: memberlist
                                            }
                                        };
                                        clandb.updateOne(query, updateVal, err => {
                                            if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                            message.channel.send(`✅ **| ${message.author}, successfully transfered clan leadership to ${totransfer}. You now have ${coin}\`${(alicecoins - 500).toLocaleString()}\` Alice coins.**`)
                                        });
                                        updateVal = {
                                            $set: {
                                                alicecoins: alicecoins - 500
                                            }
                                        };
                                        pointdb.updateOne({discordid: message.author.id}, updateVal, err => {
                                            if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**")
                                        })
                                    });
                                    confirm.on("end", () => {
                                        if (!confirmation) {
                                            msg.delete();
                                            message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                                        }
                                    })
                                })
                            })
                        })
                    });
                    break
                }
                default: return message.channel.send("❎ **| I'm sorry, looks like your second argument is invalid! Accepted arguments are `color`, `leader`, `powerup`, `rename`, `role`, and `special`.**")
            }
            cd.add(message.author.id);
            setTimeout(() => {
                cd.delete(message.author.id)
            }, 3000);
            break
        }
        case "power": {
            // main hub for power points
            // ==============================
            // gives pp if match commence, also
            // based on active powerups
            if ((message.member.roles == null || !message.member.roles.cache.find((r) => r.name === 'Referee')) && !perm) return message.channel.send("❎ **| I'm sorry, you don't have permission to do this.**");
            switch (args[1]) {
                case "give": {
                    // adds power points to a clan
                    // =======================================
                    // this must be carefully watched as abuse
                    // can be easily done
                    let togive = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[2]));
                    if (!togive) return message.channel.send("❎ **| Hey, please give me a valid user to give power points to!**");
                    let amount = args[3];
                    if (!amount) return message.channel.send("❎ **| Hey, I don't know how many points do I need to add!**");
                    amount = parseInt(amount);
                    if (isNaN(amount) || amount <= 0) return message.channel.send("❎ **| Invalid amount to add.**");
                    query = {discordid: togive.id};
                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!userres) return message.channel.send("❎ **| I'm sorry, that account is not binded. He/she/you need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (!userres.clan) return message.channel.send("❎ **| I'm sorry, that user is not in a clan!**");
                        let clan = userres.clan;
                        query = {name: clan};
                        clandb.findOne(query, (err, clanres) => {
                            if (err) {
                                console.log(err);
                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                            }
                            if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");
                            let newpower = clanres.power + amount;
                            updateVal = {
                                $set: {
                                    power: newpower
                                }
                            };
                            clandb.updateOne(query, updateVal, err => {
                                if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                message.channel.send(`✅ **| ${message.author}, successfully given \`${amount.toLocaleString()}\` power points to \`${clan}\` clan. The clan now has \`${newpower.toLocaleString()}\` power points.**`)
                            })
                        })
                    });
                    break
                }
                case "take": {
                    // removes power points from a clan
                    // =========================================
                    // just like add cmd, this must be carefully
                    // watched as abuse can be easily done
                    let totake = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[2]));
                    if (!totake) return message.channel.send("❎ **| Hey, please give me a valid user to take power points from!**");
                    let amount = args[3];
                    if (!amount) return message.channel.send("❎ **| Hey, I don't know how many points do I need to remove!**");
                    amount = parseInt(amount);
                    if (isNaN(amount) || amount <= 0) return message.channel.send("❎ **| Invalid amount to remove.**");
                    query = {discordid: totake.id};
                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!userres) return message.channel.send("❎ **| I'm sorry, that account is not binded. He/she/you need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (!userres.clan) return message.channel.send("❎ **| I'm sorry, that user is not in a clan!**");
                        let clan = userres.clan;
                        query = {name: clan};
                        clandb.findOne(query, (err, clanres) => {
                            if (err) {
                                console.log(err);
                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                            }
                            if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");
                            let newpower = clanres.power - amount;
                            if (newpower < 0) return message.channel.send("❎ **| I'm sorry, this clan doesn't have as many power points as the amount you mentioned!**");
                            updateVal = {
                                $set: {
                                    power: newpower
                                }
                            };
                            clandb.updateOne(query, updateVal, err => {
                                if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                message.channel.send(`✅ **| ${message.author}, successfully taken \`${amount.toLocaleString()}\` power points from \`${clan}\` clan. The clan now has \`${newpower.toLocaleString()}\` power points.**`)
                            })
                        })
                    });
                    break
                }
                case "transfer": {
                    // transfers power points from one clan to another
                    // =======================================================
                    // main cmd to use during clan matches, will automatically
                    // convert total power points based on active powerups
                    if (args.length < 4) return message.channel.send("❎ **| Hey, I need more input!**");
                    let totake = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[2]));
                    if (!totake) return message.channel.send("❎ **| Hey, please give me a valid user to take power points from!**");
                    let togive = message.guild.member(message.mentions.users.last() || message.guild.members.cache.get(args[3]));
                    if (totake.id === togive.id) return message.channel.send("❎ **| Hey, you cannot transfer power points to the same user!**");
                    let challengepass = args[4];
                    query = {discordid: totake.id};
                    binddb.findOne(query, (err, takeres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!takeres) return message.channel.send("❎ **| I'm sorry, the account to take power points from is not binded. He/she/you need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (!takeres.clan) return message.channel.send("❎ **| I'm sorry, the user to take is not in a clan!**");
                        let takeclan = takeres.clan;
                        query = {discordid: togive.id};
                        binddb.findOne(query, (err, giveres) => {
                            if (err) {
                                console.log(err);
                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                            }
                            if (!giveres) return message.channel.send("❎ **| I'm sorry, the account to give power points to is not binded. He/she/you need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                            if (!giveres.clan) return message.channel.send("❎ **| I'm sorry, the user to give is not in a clan!**");
                            let giveclan = giveres.clan;
                            if (takeclan === giveclan) return message.channel.send("❎ **| Hey, you cannot transfer power points to the same clan!**");
                            query = {name: takeclan};
                            clandb.findOne(query, (err, tclanres) => {
                                if (err) {
                                    console.log(err);
                                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                                }
                                if (!tclanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan to take power points from!**");
                                if (!tclanres.isMatch) return message.channel.send("❎ **| I'm sorry, the clan to take power points from is not in match mode!**");
                                let t_power = tclanres.power;
                                let t_activepowerups = tclanres.active_powerups;
                                let givemultiplier = 0.1;
                                for (let i = 0; i < t_activepowerups.length; i++) {
                                    switch (t_activepowerups[i]) {
                                        case "megadebuff": {
                                            message.channel.send(`⬇️⬇️ **| \`${takeclan}\` has \`megadebuff\` powerup active!**`);
                                            givemultiplier /= 1.8;
                                            break
                                        }
                                        case "megabomb": {
                                            message.channel.send(`⬇️ **| \`${takeclan}\` has \`megabomb\` powerup active${!challengepass?"":", but unfortunately their opponents have accomplished the task provided"}!**`);
                                            if (!challengepass) givemultiplier /= 1.7;
                                            break
                                        }
                                        case "superdebuff": {
                                            message.channel.send(`⬇️⬇️ **| \`${takeclan}\` has \`superdebuff\` powerup active!**`);
                                            givemultiplier /= 1.5;
                                            break
                                        }
                                        case "superbomb": {
                                            message.channel.send(`⬇️ **| \`${takeclan}\` has \`superbomb\` powerup active${!challengepass?"":", but unfortunately their opponents have accomplished the task provided"}!**`);
                                            if (!challengepass) givemultiplier /= 1.3;
                                            break
                                        }
                                        case "debuff": {
                                            givemultiplier /= 1.1;
                                            break
                                        }
                                        case "bomb": {
                                            if (!challengepass) givemultiplier /= 1.05;
                                            break
                                        }
                                    }
                                }
                                query = {name: giveclan};
                                clandb.findOne(query, (err, gclanres) => {
                                    if (err) {
                                        console.log(err);
                                        return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                                    }
                                    if (!gclanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan to give power points to!**");
                                    if (!gclanres.isMatch) return message.channel.send("❎ **| I'm sorry, the clan to give power points to is not in match mode!**");
                                    let g_power = gclanres.power;
                                    let g_activepowerups = gclanres.active_powerups;
                                    for (let i = 0; i < g_activepowerups.length; i++) {
                                        switch (g_activepowerups[i]) {
                                            case "megabuff": {
                                                message.channel.send(`⬆️⬆️ **| \`${giveclan}\` has \`megabuff\` powerup active!**`);
                                                givemultiplier *= 2.0;
                                                break
                                            }
                                            case "megachallenge": {
                                                message.channel.send(`⬆️ **| \`${giveclan}\` has \`megachallenge\` powerup active${challengepass?"":", but unfortunately they did not accomplish the task provided"}!**`);
                                                if (challengepass) givemultiplier *= 1.7;
                                                break
                                            }
                                            case "superbuff": {
                                                message.channel.send(`⬆️⬆️ **| \`${giveclan}\` has \`superbuff\` powerup active!**`);
                                                givemultiplier *= 1.6;
                                                break
                                            }
                                            case "superchallenge": {
                                                message.channel.send(`⬆️ **| \`${giveclan}\` has \`superchallenge\` powerup active${challengepass?"":", but unfortunately they did not accomplish the task provided"}!**`);
                                                if (challengepass) givemultiplier *= 1.3;
                                                break
                                            }
                                            case "buff": {
                                                givemultiplier *= 1.2;
                                                break
                                            }
                                            case "challenge": {
                                                if (challengepass) givemultiplier *= 1.05;
                                                break
                                            }
                                        }
                                    }
                                    let totalpower = Math.min(t_power, Math.floor(t_power * givemultiplier));
                                    message.channel.send(`❗**| ${message.author}, are you sure you want to transfer \`${totalpower.toLocaleString()}\` power points from \`${takeclan}\` clan to \`${giveclan}\` clan?**`).then(msg => {
                                        msg.react("✅").catch(console.error);
                                        let confirmation = false;
                                        let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {time: 20000});
                                        confirm.on("collect", () => {
                                            confirmation = true;
                                            msg.delete();

                                            let t_memberlist = tclanres.member_list;
                                            let t_member_index = t_memberlist.findIndex(member => member.id === totake.id);
                                            t_memberlist[t_member_index].battle_cooldown = curtime + 86400 * 4;

                                            updateVal = {
                                                $set: {
                                                    power: t_power - totalpower,
                                                    isMatch: false,
                                                    active_powerups: [],
                                                    member_list: t_memberlist
                                                }
                                            };
                                            clandb.updateOne({name: takeclan}, updateVal, err => {
                                                if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**")
                                            });

                                            let g_memberlist = gclanres.member_list;
                                            let g_member_index = g_memberlist.findIndex(member => member.id === togive.id);
                                            g_memberlist[g_member_index].battle_cooldown = curtime + 86400 * 4;

                                            updateVal = {
                                                $set: {
                                                    power: g_power + totalpower,
                                                    isMatch: false,
                                                    active_powerups: [],
                                                    member_list: g_memberlist
                                                }
                                            };
                                            clandb.updateOne({name: giveclan}, updateVal, err => {
                                                if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database now. Please try again!**");
                                                message.channel.send(`✅ **| ${message.author}, successfully transferred \`${totalpower.toLocaleString()}\` power points from \`${takeclan}\` clan to \`${giveclan}\` clan.**`)
                                            })
                                        });
                                        confirm.on("end", () => {
                                            if (!confirmation) {
                                                msg.delete();
                                                message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                                            }
                                        })
                                    })
                                })
                            })
                        })
                    });
                    break
                }
                default: return message.channel.send("❎ **| I'm sorry, looks like your second argument is invalid! Accepted arguments are `give`, `take`, and `transfer`.**")
            }
            cd.add(message.author.id);
            setTimeout(() => {
                cd.delete(message.author.id)
            }, 3000);
            break
        }
        case "match": {
            // adds/removes two clans into match list
            // ===========================================
            // this prevents them from activating powerups
            // in the middle of a battle, referee/mod only
            if ((message.member.roles == null || !message.member.roles.cache.find((r) => r.name === 'Referee')) && !perm) return message.channel.send("❎ **| I'm sorry, you don't have permission to do this.**");
            switch (args[1]) {
                // add clan
                case "add": {
                    let tomatch = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[2]));
                    if (!tomatch) return message.channel.send("❎ **| Hey, please give me a valid user!**");
                    query = {discordid: tomatch.id};
                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!userres) return message.channel.send("❎ **| I'm sorry, the account is not binded. He/she/you need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (!userres.clan) return message.channel.send("❎ **| I'm sorry, that user is not in a clan!**");
                        let clan = userres.clan;
                        query = {name: clan};
                        clandb.findOne(query, (err, clanres) => {
                            if (err) {
                                console.log(err);
                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                            }
                            if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");
                            if (clanres.power === 0) return message.channel.send("❎ **| I'm sorry, the user's clan has 0 power points!**");

                            let memberlist = clanres.member_list;
                            let member_index = memberlist.findIndex(member => member.id === tomatch.id);
                            if (memberlist[member_index].battle_cooldown > curtime) return message.channel.send("❎ **| I'm sorry, this clan member is currently in cooldown!**");

                            updateVal = {
                                $set: {
                                    isMatch: true
                                }
                            };
                            clandb.updateOne(query, updateVal, err => {
                                if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**");
                                message.channel.send(`✅ **| ${message.author}, successfully set \`${clan}\` clan in match mode.**`)
                            })
                        })
                    });
                    break
                }
                case "remove": {
                    // remove clan
                    let tomatch = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[2]));
                    if (!tomatch) return message.channel.send("❎ **| Hey, please give me a valid user!**");
                    query = {discordid: tomatch.id};
                    binddb.findOne(query, (err, clanres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!clanres) return message.channel.send("❎ **| I'm sorry, the account is not binded. He/she/you need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (!clanres.clan) return message.channel.send("❎ **| I'm sorry, that user is not in a clan!**");
                        let clan = clanres.clan;
                        updateVal = {
                            $set: {
                                isMatch: false
                            }
                        };
                        clandb.updateOne({name: clan}, updateVal, err => {
                            if (err) return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**");
                            message.channel.send(`✅ **| ${message.author}, successfully removed \`${clan}\` clan from match mode.**`)
                        })
                    });
                    break
                }
                default: return message.channel.send("❎ **| I'm sorry, looks like your second argument is invalid! Accepted arguments are `add` and `remove`.**")
            }
            cd.add(message.author.id);
            setTimeout(() => {
                cd.delete(message.author.id)
            }, 2500);
            break
        }
        case "cooldown": {
            switch (args[1]) {
                case "join": {
                    let user = message.author;
                    if (args[2]) {
                        user = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[1]));
                        if (!user) return message.channel.send("❎ **| Hey, please mention a valid user!**");
                        query = {discordid: user.id}
                    }
                    query = {discordid: user.id};

                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!userres) return message.channel.send("❎ **| I'm sorry, the account is not binded. He/she/you need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (userres.clan) return message.channel.send("❎ **| I'm sorry, this user is in a clan!**");
                        if (!userres.joincooldown) userres.joincooldown = 0;
                        let cooldown = Math.max(0, userres.joincooldown - curtime);

                        if (!cooldown) message.channel.send("✅ **| The user is currently not in cooldown to join a clan.**");
                        else {
                            let time = timeConvert(cooldown);
                            message.channel.send(`✅ **| The user cannot join a clan for ${time[0] === 0 ? "" : `${time[0] === 1 ? `${time[0]} day` : `${time[0]} days`}`}${time[1] === 0 ? "" : `${time[0] === 0 ? "" : ", "}${time[1] === 1 ? `${time[1]} hour` : `${time[1]} hours`}`}${time[2] === 0 ? "" : `${time[1] === 0 ? "" : ", "}${time[2] === 1 ? `${time[2]} minute` : `${time[2]} minutes`}`}${time[3] === 0 ? "" : `${time[2] === 0 ? "" : ", "}${time[3] === 1 ? `${time[3]} second` : `${time[3]} seconds`}`}.**`)
                        }

                        if (userres.oldclan) {
                            if (!userres.oldjoincooldown) userres.oldjoincooldown = 0;
                            let old_cooldown = Math.max(0, userres.oldjoincooldown - curtime);
                            if (!old_cooldown) message.channel.send("✅ **| The user is currently not in cooldown to join the user's old clan.**");
                            else {
                                let time = timeConvert(old_cooldown);
                                message.channel.send(`✅ **| The user cannot join the user's old clan for ${time[0] === 0 ? "" : `${time[0] === 1 ? `${time[0]} day` : `${time[0]} days`}`}${time[1] === 0 ? "" : `${time[0] === 0 ? "" : ", "}${time[1] === 1 ? `${time[1]} hour` : `${time[1]} hours`}`}${time[2] === 0 ? "" : `${time[1] === 0 ? "" : ", "}${time[2] === 1 ? `${time[2]} minute` : `${time[2]} minutes`}`}${time[3] === 0 ? "" : `${time[2] === 0 ? "" : ", "}${time[3] === 1 ? `${time[3]} second` : `${time[3]} seconds`}`}.**`)
                            }
                        }
                    });
                    break
                }
                case "battle": {
                    // views a user's cooldown in participating a clan battle
                    let user = message.author;
                    if (args[2]) {
                        user = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[1]));
                        if (!user) return message.channel.send("❎ **| Hey, please mention a valid user!**");
                        query = {discordid: user.id}
                    }
                    query = {discordid: user.id};

                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!userres) return message.channel.send("❎ **| I'm sorry, the account is not binded. He/she/you need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (!userres.clan) return message.channel.send("❎ **| I'm sorry, that user is not in a clan!**");
                        let clan = userres.clan;
                        query = {name: clan};

                        clandb.findOne(query, (err, clanres) => {
                            if (err) {
                                console.log(err);
                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                            }
                            if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");

                            let memberlist = clanres.member_list;
                            let member_index = memberlist.findIndex(member => member.id === user.id);
                            let cooldown = Math.max(0, memberlist[member_index].battle_cooldown - curtime);

                            if (!cooldown) return message.channel.send("✅ **| The user is currently not in cooldown from participating in a clan battle.**");
                            else {
                                let time = timeConvert(cooldown);
                                return message.channel.send(`✅ **| The user cannot participate in a clan battle for ${time[0] === 0 ? "" : `${time[0] === 1 ? `${time[0]} day` : `${time[0]} days`}`}${time[1] === 0 ? "" : `${time[0] === 0 ? "" : ", "}${time[1] === 1 ? `${time[1]} hour` : `${time[1]} hours`}`}${time[2] === 0 ? "" : `${time[1] === 0 ? "" : ", "}${time[2] === 1 ? `${time[2]} minute` : `${time[2]} minutes`}`}${time[3] === 0 ? "" : `${time[2] === 0 ? "" : ", "}${time[3] === 1 ? `${time[3]} second` : `${time[3]} seconds`}`}.**`)
                            }
                        })
                    });
                    break
                }
                default: return message.channel.send("❎ **| I'm sorry, looks like your second argument is invalid! Accepted arguments are `battle` and `join`.**")
            }
            break
        }
        case "auction": {
            // auctions
            // =====================================
            // as of now only powerups are available
            // for auction
            switch (args[1]) {
                case "bid": {
                    let name = args[2];
                    if (!name) return message.channel.send("❎ **| Hey, please enter a name of the auction!**");
                    if (name.length > 20) return message.channel.send("❎ **| I'm sorry, an auction's name does not exceed 20 characters!**");

                    let amount = parseInt(args[3]);
                    if (isNaN(amount) || amount <= 0) return message.channel.send("❎ **| Hey, please enter a valid coin amount to bid!**");

                    query = {discordid: message.author.id};
                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!userres) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (!userres.clan) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                        let clan = userres.clan;
                        pointdb.findOne(query, (err, pointres) => {
                            if (err) {
                                console.log(err);
                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                            }
                            if (!pointres) return message.channel.send(`❎ **| I'm sorry, you don't have that many ${coin}Alice coins to bid! You currently have ${coin}\`0\` Alice coins.**`);
                            let alicecoins = pointres.alicecoins;
                            if (alicecoins < amount) return message.channel.send(`❎ **| I'm sorry, you don't have that many ${coin}Alice coins to bid! You currently have ${coin}\`${alicecoins.toLocaleString()}\` Alice coins.**`);

                            query = {name: name};
                            auctiondb.findOne(query, (err, auctionres) => {
                                if (err) {
                                    console.log(err);
                                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                                }
                                if (!auctionres) return message.channel.send("❎ **| I'm sorry, that auction does not exist!**");
                                if (auctionres.auctioneer === clan) return message.channel.send("❎ **| Hey, you cannot bid on your clan's auction!**");
                                if (auctionres.expirydate - curtime <= 0) return message.channel.send("❎ **| I'm sorry, this auction is over!**");

                                let bids = auctionres.bids;
                                let bid_index = bids.findIndex(bid => bid.clan === clan);
                                if (bid_index !== -1) bids[bid_index].amount += amount;
                                else bids.push({
                                    clan: clan,
                                    amount: amount
                                });
                                bids.sort((a, b) => {return b.amount - a.amount});
                                bid_index = bids.findIndex(bid => bid.clan === clan);
                                let cur_amount = bids[bid_index][1];

                                message.channel.send(`❗**| ${message.author}, are you sure you want to create the auction?**`).then(msg => {
                                    msg.react("✅").catch(console.error);
                                    let confirmation = false;
                                    let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {time: 20000});

                                    confirm.on("collect", () => {
                                        msg.delete().catch(console.error);
                                        confirmation = true;

                                        alicecoins -= amount;
                                        updateVal = {
                                            $set: {
                                                bids: bids
                                            }
                                        };
                                        auctiondb.updateOne(query, updateVal, err => {
                                            if (err) {
                                                console.log(err);
                                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                                            }
                                        });
                                        updateVal = {
                                            $set: {
                                                alicecoins: alicecoins
                                            }
                                        };
                                        pointdb.updateOne({discordid: message.author.id}, updateVal, err => {
                                            if (err) {
                                                console.log(err);
                                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                                            }
                                            message.channel.send(`✅ **| ${message.author}, successfully bidded ${coin}\`${amount.toLocaleString()}\`Alice coins to auction \`${name}\`. Your clan is currently #${bid_index + 1} with ${coin}\`${cur_amount.toLocaleString()}\` Alice coins bidded. You now have ${coin}\`${alicecoins.toLocaleString()}\` Alice coins.\n\nUse \`a!clan auction status ${name}\` to check the auction's status.**`)
                                        })
                                    });
                                    confirm.on("end", () => {
                                        if (!confirmation) {
                                            msg.delete().catch(console.error);
                                            message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                                        }
                                    })
                                })
                            })
                        })
                    });
                    break
                }
                case "create": {
                    let name = args[2];
                    if (!name) return message.channel.send("❎ **| Hey, please enter a name for your auction!**");
                    if (name.length > 20) return message.channel.send("❎ **| I'm sorry, an auction's name must not exceed 20 characters!**");

                    let powerup = args[3];
                    if (!powerup) return message.channel.send("❎ **| Hey, please enter a powerup!**");
                    powerup = powerup.toLowerCase();

                    let amount = parseInt(args[4]);
                    if (isNaN(amount) || amount <= 0) return message.channel.send("❎ **| Hey, please enter a valid powerup amount to auction!**");

                    let min_price = parseInt(args[5]);
                    if (isNaN(min_price) || min_price < 0) return message.channel.send("❎ **| Hey, please enter a valid minimum price for other clans to bid!**");

                    let auction_duration = parseInt(args[6]);
                    if (isNaN(auction_duration)) return message.channel.send("❎ **| Hey, please enter a valid auction duration!**");
                    if (auction_duration < 60 || auction_duration > 86400) return message.channel.send("❎ **| I'm sorry, auction duration can only range from 60 (1 minute) to 86400 (1 day) seconds!**");

                    query = {discordid: message.author.id};
                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!userres) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (!userres.clan) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                        let clan = userres.clan;
                        query = {name: clan};
                        clandb.findOne(query, (err, clanres) => {
                            if (err) {
                                console.log(err);
                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                            }
                            if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");

                            let memberlist = clanres.member_list;
                            let member_index = memberlist.findIndex(member => member.id === message.author.id);
                            let hasPermission = memberlist[member_index].hasPermission;
                            if (!hasPermission) return message.channel.send("❎ **| I'm sorry, you don't have permission to do this.**");

                            let powerups = clanres.powerups;
                            let powerup_index = powerups.findIndex(pow => pow.name === powerup);
                            if (powerup_index === -1) return message.channel.send("❎ **| I'm sorry, I cannot find the powerup you are looking for!**");
                            if (powerups[powerup_index][1] < amount) return message.channel.send(`❎ **| I'm sorry, you don't have that many \`${powerup}\` powerups! Your clan has \`${powerups[powerup_index][1].toLocaleString()}\` of it.**`);

                            query = {name: name};
                            auctiondb.findOne(query, (err, auctionres) => {
                                if (err) {
                                    console.log(err);
                                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                                }
                                if (auctionres) return message.channel.send("❎ **| I'm sorry, an auction with that name exists! Please choose another name!**");
                                powerups[powerup_index][1] -= amount;

                                message.channel.send(`❗**| ${message.author}, are you sure you want to create the auction?**`).then(msg => {
                                    msg.react("✅").catch(console.error);
                                    let confirmation = false;
                                    let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {time: 20000});

                                    confirm.on("collect", () => {
                                        msg.delete().catch(console.error);
                                        confirmation = true;
                                        insertVal = {
                                            name: name,
                                            auctioneer: clan,
                                            creationdate: curtime,
                                            expirydate: curtime + auction_duration,
                                            powerup: powerup,
                                            amount: amount,
                                            min_price: min_price,
                                            bids: []
                                        };
                                        auctiondb.insertOne(insertVal, err => {
                                            if (err) {
                                                console.log(err);
                                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                                            }
                                        });
                                        updateVal = {
                                            $set: {
                                                powerups: powerups
                                            }
                                        };
                                        clandb.updateOne({name: clan}, updateVal, err => {
                                            if (err) {
                                                console.log(err);
                                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                                            }
                                            message.channel.send(`✅ **| ${message.author}, successfully created auction \`${name}\`.**`);

                                            embed.setTitle("Auction Information")
                                                .setDescription(`**Name**: ${name}\n**Auctioneer**: ${clan}\n**Created at**: ${new Date(curtime * 1000).toUTCString()}\n**Expires at**: ${new Date((curtime + auction_duration) * 1000).toUTCString()}`)
                                                .addField("**Auction Item**", `**Powerup**: ${capitalizeString(powerup)}\n**Amount**: ${amount.toLocaleString()}\n**Minimum bid amount**: ${coin}**${min_price.toLocaleString()}** Alice coins`);
                                            client.channels.cache.get("696646867567640586").send(`❗**| An auction has started with the following details:**`, {embed: embed})
                                        })
                                    });
                                    confirm.on("end", () => {
                                        if (!confirmation) {
                                            msg.delete().catch(console.error);
                                            message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                                        }
                                    })
                                })
                            })
                        })
                    });
                    break
                }
                case "list": {
                    let page = 1;
                    if (parseInt(args[1]) > 1) page = parseInt(args[1]);
                    auctiondb.find({}).sort({min_price: -1}).toArray((err, auctionres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (auctionres.length === 0) return message.channel.send("❎ **| I'm sorry, there are no ongoing auctions as of now!**");
                        if (!auctionres[page*5]) return message.channel.send(`❎ **| I'm sorry, there aren't that many auctions available!**`);
                        embed = editAuction(auctionres, coin, page, rolecheck, footer, index);
                        message.channel.send({embed: embed}).then(msg => {
                            msg.react("⏮️").then(() => {
                                msg.react("⬅️").then(() => {
                                    msg.react("➡️").then(() => {
                                        msg.react("⏭️").catch(console.error)
                                    })
                                })
                            });

                            let backward = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '⏮️' && user.id === message.author.id, {time: 180000});
                            let back = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '⬅️' && user.id === message.author.id, {time: 180000});
                            let next = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '➡️' && user.id === message.author.id, {time: 180000});
                            let forward = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '⏭️' && user.id === message.author.id, {time: 180000});

                            backward.on('collect', () => {
                                if (page === 1) return msg.reactions.cache.forEach((reaction) => reaction.users.remove(message.author.id).catch(console.error));
                                else page = Math.max(1, page - 10);
                                msg.reactions.cache.forEach((reaction) => reaction.users.remove(message.author.id).catch(console.error));
                                embed = editAuction(auctionres, coin, page, rolecheck, footer, index);
                                msg.edit({embed: embed}).catch(console.error)
                            });

                            back.on('collect', () => {
                                if (page === 1) page = Math.floor(auctionres.length / 5);
                                else --page;
                                msg.reactions.cache.forEach((reaction) => reaction.users.remove(message.author.id).catch(console.error));
                                embed = editAuction(auctionres, coin, page, rolecheck, footer, index);
                                msg.edit({embed: embed}).catch(console.error)
                            });

                            next.on('collect', () => {
                                if (page === Math.floor(auctionres.length / 5)) page = 1;
                                else ++page;
                                msg.reactions.cache.forEach((reaction) => reaction.users.remove(message.author.id).catch(console.error));
                                embed = editAuction(auctionres, coin, page, rolecheck, footer, index);
                                msg.edit({embed: embed}).catch(console.error);
                            });

                            forward.on('collect', () => {
                                if (page === Math.floor(auctionres.length / 5)) return msg.reactions.cache.forEach((reaction) => reaction.users.remove(message.author.id).catch(console.error));
                                else page = Math.min(page + 10, Math.floor(auctionres.length / 5));
                                msg.reactions.cache.forEach((reaction) => reaction.users.remove(message.author.id).catch(console.error));
                                embed = editAuction(auctionres, coin, page, rolecheck, footer, index);
                                msg.edit({embed: embed}).catch(console.error)
                            });

                            backward.on("end", () => {
                                msg.reactions.cache.forEach((reaction) => reaction.users.remove(message.author.id));
                                msg.reactions.cache.forEach((reaction) => reaction.users.remove(client.user.id))
                            })
                        })
                    });
                    break
                }
                case "status": {
                    let name = args[2];
                    if (!name) return message.channel.send("❎ **| Hey, please enter a name of the auction!**");
                    if (name.length > 20) return message.channel.send("❎ **| I'm sorry, an auction's name does not exceed 20 characters!**");

                    query = {discordid: message.author.id};
                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        let clan = '';
                        if (userres) clan = userres.clan;

                        query = {name: name};
                        auctiondb.findOne(query, (err, auctionres) => {
                            if (err) {
                                console.log(err);
                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                            }
                            if (!auctionres) return message.channel.send("❎ **| I'm sorry, that auction does not exist!**");
                            let bids = auctionres.bids;
                            let bid_index = bids.findIndex(bid => bid.clan === clan);

                            embed.setTitle("Auction Information")
                                .setDescription(`**Name**: ${name}\n**Auctioneer**: ${auctionres.auctioneer}\n**Created at**: ${new Date(auctionres.creationdate * 1000).toUTCString()}\n**Expires at**: ${new Date(auctionres.expirydate * 1000).toUTCString()}`)
                                .addField("**Auction Item**", `**Powerup**: ${capitalizeString(auctionres.powerup)}\n**Amount**: ${auctionres.amount.toLocaleString()}\n**Minimum bid amount**: ${coin}**${auctionres.min_price.toLocaleString()}** Alice coins`);

                            let top_string = '';
                            for (let i = 0; i < 5; i++) {
                                if (bids[i]) top_string += `#${i+1}: ${bids[i].clan} - ${coin}**${bids[i].amount}** Alice coins\n`;
                                else top_string += `#${i+1}: -\n`
                            }
                            if (bid_index > 4) top_string += `${'.\n'.repeat(Math.min(bid_index - 4, 3))}#${bid_index + 1}: ${clan} - ${coin}**${bids[bid_index].amount.toLocaleString()}** Alice coins`;
                            embed.addField("**Bid Information**", `**Bidders**: ${bids.length.toLocaleString()}\n**Top bidders**:\n${top_string}`);
                            message.channel.send({embed: embed})
                        })
                    });
                    break
                }
                case "cancel": {
                    let name = args[2];
                    if (!name) return message.channel.send("❎ **| Hey, please enter a name of your auction!**");
                    if (name.length > 20) return message.channel.send("❎ **| I'm sorry, an auction's name does not exceed 20 characters!**");

                    query = {discordid: message.author.id};
                    binddb.findOne(query, (err, userres) => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        if (!userres) return message.channel.send("❎ **| I'm sorry, your account is not binded. You need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
                        if (!userres.clan) return message.channel.send("❎ **| I'm sorry, you are not in a clan!**");
                        let clan = userres.clan;
                        query = {name: clan};
                        clandb.findOne(query, (err, clanres) => {
                            if (err) {
                                console.log(err);
                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                            }
                            if (!clanres) return message.channel.send("❎ **| I'm sorry, I cannot find the clan!**");

                            let memberlist = clanres.member_list;
                            let member_index = memberlist.findIndex(member => member.id === message.author.id);
                            let hasPermission = memberlist[member_index].hasPermission;
                            if (!hasPermission) return message.channel.send("❎ **| I'm sorry, you don't have permission to do this.**");

                            query = {name: name};
                            auctiondb.findOne(query, (err, auctionres) => {
                                if (err) {
                                    console.log(err);
                                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                                }
                                if (!auctionres) return message.channel.send("❎ **| I'm sorry, that auction does not exist!**");
                                if (auctionres.auctioneer !== clan) return message.channel.send("❎ **| I'm sorry, that auction does not belong to your clan!**");
                                if (auctionres.bids.length > 0) return message.channel.send("❎ **| I'm sorry, a clan has bidded for this auction, therefore you cannot cancel it!**");

                                let powerup = auctionres.powerup;
                                let amount = auctionres.amount;
                                let powerups = clanres.powerups;
                                let powerup_index = powerups.findIndex(pow => pow.name === powerup);
                                powerups[powerup_index].amount += amount;

                                message.channel.send(`❗**| ${message.author}, are you sure you want to cancel the auction?**`).then(msg => {
                                    msg.react("✅").catch(console.error);
                                    let confirmation = false;
                                    let confirm = msg.createReactionCollector((reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {time: 20000});

                                    confirm.on("collect", () => {
                                        msg.delete().catch(console.error);
                                        confirmation = true;

                                        updateVal = {
                                            $set: {
                                                powerups: powerups
                                            }
                                        };
                                        clandb.updateOne({name: clan}, updateVal, err => {
                                            if (err) {
                                                console.log(err);
                                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                                            }
                                        });
                                        auctiondb.deleteOne(query, err => {
                                            if (err) {
                                                console.log(err);
                                                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                                            }
                                            message.channel.send(`✅ **| ${message.author}, successfully cancelled auction \`${name}\`.**`)
                                        })
                                    });
                                    confirm.on("end", () => {
                                        if (!confirmation) {
                                            msg.delete().catch(console.error);
                                            message.channel.send("❎ **| Timed out.**").then(m => m.delete({timeout: 5000}))
                                        }
                                    })
                                })
                            })
                        })
                    });
                    break
                }
                default: return message.channel.send("❎ **| I'm sorry, looks like your second argument is invalid! Accepted arguments are `bid`, `create`, `list`, and `status`.**")
            }
            break
        }
        default: return message.channel.send("❎ **| I'm sorry, looks like your first argument is invalid! Accepted arguments are `about`, `accept`, `auction`, `cooldown`, `create`, `demote`, `description`, `disband`, `lb`, `icon`, `info`, `kick`, `leave`, `match`, `members`, `power`, `powerup`, `promote`, and `shop`.**")
    }
};

module.exports.config = {
    name: "clan",
    description: "Main command for clans.",
    usage: "clan about",
    detail: "Usage outputs the clans wiki which contains every information about clans.",
    permission: "None / Clan Co-Leader / Clan Leader / Referee / Moderator"
};
