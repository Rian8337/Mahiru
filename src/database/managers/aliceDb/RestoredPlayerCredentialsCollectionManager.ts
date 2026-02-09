import { RestoredPlayerCredentials } from "@database/utils/aliceDb/RestoredPlayerCredentials";
import { DatabaseRestoredPlayerCredentials } from "structures/database/aliceDb/DatabaseRestoredPlayerCredentials";
import { FindOptions } from "mongodb";
import { DatabaseCollectionManager } from "../DatabaseCollectionManager";

/**
 * A manager for the `restoredplayercredentials` collection.
 */
export class RestoredPlayerCredentialsCollectionManager extends DatabaseCollectionManager<
    DatabaseRestoredPlayerCredentials,
    RestoredPlayerCredentials
> {
    protected override readonly utilityInstance: new (
        data: DatabaseRestoredPlayerCredentials,
    ) => RestoredPlayerCredentials = RestoredPlayerCredentials;

    override get defaultDocument(): DatabaseRestoredPlayerCredentials {
        return {
            Id: 0,
            Username: "",
            Password: "",
            Email: "",
            DeviceId: "",
            Score: 0,
            Playcount: 0,
            Accuracy: 0,
            RegistTime: "",
            LastLoginTime: "",
            RegistIp: "",
            Region: "",
            Active: true,
            Supporter: false,
            Banned: false,
            RestrictMode: false,
        };
    }

    protected override processFindOptions(
        options?: FindOptions,
    ): FindOptions | undefined {
        if (options?.projection) {
            options.projection.Id = 1;
        }

        return super.processFindOptions(options);
    }
}
