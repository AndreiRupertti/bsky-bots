import { Bots } from "@/common/enums/bots";
import * as gameSpotBot from "./gamespot-bot";

const strategies = [{ name: Bots.GAMESPOT, execute: gameSpotBot.execute }];

export const getStrategyByName = (name: string) => {
  return strategies.find((strat) => strat.name === name);
};
