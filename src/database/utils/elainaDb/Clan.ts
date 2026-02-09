import { ObjectId } from "mongodb";
import {
    AttachmentBuilder,
    Collection,
    Guild,
    GuildMember,
    Message,
    Role,
    Snowflake,
    TextChannel,
    User,
} from "discord.js";
import { DatabaseManager } from "@database/DatabaseManager";
import { ClanMember } from "structures/clan/ClanMember";
import { Powerup } from "structures/clan/Powerup";
import { DatabaseClan } from "structures/database/elainaDb/DatabaseClan";
import { Manager } from "../../../utils/base/Manager";
import { MessageCreator } from "../../../utils/creators/MessageCreator";
import { ArrayHelper } from "@utils/helpers/ArrayHelper";
import { Constants } from "@core/Constants";
import { PowerupType } from "structures/clan/PowerupType";
import { RESTManager } from "@utils/managers/RESTManager";
import { Image } from "canvas";
import { Precision } from "@rian8337/osu-base";
import { Player } from "@rian8337/osu-droid-utilities";
import { OperationResult } from "structures/core/OperationResult";
import { Language } from "@localization/base/Language";
import { ClanLocalization } from "@localization/database/utils/elainaDb/Clan/ClanLocalization";
import { ConstantsLocalization } from "@localization/core/constants/ConstantsLocalization";
import { DroidHelper } from "@utils/helpers/DroidHelper";

/**
 * Represents a clan.
 */
export class Clan extends Manager {
    /**
     * The BSON object ID of this document in the database.
     */
    readonly _id?: ObjectId;

    /**
     * The name of the clan.
     */
    name: string;

    /**
     * The power of the clan.
     */
    power: number;

    /**
     * The epoch time at which the clan was created.
     */
    createdAt: number;

    /**
     * The Discord ID of the clan leader.
     */
    leader: Snowflake;

    /**
     * The clan's description.
     */
    description: string;

    /**
     * The ID of the message that contains the icon of the clan.
     */
    iconMessage: Snowflake;

    /**
     * The URL of the clan's icon.
     */
    iconURL: string;

    /**
     * The ID of the message that contains the banner of the clan.
     */
    bannerMessage: Snowflake;

    /**
     * The URL of the clan's banner.
     */
    bannerURL: string;

    /**
     * The epoch time at which the clan can change their icon again, in seconds.
     */
    iconcooldown: number;

    /**
     * The epoch time at which the clan can change their banner again, in seconds.
     */
    bannercooldown: number;

    /**
     * The epoch time at which the clan can change their name again, in seconds.
     */
    namecooldown: number;

    /**
     * The epoch time at which the weekly upkeep of the clan will be taken, in seconds.
     */
    weeklyfee: number;

    /**
     * Whether the clan is currently in match mode.
     */
    isMatch: boolean;

    /**
     * Whether the clan can change their role's color.
     */
    roleColorUnlocked: boolean;

    /**
     * Whether the clan can change their role's icon.
     */
    roleIconUnlocked: boolean;

    /**
     * The powerups that the clan own, mapped by their name.
     */
    powerups: Collection<PowerupType, Powerup>;

    /**
     * The active powerups of the clan.
     */
    active_powerups: PowerupType[];

    /**
     * The members of the clan, mapped by their ID.
     */
    member_list: Collection<Snowflake, ClanMember>;

    /**
     * Whether the clan exists.
     */
    exists: boolean = true;

    /**
     * The base upkeep value of a clan.
     */
    readonly upkeepBaseValue = 200;

    /**
     * The base upkeep value of a clan member.
     */
    get individualUpkeepBaseValue(): number {
        return Math.floor(this.upkeepBaseValue / this.member_list.size);
    }

    private readonly attachmentChannelId = "878541544817307668";

    /**
     * @param data The clan data from database.
     */
    constructor(
        data: DatabaseClan = DatabaseManager.elainaDb?.collections.clan
            .defaultDocument ?? {},
    ) {
        super();

        this._id = data._id;
        this.name = data.name;
        this.power = data.power;
        this.createdAt = data.createdAt;
        this.leader = data.leader;
        this.description = data.description;
        this.iconMessage = data.iconMessage;
        this.iconURL = data.iconURL;
        this.bannerMessage = data.bannerMessage;
        this.bannerURL = data.bannerURL;
        this.iconcooldown = data.iconcooldown;
        this.bannercooldown = data.bannercooldown;
        this.namecooldown = data.namecooldown;
        this.weeklyfee = data.weeklyfee;
        this.isMatch = data.isMatch;
        this.roleColorUnlocked = data.roleColorUnlocked;
        this.roleIconUnlocked = data.roleIconUnlocked;
        this.powerups = ArrayHelper.arrayToCollection(
            data.powerups ?? [],
            "name",
        );
        this.active_powerups = data.active_powerups ?? [];
        this.member_list = ArrayHelper.arrayToCollection(
            data.member_list ?? [],
            "id",
        );
    }

