import { DatabasePrototypePPType } from "@structures/database/aliceDb/DatabasePrototypePPType";
import { DatabaseCollectionManager } from "../DatabaseCollectionManager";
import { PrototypePPType } from "@database/utils/aliceDb/PrototypePPType";
import { ApplicationCommandOptionChoiceData } from "discord.js";
import { FindOptions } from "mongodb";

/**
 * A manager for the `prototypepptype` collection.
 */
export class PrototypePPTypeCollectionManager extends DatabaseCollectionManager<
    DatabasePrototypePPType,
    PrototypePPType
> {
    protected override readonly utilityInstance: new (
        data: DatabasePrototypePPType,
    ) => PrototypePPType = PrototypePPType;

    override get defaultDocument(): DatabasePrototypePPType {
        return {
            name: "",
            type: "",
            description: "",
        };
    }

    /**
     * Checks whether a rework type exists in the database.
     *
     * @param reworkType The rework type to check.
     * @returns Whether the rework type exists in the database.
     */
    async reworkTypeExists(reworkType: string): Promise<boolean> {
        return (
            (await this.getOne(
                { type: reworkType },
                { projection: { _id: 0, type: 1 } },
            )) !== null
        );
    }

    /**
     * Searches reworks based on name for autocomplete response.
     *
     * @param searchQuery The name to search.
     * @param amount The maximum amount of reworks to return. Defaults to 25.
     * @returns The reworks that match the query.
     */
    async searchReworkTypesForAutocomplete(
        searchQuery: string | RegExp,
        amount = 25,
    ): Promise<ApplicationCommandOptionChoiceData<string>[]> {
        const result = await this.collection
            .find(
                { name: new RegExp(searchQuery, "i") },
                { projection: { _id: 0, name: 1, type: 1 } },
            )
            .limit(amount)
            .toArray();

        return result.map((v) => {
            return {
                name: v.name,
                value: v.type,
            };
        });
    }

    /**
     * Gets a rework type from its type.
     *
     * @param type The type of the rework.
     * @param options The options for finding the rework type.
     * @returns The rework type, `null` if not found.
     */
    getFromType(
        type: string,
        options?: FindOptions,
    ): Promise<PrototypePPType | null> {
        return this.getOne({ type: type }, this.processFindOptions(options));
    }
}
