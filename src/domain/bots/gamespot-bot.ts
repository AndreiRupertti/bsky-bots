import { Bots } from "@/common/enums/bots";
import { error, ok } from "@/common/utils/result";
import { logger } from "@/server";
import * as bskyService from "@/services/bskyService";
import jsdom from "jsdom";
const { JSDOM } = jsdom;

const getConfig = () => ({
  name: Bots.GAMESPOT,
  url: "https://www.gamespot.com/news/",
  querySelector: ".promo--object",
  bskyUser: "BSKY_USER_GAMESPOT",
  bskyPassword: "BSKY_PASSWORD_GAMESPOT",
});

const scrape = async (config: ReturnType<typeof getConfig>) => {
  const { url, querySelector, name } = config
  const response = await fetch(url);

  if (!response.ok) return error(`unable to fetch endpoitn for bot ${name}`)
  const data = await response.text();

  const dom = new JSDOM(data);

  const latestNews = dom.window.document.querySelector(querySelector);

  if (!latestNews) return error('unable to find latest news')
  
  const title = latestNews.querySelector('h2')?.textContent!
  const description = latestNews.querySelector('span')?.textContent!
  const imageUrl = latestNews.querySelector('.content img')?.getAttribute('src')!
  const imageAlt = latestNews.querySelector('.content img')?.getAttribute('alt')!
  const newsUrl = latestNews.getAttribute('href')!

  return ok({ title, description, newsUrl, imageUrl, imageAlt })
};

export const execute = async () => {
  const config = getConfig()
  const result = await scrape(config);

  if (result.isErr) {
    logger.error(result.data.message)
    return result
  }

  const { title, description, imageAlt, imageUrl, newsUrl } = result.data

  const cta = 'Read more'
  const message = `${title}\n\n${description}\n${cta}`;

  const rt = bskyService.buildMessage(message)

  const postResult = await bskyService.postMessage({
    identifier: process.env[config.bskyUser]!,
    passowrd: process.env[config.bskyPassword]!,
    images: [{ url: imageUrl, alt: description }],
    facets: [
      {
        index: {
          byteStart: message.length - cta.length,
          byteEnd: message.length,
        },
        features: [
          {
            $type: "app.bsky.richtext.facet#link",
            uri: newsUrl,
          },
        ],
      },
    ],
    rt,
  });

  if (postResult.isErr) {
    logger.error(postResult.data.message)
    return postResult
  }

  logger.info("GameSpot handler!");

  return ok('success');
};