    /**
     * Notifies the clan leader of a clan.
     *
     * @param message The message for the clan leader.
     * @returns An object containing information about the operation.
     */
    async notifyLeader(message: string): Promise<OperationResult> {
        const leader = await this.client.users.fetch(this.leader);

        if (!leader) {
            return this.createOperationResult(false, "clan leader not found");
        }

        return new Promise((resolve) => {
            leader
                .send(MessageCreator.createWarn(message))
                .then(() => {
                    resolve(this.createOperationResult(true));
                })
                .catch((e: Error) => {
                    resolve(this.createOperationResult(false, e.message));
                });
        });
    }

    /**
     * Adds a member to the clan.
     *
     * @param user The user to add.
     * @param language The locale of the user who attempted to add the user to the clan. Defaults to English.
     * @returns An object containing information about the operation.
     */
    async addMember(user: User, language?: Language): Promise<OperationResult>;

    /**
     * Adds a member to the clan.
     *
     * @param userID The ID of the user to add.
     * @param language The locale of the user who attempted to add the user to the clan. Defaults to English.
     * @returns An object containing information about the operation.
     */
    async addMember(
        userID: Snowflake,
        language?: Language,
    ): Promise<OperationResult>;

    async addMember(
        userOrId: User | Snowflake,
        language: Language = "en",
    ): Promise<OperationResult> {
        const localization = this.getLocalization(language);
        const id = userOrId instanceof User ? userOrId.id : userOrId;

        if (this.member_list.has(id)) {
            return this.createOperationResult(
                false,
                localization.getTranslation("userInCurrentClan"),
            );
        }

        const toAcceptBindInfo =
            await DatabaseManager.elainaDb.collections.userBind.getFromUser(
                id,
                {
                    projection: {
                        _id: 0,
                        clan: 1,
                        oldjoincooldown: 1,
                        joincooldown: 1,
                    },
                },
            );

        if (!toAcceptBindInfo) {
            return this.createOperationResult(
                false,
                new ConstantsLocalization(language).getTranslation(
                    Constants.userNotBindedReject,
                ),
            );
        }

        if (toAcceptBindInfo.clan) {
            return this.createOperationResult(
                false,
                localization.getTranslation("userInAnotherClan"),
            );
        }

        if (
            toAcceptBindInfo.clan === this.name &&
            Date.now() / 1000 < (toAcceptBindInfo.oldjoincooldown ?? 0)
        ) {
            return this.createOperationResult(
                false,
                localization.getTranslation("userInCooldownForOldClan"),
            );
        } else if (Date.now() / 1000 < (toAcceptBindInfo.joincooldown ?? 0)) {
            return this.createOperationResult(
                false,
                localization.getTranslation("userInCooldownForClan"),
            );
        }

        const player = await DroidHelper.getPlayer(toAcceptBindInfo.uid, [
            "id",
        ]);
        const rank =
            player instanceof Player
                ? player.rank
                : player !== null
                  ? ((await DroidHelper.getPlayerPPRank(player.id)) ?? 0)
                  : 0;

        if (!player) {
            return this.createOperationResult(
                false,
                localization.getTranslation("userBindedAccountNotFound"),
            );
        }

        this.member_list.set(id, {
            id: id,
            uid: player.id,
            rank: rank,
            hasPermission: false,
            battle_cooldown: 0,
        });

        await this.addClanRole(userOrId);

        return DatabaseManager.elainaDb.collections.userBind.updateOne(
            { discordid: id },
            {
                $set: {
                    clan: this.name,
                },
            },
        );
    }

