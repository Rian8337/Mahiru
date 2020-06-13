const osudroid = require('osu-droid');

function equalDistribution(num) {
    const dist_list = [];
    const index_list = [];
    const base = Math.floor(200 / num);
    const mod = 200 % num;

    for (let i = 0; i < num; ++i) dist_list.push(base);

    for (let i = 0; i < mod; ++i) {
        let index = Math.floor(Math.random() * index_list.length);
        while (index_list.includes(index)) index = Math.floor(Math.random() * index_list.length);
        index_list.push(index);
        ++dist_list[index]
    }

    return dist_list
}

function fetchMembers(pointdb, query) {
    return new Promise(resolve => {
        pointdb.find(query, {projection: {_id: 0, discordid: 1, alicecoins: 1}}).toArray((err, res) => {
            if (err) return resolve(null);
            resolve(res)
        })
    })
}

function fetchBindPool(binddb, query) {
    return new Promise(resolve => {
        binddb.findOne(query, (err, res) => {
            if (err) return resolve(null);
            resolve(res.previous_bind)
        })
    })
}

function kickMember(binddb, clandb, clanquery, bindquery, clanupdateVal) {
    return new Promise(resolve => {
        const curtime = Math.floor(Date.now() / 1000);
        clandb.updateOne(clanquery, clanupdateVal, err => {
            if (err) return resolve(null);
            const updateVal = {
                $set: {
                    clan: "",
                    joincooldown: curtime + 86400 * 3,
                    oldjoincooldown: curtime + 86400 * 14
                }
            };
            binddb.updateOne(bindquery, updateVal, err => {
                if (err) return resolve(null);
                resolve(true)
            })
        })
    })
}

function deductCoins(pointdb, query, updateVal) {
    return new Promise(resolve => {
        pointdb.updateOne(query, updateVal, err => {
            if (err) return resolve(null);
            resolve(true)
        })
    })
}

function disbandClan(clandb, query) {
    return new Promise(resolve => {
        clandb.deleteOne(query, err => {
            if (err) return resolve(null);
            resolve(true)
        })
    })
}

function deductPower(clandb, query, updateVal) {
    return new Promise(resolve => {
        clandb.updateOne(query, updateVal, err => {
            if (err) return resolve(null);
            resolve(true)
        })
    })
}

module.exports.run = (client, maindb, alicedb) => {
    console.log("Retrieving clan data");
    const guild = client.guilds.cache.get("316545691545501706");
    const role = guild.roles.cache.find(r => r.name === 'Clans');
    const binddb = maindb.collection("userbind");
    const clandb = maindb.collection("clandb");
    const pointdb = alicedb.collection("playerpoints");
    const curtime = Math.floor(Date.now() / 1000);

    clandb.find({weeklyfee: {$lte: curtime}}).sort({weeklyfee: 1}).toArray(async (err, clans) => {
        if (err) return console.log(err);
        if (clans.length === 0) return;

        for await (const clan of clans) {
            console.log(`Checking ${clan.name} clan`);
            const clanrole = guild.roles.cache.find(r => r.name === clan.name);
            const leader = clan.leader;
            const member_list = clan.member_list;
            const upkeepDistribution = equalDistribution(member_list.length);
            const query = {discordid: {$in: []}};

            for (const member of member_list) query.discordid.$in.push(member.id);
            console.log("Fetching clan members coins entry");
            const members_points = await fetchMembers(pointdb, query);

            for await (const member of member_list) {
                if (!member_list.find(m => m.id === member.id)) continue;
                const bind_pool = await fetchBindPool(binddb, {discordid: member.id});
                let rank = Number.POSITIVE_INFINITY;
                
                console.log("Retrieving rank");
                for await (const uid of bind_pool) {
                    const player = await new osudroid.PlayerInfo().get({uid: uid});
                    rank = Math.min(rank, player.rank)
                }

                const index = Math.floor(Math.random() * upkeepDistribution.length);
                const upkeep = 500 - Math.floor(34.74 * Math.log(rank)) + upkeepDistribution[index];
                upkeepDistribution.splice(index, 1);

                const point_entry = members_points.find(m => m.discordid === member.id);
                // if clan member can't pay upkeep
                if (!point_entry || point_entry.alicecoins < upkeep) {
                    if (clanrole) guild.member(kicked.id).roles.remove([role, clanrole], "Clan disbanded")
                    // if leader is the current entry in loop, kick random member
                    if (member.id === leader && member_list.length > 1) {
                        console.log("Member can't pay upkeep, member is a leader");
                        let member_index = Math.floor(Math.random() * member_list.length);
                        while (member_list[member_index].id === leader) member_index = Math.floor(Math.random() * member_list.length);
                        const kicked = member_list[member_index];
                        member_list.splice(member_index, 1);
                        await kickMember(binddb, clandb, {name: clan.name}, {discordid: kicked.id}, {$set: {member_list: member_list}});
                    }
                    // if the clan only consists of the leader himself
                    else if (member_list.length === 1) {
                        // if clan power is less than 50, disband the clan
                        if (clan.power < 100) await disbandClan(clandb, {name: clan});
                        // otherwise deduct clan's power by 100
                        else await deductPower(clandb, {name: clan}, {$inc: {power: -100}})
                    }
                    else await kickMember(binddb, clandb, {name: clan}, {discordid: member.id}, {$set: {member_list: member_list}});
                    continue
                }
                // clan member can pay upkeep
                await deductCoins(pointdb, {discordid: member.id}, {$inc: -upkeep})
            }
        }
    })
};

module.exports.config = {
    name: "clantrack"
};