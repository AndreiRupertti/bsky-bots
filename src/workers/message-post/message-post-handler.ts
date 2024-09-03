import { error } from "@/common/utils/result"
import { getStrategyByName } from "@/domain/bots/botService"

export const messagePostHandler = (botName: string) => () => {
    console.log('Running strat for ', botName)
    const strat = getStrategyByName(botName)

    if (!strat) return error(`unable to find strategy for ${botName}`)
    strat.execute()
}

export const runMultiplePosts = (botNames: string[]) => () => {

    for (const botName of botNames) {
        const handler = messagePostHandler(botName)
        handler()
    }
}