    /**
     * Removes a member from the clan.
     *
     * If the user is the leader of the clan, a random member will be promoted to leader,
     * with co-leaders being the priority in mind.
     *
     * If the user is the only member in the clan, the clan will be disbanded. This can
     * be checked by using the `exists` field.
     *
     * @param user The user to remove.
     * @param language The locale of the user who attemped to remove the user.
     * @param force Whether to forcefully remove the user even if they're the leader.
     * @returns An object containing information about the operation.
     */
    async removeMember(
        user: User,
        language?: Language,
        force?: boolean,
    ): Promise<OperationResult>;

    /**
     * Removes a member from the clan.
     *
     * If the user is the leader of the clan, a random member will be promoted to leader,
     * with co-leaders being the priority in mind.
     *
     * If the user is the only member in the clan, the clan will be disbanded. This can
     * be checked by using the `exists` field.
     *
     * @param userID The ID of the user to remove.
     * @param language The locale of the user who attemped to remove the user.
     * @param force Whether to forcefully remove the user even if they're the leader.
     * @returns An object containing information about the operation.
     */
    async removeMember(
        userID: Snowflake,
        language?: Language,
        force?: boolean,
    ): Promise<OperationResult>;

    async removeMember(
        userOrId: User | Snowflake,
        language: Language = "en",
        force: boolean = false,
    ): Promise<OperationResult> {
        const localization: ClanLocalization = this.getLocalization(language);

        const id: Snowflake = userOrId instanceof User ? userOrId.id : userOrId;

        if (id === this.leader && !force) {
            return this.createOperationResult(
                false,
                localization.getTranslation("clanLeaderCannotLeaveClan"),
            );
        }

        if (!this.member_list.delete(id)) {
            return this.createOperationResult(
                false,
                localization.getTranslation("userNotInClan"),
            );
        }

        if (this.member_list.size === 0) {
            return this.disband();
        }

        if (id === this.leader) {
            this.changeLeader();
        }

        await this.removeClanRole(userOrId);

        await DatabaseManager.elainaDb.collections.userBind.updateOne(
            { discordid: id },
            {
                $set: {
                    clan: "",
                    oldclan: this.name,
                    joincooldown: Math.floor(Date.now() / 1000) + 86400 * 3,
                    oldjoincooldown: Math.floor(Date.now() / 1000) + 86400 * 14,
                },
            },
        );

        return this.updateClan();
    }

    /**
     * Changes the leader of the clan.
     *
     * @param newLeader The Discord ID of the new leader. If unspecified, a random clan member will be picked.
     * @param language The locale of the user who attempted to change the leader of the clan. Defaults to English.
     * @returns An object containing information about the operation.
     */
    async changeLeader(
        newLeader?: Snowflake,
        language: Language = "en",
    ): Promise<OperationResult> {
        const localization: ClanLocalization = this.getLocalization(language);

        if (newLeader === this.leader) {
            return this.createOperationResult(
                false,
                localization.getTranslation("leaderIsTheSame"),
            );
        }

        if (newLeader) {
            if (!this.member_list.has(newLeader)) {
                return this.createOperationResult(
                    false,
                    localization.getTranslation("cannotFindNewLeader"),
                );
            }

            const channel: TextChannel | undefined =
                await this.getClanChannel();

            if (channel) {
                await channel.permissionOverwrites.delete(this.leader);
                await channel.permissionOverwrites.create(newLeader, {
                    ManageMessages: true,
                });
            }

            this.leader = newLeader;

            return this.createOperationResult(true);
        }

        let member: ClanMember = this.member_list.random()!;

        const coLeaderExists: boolean = this.member_list.some(
            (c) => c.hasPermission,
        );

        while (
            member.id === this.leader ||
            (coLeaderExists && !member.hasPermission)
        ) {
            member = this.member_list.random()!;
        }

        member.hasPermission = true;

        const channel: TextChannel | undefined = await this.getClanChannel();

        if (channel) {
            await channel.permissionOverwrites.delete(this.leader);
            await channel.permissionOverwrites.create(member.id, {
                ManageMessages: true,
            });
        }

        this.leader = member.id;

        this.member_list.set(member.id, member);

        return this.createOperationResult(true);
    }

    /**
     * Checks whether a user is the clan leader.
     *
     * @param user The user.
     */
    isLeader(user: User): boolean;

    /**
     * Checks whether a user is the clan leader.
     *
     * @param userId The ID of the user.
     */
    isLeader(userId: Snowflake): boolean;

    isLeader(userOrId: User | Snowflake): boolean {
        return (
            (userOrId instanceof User ? userOrId.id : userOrId) === this.leader
        );
    }

