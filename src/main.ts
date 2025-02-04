import "module-alias/register";
import { config } from "dotenv";
import { Bot } from "@core/Bot";
import {
    DroidAPIRequestBuilder,
    OsuAPIRequestBuilder,
} from "@rian8337/osu-base";
process.env.UV_THREADPOOL_SIZE = "128";

config();

DroidAPIRequestBuilder.setAPIKey(process.env.DROID_API_KEY!);
OsuAPIRequestBuilder.setAPIKey(process.env.OSU_API_KEY!);

const bot = new Bot();

bot.start().catch((e) => {
    console.error(e);
    process.exit(1);
});
