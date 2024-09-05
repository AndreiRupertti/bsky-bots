import { ResultAsync, ok } from "@/common/utils/result";
import { type AppBskyRichtextFacet, AtpAgent, RichText } from "@atproto/api";

const getAgent = () => {
  return new AtpAgent({
    service: "https://bsky.social",
  });
};
type EmbedCardInput = { url: string; thumbUrl: string, title: string; description: string };
type EmbedImageInput = { url: string; alt: string };

export const postMessage = async (params: {
  rt: RichText;
  identifier: string;
  passowrd: string;
  facets?: AppBskyRichtextFacet.Main[];
  cardEmbed?: EmbedCardInput;
  images?: EmbedImageInput[];
}) => {
  const agent = getAgent();
  const loginResult = await ResultAsync(agent.login({ identifier: params.identifier, password: params.passowrd }));

  if (loginResult.isErr) return loginResult;

  let embed = {};
  if (params.images) embed = { embed: await embedImages(agent, params.images) };
  if (params.cardEmbed) embed = { embed: await embedWebsiteCard(agent, params.cardEmbed) };

  const postObject = {
    $type: "app.bsky.feed.post",
    text: params.rt.text,
    facets: params.facets ?? params.rt.facets,
    ...embed,
  };

  console.log(JSON.stringify(postObject, null, 2));
  const postMessageResult = await ResultAsync(agent.post(postObject));

  if (postMessageResult.isErr) return postMessageResult;

  return ok("message has been posted");
};

const embedImages = async (agent: AtpAgent, images: EmbedImageInput[]) => {
  const blobs = await Promise.all(
    images.map(({ url, alt }) => fetch(url).then((result) => ({ blob: result.blob(), alt }))),
  );

  const uploadedImages = [];
  for (const blob of blobs) {
    const result = await agent.uploadBlob(await blob.blob);

    if (!result.success) throw new Error("unable to upload image");

    uploadedImages.push({ alt: blob.alt, image: result.data.blob });
  }

  return {
    $type: "app.bsky.embed.images",
    images: uploadedImages,
  };
};

const embedWebsiteCard = async (agent: AtpAgent, cardEmbed: EmbedCardInput) => {
  const blob = await fetch(cardEmbed.thumbUrl).then((result) => result.blob());
  const result = await agent.uploadBlob(blob);
  if (!result.success) throw new Error("unable to upload image");

  return {
    $type: "app.bsky.embed.external",
    external: {
      uri: cardEmbed.url,
      title: cardEmbed.title,
      description: cardEmbed.description,
      thumb: result.data.blob,
    },
  };
};

export const buildMessage = (message: string) => {
  return new RichText({
    text: message,
  });
};