    /**
     * Checks whether a user is a co-leader.
     *
     * @param user The user.
     */
    isCoLeader(user: User): boolean;

    /**
     * Checks whether a user is a co-leader.
     *
     * @param userId The ID of the user.
     */
    isCoLeader(userId: Snowflake): boolean;

    isCoLeader(userOrId: User | Snowflake): boolean {
        return (
            this.member_list.get(
                userOrId instanceof User ? userOrId.id : userOrId,
            )?.hasPermission ?? false
        );
    }

    /**
     * Checks whether a user has administrative powers in the clan.
     *
     * @param user The user.
     */
    hasAdministrativePower(user: User): boolean;

    /**
     * Checks whether a user has administrative powers in the clan.
     *
     * @param userId The ID of the user.
     */
    hasAdministrativePower(userId: Snowflake): boolean;

    hasAdministrativePower(userOrId: User | Snowflake): boolean {
        return (
            this.isLeader(userOrId instanceof User ? userOrId.id : userOrId) ||
            this.isCoLeader(userOrId instanceof User ? userOrId.id : userOrId)
        );
    }

    /**
     * Disbands the clan.
     *
     * @param reason The reason for disbanding the clan.
     * @returns An object containing information about the operation.
     */
    async disband(): Promise<OperationResult> {
        this.exists = false;

        await DatabaseManager.elainaDb.collections.clan.deleteOne({
            name: this.name,
        });

        await this.deleteClanRole("Clan disbanded");

        const clanChannel: TextChannel | undefined =
            await this.getClanChannel();

        if (clanChannel) {
            await clanChannel.delete();
        }

        return DatabaseManager.elainaDb.collections.userBind.updateOne(
            { clan: this.name },
            {
                $set: {
                    clan: "",
                    oldclan: this.name,
                    joincooldown: Math.floor(Date.now() / 1000) + 86400 * 3,
                    oldjoincooldown: Math.floor(Date.now() / 1000) + 86400 * 14,
                },
            },
        );
    }

    /**
     * Updates the clan in clan database.
     *
     * This should only be called after changing everything needed
     * as this will perform a database operation.
     *
     * @returns An object containing information about the operation.
     */
    async updateClan(): Promise<OperationResult> {
        return DatabaseManager.elainaDb.collections.clan.updateOne(
            { name: this.name },
            {
                $set: {
                    power: this.power,
                    createdAt: this.createdAt,
                    leader: this.leader,
                    description: this.description,
                    iconMessage: this.iconMessage,
                    iconURL: this.iconURL,
                    bannerMessage: this.bannerMessage,
                    bannerURL: this.bannerURL,
                    iconcooldown: this.iconcooldown,
                    bannercooldown: this.bannercooldown,
                    namecooldown: this.namecooldown,
                    weeklyfee: this.weeklyfee,
                    isMatch: this.isMatch,
                    roleIconUnlocked: this.roleIconUnlocked,
                    roleColorUnlocked: this.roleColorUnlocked,
                    powerups: [...this.powerups.values()],
                    active_powerups: this.active_powerups,
                    member_list: [...this.member_list.values()],
                },
            },
        );
    }

    /**
     * Sets the clan's match mode.
     *
     * @param matchMode Whether the clan is in match mode.
     * @returns An object containing information about the operation.
     */
    setMatchMode(matchMode: boolean): OperationResult {
        if (this.isMatch === matchMode) {
            return this.createOperationResult(
                false,
                `clan is already${matchMode ? "" : " not"} in match mode`,
            );
        }

        this.isMatch = matchMode;

        return this.createOperationResult(true);
    }

    /**
     * Adds clan roles to users.
     *
     * @param users The users to add clan roles to.
     */
    async addClanRole(
        ...users: (User | Snowflake)[]
    ): Promise<OperationResult> {
        const clanRole: Role | undefined = await this.getClanRole();

        if (!clanRole) {
            return this.createOperationResult(false, "clan role doesn't exist");
        }

        const mainServer: Guild = await this.client.guilds.fetch(
            Constants.mainServer,
        );

        const globalClanRole: Role = await this.getGlobalClanRole();

        for (const user of users) {
            const member: GuildMember | null = await mainServer.members
                .fetch(user)
                .catch(() => null);

            if (!member) {
                continue;
            }

            await member.roles.add([clanRole, globalClanRole]);
        }

        return this.createOperationResult(true);
    }

