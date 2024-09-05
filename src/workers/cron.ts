import configs from "@/workers/config";
import cron from "node-cron";

export const setup = () => {
  for (const cronConfig of configs) {
    cron.schedule(cronConfig.cronTimeframe, cronConfig.handler);
  }
};
