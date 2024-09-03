import cron from 'node-cron'
import configs from '@/workers/config'

export const setup = () => {
    for (const cronConfig of configs) {
        cron.schedule(cronConfig.cronTimeframe, cronConfig.handler)
    }
}
