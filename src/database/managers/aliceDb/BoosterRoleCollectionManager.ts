import { DatabaseBoosterRole } from "@structures/database/aliceDb/DatabaseBoosterRole";
import { DatabaseCollectionManager } from "../DatabaseCollectionManager";
import { BoosterRole } from "@database/utils/aliceDb/BoosterRole";
import { OperationResult } from "@structures/core/OperationResult";

/**
 * A manager for the `boosterrole` collection.
 */
export class BoosterRoleCollectionManager extends DatabaseCollectionManager<
    DatabaseBoosterRole,
    BoosterRole
> {
    protected override readonly utilityInstance: new (
        data: DatabaseBoosterRole,
    ) => BoosterRole = BoosterRole;

    override get defaultDocument(): DatabaseBoosterRole {
        return {
            discordId: "",
            roleId: "",
        };
    }

    /**
     * Gets a booster role from a user's Discord ID.
     *
     * @param discordId The Discord ID of the user.
     * @returns The booster role, `null` if not found.
     */
    getFromDiscordId(discordId: string): Promise<BoosterRole | null> {
        return this.getOne({ discordId });
    }

    /**
     * Deletes a booster role from a user's Discord ID.
     *
     * @param discordId The Discord ID of the user.
     * @returns The result of the operation.
     */
    deleteFromDiscordId(discordId: string): Promise<OperationResult> {
        return this.deleteOne({ discordId });
    }
}
