import { RequestResponse } from "@rian8337/osu-base";
import { Manager } from "@utils/base/Manager";
import { Image, loadImage } from "canvas";

export abstract class RESTManager extends Manager {
    /**
     * Sends a request to the specified URL.
     *
     * @param url The URL.
     * @param options The options of the request.
     * @returns The result of the request.
     */
    static async request(
        url: string | URL,
        options?: RequestInit,
    ): Promise<RequestResponse> {
        return fetch(url, options).then(async (res) => {
            return {
                statusCode: res.status,
                data: Buffer.from(await res.arrayBuffer()),
            } satisfies RequestResponse;
        });
    }

    /**
     * Downloads an image.
     *
     * @param url The image to download.
     * @returns The downloaded image, `null` if the image is not downloaded.
     */
    static async downloadImage(url: string | URL): Promise<Image | null> {
        const result = await this.request(url);

        if (result.statusCode !== 200) {
            return null;
        }

        try {
            return loadImage(result.data);
        } catch {
            return null;
        }
    }
}