    /**
     * Removes clan roles from users.
     *
     * @param users The users to remove clan roles from.
     */
    async removeClanRole(
        ...users: (User | Snowflake)[]
    ): Promise<OperationResult> {
        const clanRole: Role | undefined = await this.getClanRole();

        if (!clanRole) {
            return this.createOperationResult(false, "clan role doesn't exist");
        }

        const mainServer: Guild = await this.client.guilds.fetch(
            Constants.mainServer,
        );

        const globalClanRole: Role = await this.getGlobalClanRole();

        for (const user of users) {
            const member: GuildMember | null = await mainServer.members
                .fetch(user)
                .catch(() => null);

            if (!member) {
                continue;
            }

            await member.roles.remove([clanRole, globalClanRole]);
        }

        return this.createOperationResult(true);
    }

    /**
     * Deletes this clan's role, if any.
     *
     * @reason The reason for deleting the role.
     */
    async deleteClanRole(reason: string): Promise<void> {
        const clanRole: Role | undefined = await this.getClanRole();

        if (clanRole) {
            await clanRole.delete(reason);
        }
    }

    /**
     * Gets the clan role of this clan, if any.
     */
    async getClanRole(): Promise<Role | undefined> {
        const mainServer: Guild = await this.client.guilds.fetch(
            Constants.mainServer,
        );

        return mainServer.roles.cache.find((r) => r.name === this.name);
    }

    /**
     * Gets the global clan role.
     */
    async getGlobalClanRole(): Promise<Role> {
        const mainServer: Guild = await this.client.guilds.fetch(
            Constants.mainServer,
        );

        return mainServer.roles.cache.find((r) => r.name === "Clans")!;
    }

    /**
     * Gets the clan channel of this clan, if any.
     */
    async getClanChannel(): Promise<TextChannel | undefined> {
        const mainServer: Guild = await this.client.guilds.fetch(
            Constants.mainServer,
        );

        return <TextChannel | undefined>(
            mainServer.channels.cache.find((c) => c.name === this.name)
        );
    }

    /**
     * Calculates the upkeep of a clan member.
     *
     * @param user The user.
     */
    calculateUpkeep(user: User): number;

    /**
     * Calculates the upkeep of a clan member.
     *
     * @param userId The ID of the user.
     */
    calculateUpkeep(userId: Snowflake): number;

    calculateUpkeep(userOrId: User | Snowflake): number {
        const id: Snowflake = userOrId instanceof User ? userOrId.id : userOrId;

        const member: ClanMember | undefined = this.member_list.get(id);

        if (!member) {
            return 0;
        }

        return 500 - Math.floor(34.74 * Math.log(member.rank));
    }

    /**
     * Calculates the overall upkeep of this clan.
     */
    calculateOverallUpkeep(): number {
        const distribution: number[] = this.getEqualUpkeepDistribution();

        return (
            this.upkeepBaseValue +
            this.member_list.reduce(
                (a, v) => a + this.calculateUpkeep(v.id),
                0,
            ) +
            distribution.reduce((a, v) => a + v, 0)
        );
    }

    /**
     * Gets the equal upkeep distribution of this clan.
     */
    getEqualUpkeepDistribution(): number[] {
        const memberCount: number = this.member_list.size;

        const distributionList: number[] = [];
        const indexList: number[] = [];
        const mod = this.upkeepBaseValue % memberCount;

        for (let i = 0; i < memberCount; ++i) {
            distributionList.push(this.individualUpkeepBaseValue);
        }

        for (let i = 0; i < mod; ++i) {
            let index = Math.floor(Math.random() * distributionList.length);

            while (indexList.includes(index)) {
                index = Math.floor(Math.random() * distributionList.length);
            }

            indexList.push(index);

            ++distributionList[index];
        }

        return distributionList;
    }

