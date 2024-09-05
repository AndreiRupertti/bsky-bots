import { Bots } from "@/common/enums/bots";
import { error, ok } from "@/common/utils/result";
import { logger } from "@/server";
import * as bskyService from "@/services/bskyService";
import jsdom from "jsdom";
import { isAfter, subMinutes } from "date-fns";
const { JSDOM } = jsdom;

export const POST_INTERVAL_MINUTES = 10;

const getConfig = () => ({
  name: Bots.GAMESPOT,
  url: "https://www.gamespot.com/feeds/game-news",
  bskyUser: "BSKY_USER_GAMESPOT",
  bskyPassword: "BSKY_PASSWORD_GAMESPOT",
});


const setImageToBestQuality = (imageUrl: string) => {
  return imageUrl.replace("screen-medium", "original");
};

const extractDescription = (descriptionHtml: string) => {
  const html = new JSDOM(descriptionHtml);
  const paragraphs = [...html.window.document.getElementsByTagName('p')].slice(0, 2)

  return `${paragraphs.map(p => p.textContent).join('').trim().slice(0, 230)}...`
}
const readFeed = async (config: ReturnType<typeof getConfig>) => {
  const { url, name } = config;
  const response = await fetch(url);

  if (!response.ok) return error(`unable to fetch endpoint for bot ${name}`);
  const data = await response.text();

  const dom = new JSDOM(data, { contentType: "text/xml" });

  const feedItems = [...dom.window.document.getElementsByTagName("item")];

  const items = feedItems.map((feedItem) => {
    const title = feedItem.getElementsByTagName("title")[0]?.textContent!;
    const newsUrl = feedItem.getElementsByTagName("link")[0]?.textContent!;
    const description = extractDescription(feedItem.getElementsByTagName("description")[0].textContent!)
    const pubDate = new Date(feedItem.getElementsByTagName("pubDate")[0].textContent!);
    const imageUrl = setImageToBestQuality(feedItem.getElementsByTagName("media:content")[0].getAttribute("url")!);
    const imageAlt = title;

    return { title, description, newsUrl, imageUrl, imageAlt, pubDate };
  });

  return ok(items);
};

export const execute = async () => {
  const config = getConfig();
  const result = await readFeed(config);

  if (result.isErr) {
    logger.error(result.data.message);
    return result;
  }


  const newArticles = result.data.filter((item) => {
    const lastTimeFrame = subMinutes(new Date(), POST_INTERVAL_MINUTES + 1);
    return isAfter(item.pubDate, lastTimeFrame);
  })

  logger.info(newArticles);

  for (const article of newArticles) {

    // const cta = "Read more";
    const message = `${article.title}\n\n`;
  
    const rt = bskyService.buildMessage(message);
  
    const postResult = await bskyService.postMessage({
      identifier: process.env[config.bskyUser]!,
      passowrd: process.env[config.bskyPassword]!,
      cardEmbed: { url: article.newsUrl, thumbUrl: article.imageUrl, title: article.title, description: article.description },
      rt,
    });
  
    if (postResult.isErr) {
      logger.error(postResult.data.message)
    }
  }

  logger.info("GameSpot handler!");

  return ok("success");
};

