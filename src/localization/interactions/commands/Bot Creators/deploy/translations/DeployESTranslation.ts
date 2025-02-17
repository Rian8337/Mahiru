import { Translation } from "@localization/base/Translation";
import { DeployStrings } from "../DeployLocalization";

/**
 * The Spanish translation for the `deploy` command.
 */
export class DeployESTranslation extends Translation<DeployStrings> {
    override readonly translations: DeployStrings = {
        commandNotFound:
            "¡Lo siento! No puedo encontrar ningun comando con ese nombre.",
        commandDeploySuccessful: "Comando %s registrado correctamente.",
    };
}
