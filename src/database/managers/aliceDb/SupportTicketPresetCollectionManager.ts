import { DatabaseSupportTicketPreset } from "@structures/database/aliceDb/DatabaseSupportTicketPreset";
import { DatabaseCollectionManager } from "../DatabaseCollectionManager";
import { SupportTicketPreset } from "@database/utils/aliceDb/SupportTicketPreset";
import { ApplicationCommandOptionChoiceData } from "discord.js";

export class SupportTicketPresetCollectionManager extends DatabaseCollectionManager<
    DatabaseSupportTicketPreset,
    SupportTicketPreset
> {
    protected override readonly utilityInstance = SupportTicketPreset;

    override get defaultDocument(): DatabaseSupportTicketPreset {
        return {
            id: 0,
            name: "",
            title: "",
        };
    }

    /**
     * Searches presets based on its name for autocomplete response.
     *
     * @param name The name to search.
     * @param amount The maximum amount of names to return. Defaults to 25.
     * @returns The name of the presets that match the query.
     */
    async searchPresets(
        name: string | RegExp,
        amount = 25,
    ): Promise<ApplicationCommandOptionChoiceData<string>[]> {
        let regExp: RegExp;

        try {
            regExp = new RegExp(name, "i");
        } catch {
            return [];
        }

        const result = await this.collection
            .find({ name: regExp }, { projection: { _id: 0, name: 1 } })
            .limit(amount)
            .toArray();

        return result.map((v) => {
            return {
                name: v.name,
                value: v.name,
            };
        });
    }
}
