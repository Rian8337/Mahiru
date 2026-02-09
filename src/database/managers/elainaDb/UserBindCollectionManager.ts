import { UserBind } from "@database/utils/elainaDb/UserBind";
import { DatabaseUserBind } from "structures/database/elainaDb/DatabaseUserBind";
import { DatabaseCollectionManager } from "../DatabaseCollectionManager";
import { FindOptions } from "mongodb";
import {
    ApplicationCommandOptionChoiceData,
    Snowflake,
    User,
} from "discord.js";
import { OperationResult } from "@structures/core/OperationResult";
import { Constants } from "@core/Constants";

/**
 * A manager for the `userbind` collection.
 */
export class UserBindCollectionManager extends DatabaseCollectionManager<
    DatabaseUserBind,
    UserBind
> {
    protected override readonly utilityInstance: new (
        data: DatabaseUserBind,
    ) => UserBind = UserBind;

    override get defaultDocument(): DatabaseUserBind {
        return {
            discordid: "",
            uid: 0,
            username: "",
        };
    }

    /**
     * Gets the bind information of a Discord user.
     *
     * @param user The user.
     * @param options Options for the retrieval of the bind information.
     */
    getFromUser(user: User, options?: FindOptions): Promise<UserBind | null>;

    /**
     * Gets the bind information of a Discord user.
     *
     * @param userId The ID of the user.
     * @param options Options for the retrieval of the bind information.
     */
    getFromUser(
        userId: Snowflake,
        options?: FindOptions,
    ): Promise<UserBind | null>;

    getFromUser(
        userOrId: User | Snowflake,
        options?: FindOptions,
    ): Promise<UserBind | null> {
        if (userOrId instanceof User && userOrId.bot) {
            return Promise.resolve(null);
        }

        return this.getOne(
            {
                discordid: userOrId instanceof User ? userOrId.id : userOrId,
            },
            options,
        );
    }

    /**
     * Gets the bind information of an osu!droid account from its uid.
     *
     * @param uid The uid of the osu!droid account.
     * @param options Options for the retrieval of the bind information.
     */
    getFromUid(uid: number, options?: FindOptions): Promise<UserBind | null> {
        return this.getOne({ uid: uid }, options);
    }

    /**
     * Gets the bind information of an osu!droid account from its username.
     *
     * @param username The username of the osu!droid account.
     * @param options Options for the retrieval of the bind information.
     */
    getFromUsername(
        username: string,
        options?: FindOptions,
    ): Promise<UserBind | null> {
        return this.getOne({ username: username }, options);
    }

    /**
     * Checks whether a Discord user is bound.
     *
     * @param user The user.
     */
    async isUserBinded(user: User): Promise<boolean>;

    /**
     * Checks whether a Discord user is bound.
     *
     * @param userId The ID of the user.
     */
    async isUserBinded(userId: Snowflake): Promise<boolean>;

    async isUserBinded(userOrId: User | Snowflake): Promise<boolean> {
        return !!(await this.getFromUser(
            // Need to do this otherwise TypeScript complains
            userOrId instanceof User ? userOrId.id : userOrId,
            {
                projection: {
                    _id: 0,
                },
            },
        ));
    }

    /**
     * Searches players based on username for autocomplete response.
     *
     * @param searchQuery The username to search.
     * @param amount The maximum amount of usernames to return. Defaults to 25.
     * @returns The usernames that match the query.
     */
    async searchPlayersForAutocomplete(
        searchQuery: string | RegExp,
        amount = 25,
    ): Promise<ApplicationCommandOptionChoiceData<string>[]> {
        let regExp: RegExp;

        try {
            regExp = new RegExp(searchQuery, "i");
        } catch {
            return [];
        }

        const result = await this.collection
            .find({ username: regExp }, { projection: { _id: 0, username: 1 } })
            .limit(amount)
            .toArray();

        return result.map((v) => {
            return {
                name: v.username,
                value: v.username,
            };
        });
    }

    /**
     * Updates the role connection metadata of users.
     */
    async updateRoleConnectionMetadata(): Promise<OperationResult> {
        const guild = await this.client.guilds.fetch(Constants.mainServer);
        const role = await guild.roles.fetch(Constants.ppProfileDisplayerRole);

        if (!role) {
            return this.createOperationResult(true);
        }

        const userIDs = [...role.members.keys()];
        const users = await this.collection
            .find(
                {
                    discordid: {
                        $in: userIDs,
                    },
                    dailyRoleMetadataUpdateComplete: { $ne: true },
                },
                this.processFindOptions({
                    projection: {
                        _id: 0,
                        discordid: 1,
                    },
                }),
            )
            .toArray();

        for (const user of users) {
            await new UserBind(user).updateRoleMetadata();
        }

        return this.updateMany(
            {
                discordid: {
                    $in: userIDs,
                },
            },
            { $unset: { dailyRoleMetadataUpdateComplete: "" } },
        );
    }

    protected override processFindOptions(
        options?: FindOptions,
    ): FindOptions | undefined {
        if (options?.projection) {
            options.projection.discordid = 1;
        }

        return super.processFindOptions(options);
    }
}