    /**
     * Sets the clan's icon.
     *
     * @param iconURL The URL of the icon. Omit this parameter to delete the current icon.
     * @param language The locale of the user who attempted to set the clan's icon. Defaults to English.
     */
    async setIcon(
        iconURL?: string,
        language: Language = "en",
    ): Promise<OperationResult> {
        const localization: ClanLocalization = this.getLocalization(language);

        const channel: TextChannel = await this.getAttachmentChannel();

        if (iconURL) {
            if (!(await RESTManager.downloadImage(iconURL))) {
                return this.createOperationResult(
                    false,
                    localization.getTranslation("invalidImage"),
                );
            }

            // Delete original message
            if (this.iconMessage) {
                const message: Message = await channel.messages.fetch(
                    this.iconMessage,
                );

                await message.delete();
            }

            const attachment: AttachmentBuilder = new AttachmentBuilder(
                iconURL,
                { name: "icon.png" },
            );

            const message: Message = await channel.send({
                content: `Type: Icon\n` + `Clan: ${this.name}`,
                files: [attachment],
            });

            this.iconMessage = message.id;
            this.iconURL = message.attachments.first()!.url;
        } else {
            const message: Message = await channel.messages.fetch(
                this.iconMessage,
            );

            await message.delete();

            this.iconMessage = "";
            this.iconURL = "";
        }

        return this.createOperationResult(true);
    }

    /**
     * Sets the clan's banner.
     *
     * @param bannerURL The URL of the banner. Omit this parameter to delete the current banner.
     * @param language The locale of the user who attemped to set the clan's banner. Defaults to English.
     */
    async setBanner(
        bannerURL?: string,
        language: Language = "en",
    ): Promise<OperationResult> {
        const localization: ClanLocalization = this.getLocalization(language);

        const channel: TextChannel = await this.getAttachmentChannel();

        if (bannerURL) {
            const image: Image | null =
                await RESTManager.downloadImage(bannerURL);

            if (!image) {
                return this.createOperationResult(
                    false,
                    localization.getTranslation("invalidImage"),
                );
            }

            if (
                !Precision.almostEquals(
                    image.naturalWidth / image.naturalHeight,
                    3.6,
                )
            ) {
                return this.createOperationResult(
                    false,
                    localization.getTranslation("invalidImageRatio"),
                );
            }

            // Delete original message
            if (this.bannerMessage) {
                const message: Message = await channel.messages.fetch(
                    this.bannerMessage,
                );

                await message.delete();
            }

            const attachment: AttachmentBuilder = new AttachmentBuilder(
                bannerURL,
                { name: "banner.png" },
            );

            const message: Message = await channel.send({
                content: `Type: Banner\n` + `Clan: ${this.name}`,
                files: [attachment],
            });

            this.bannerMessage = message.id;
            this.bannerURL = message.attachments.first()!.url;
        } else {
            const message: Message = await channel.messages.fetch(
                this.bannerMessage,
            );

            await message.delete();

            this.bannerMessage = "";
            this.bannerURL = "";
        }

        return this.createOperationResult(true);
    }

    /**
     * Sets the clan's description.
     *
     * @param description The clan's new description. Omit this parameter to clear the current description.
     * @param language The locale of the user who attempted to set the clan's description. Defaults to English.
     */
    setDescription(
        description?: string,
        language: Language = "en",
    ): OperationResult {
        const localization: ClanLocalization = this.getLocalization(language);

        if (description) {
            if (description.length >= 2000) {
                return this.createOperationResult(
                    false,
                    localization.getTranslation("descriptionTooLong"),
                );
            }

            this.description = description;
        } else {
            this.description = "";
        }

        return this.createOperationResult(true);
    }

    /**
     * Increments the clan's power by the specified amount.
     *
     * @param amount The amount to increment the clan power for.
     * @param language The locale of the user who attempted to increment the clan's power. Defaults to English.
     */
    incrementPower(amount: number, language: Language = "en"): OperationResult {
        const localization: ClanLocalization = this.getLocalization(language);

        if (this.power + amount < 0) {
            return this.createOperationResult(
                false,
                localization.getTranslation("clanPowerNegativeWarning"),
            );
        }

        if (!Number.isFinite(this.power + amount)) {
            return this.createOperationResult(
                false,
                localization.getTranslation("clanPowerInfiniteWarning"),
            );
        }

        this.power += amount;

        return this.createOperationResult(true);
    }

    /**
     * Gets the channel that contains attachments of clan icons and banners.
     */
    private async getAttachmentChannel(): Promise<TextChannel> {
        const channel: TextChannel = <TextChannel>(
            await this.client.channels.fetch(this.attachmentChannelId)
        );

        return channel;
    }

    /**
     * Gets the localization of this database utility.
     *
     * @param language The language to localize.
     */
    private getLocalization(language: Language): ClanLocalization {
        return new ClanLocalization(language);
    }
}
