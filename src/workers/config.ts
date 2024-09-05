import { Bots } from "@/common/enums/bots";
import { messagePostHandler } from "./message-post/message-post-handler";
import { POST_INTERVAL_MINUTES } from "@/domain/bots/gamespot-bot";

export default [{ name: Bots.GAMESPOT, cronTimeframe: `0 */${POST_INTERVAL_MINUTES} * * * *`, handler: messagePostHandler(Bots.GAMESPOT) }];
