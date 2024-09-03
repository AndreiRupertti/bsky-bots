import { Bots } from "@/common/enums/bots";
import { messagePostHandler } from "./message-post/message-post-handler";

export default [{ name: Bots.GAMESPOT, cronTimeframe: "0 */3 * * *", handler: messagePostHandler(Bots.GAMESPOT) }];