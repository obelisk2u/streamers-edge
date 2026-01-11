import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const login = process.argv[2] ?? "supertf";
const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const outputPath =
  process.argv[3] ??
  path.join(scriptDir, "..", "public", "data", "emotes.json");

async function fetchJson(url, headers = {}) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "streamers-edge-emotes/1.0",
      ...headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed ${response.status} ${response.statusText} for ${url}`);
  }
  return response.json();
}

function pick7tvFile(host) {
  if (!host?.files?.length) {
    return null;
  }
  const preferred =
    host.files.find((file) => file.name === "2x.webp") ??
    host.files.find((file) => file.name === "2x.png") ??
    host.files.find((file) => file.name === "1x.webp") ??
    host.files.find((file) => file.name === "1x.png") ??
    host.files[0];
  return preferred ? `https:${host.url}/${preferred.name}` : null;
}

function normalizeList(entries, provider) {
  return entries
    .filter((entry) => entry.code && entry.url)
    .map((entry) => ({
      code: entry.code,
      url: entry.url,
      provider,
    }));
}

async function main() {
  const twitchClientId = process.env.TWITCH_CLIENT_ID;
  const twitchToken = process.env.TWITCH_TOKEN;
  const twitchProfile = await fetchJson(
    `https://api.ivr.fi/v2/twitch/user?login=${encodeURIComponent(login)}`
  );
  const profileData = Array.isArray(twitchProfile)
    ? twitchProfile[0]
    : twitchProfile;
  const twitchId = profileData?.id ?? profileData?.twitch_id;
  if (!twitchId) {
    throw new Error(`Could not resolve Twitch ID for ${login}`);
  }

  const [bttvGlobal, bttvUser, sevenTvGlobal, sevenTvUser] = await Promise.all([
    fetchJson("https://api.betterttv.net/3/cached/emotes/global"),
    fetchJson(`https://api.betterttv.net/3/cached/users/twitch/${twitchId}`),
    fetchJson("https://7tv.io/v3/emote-sets/global"),
    fetchJson(`https://7tv.io/v3/users/twitch/${twitchId}`),
  ]);

  const bttvGlobalEntries = normalizeList(
    bttvGlobal.map((emote) => ({
      code: emote.code,
      url: `https://cdn.betterttv.net/emote/${emote.id}/2x`,
    })),
    "bttv"
  );

  const bttvChannelEntries = normalizeList(
    [...(bttvUser.channelEmotes ?? []), ...(bttvUser.sharedEmotes ?? [])].map(
      (emote) => ({
        code: emote.code,
        url: `https://cdn.betterttv.net/emote/${emote.id}/2x`,
      })
    ),
    "bttv"
  );

  const sevenTvGlobalEntries = normalizeList(
    (sevenTvGlobal.emotes ?? [])
      .map((emote) => ({
        code: emote.name,
        url: pick7tvFile(emote.data?.host),
      }))
      .filter((emote) => emote.url),
    "7tv"
  );

  const sevenTvChannelEntries = normalizeList(
    (sevenTvUser.emote_set?.emotes ?? [])
      .map((emote) => ({
        code: emote.name,
        url: pick7tvFile(emote.data?.host),
      }))
      .filter((emote) => emote.url),
    "7tv"
  );

  let twitchGlobalEntries = [];
  let twitchChannelEntries = [];
  if (twitchClientId && twitchToken) {
    const twitchHeaders = {
      "Client-Id": twitchClientId,
      Authorization: `Bearer ${twitchToken}`,
    };
    const [twitchGlobal, twitchChannel] = await Promise.all([
      fetchJson(
        "https://api.twitch.tv/helix/chat/emotes/global",
        twitchHeaders
      ),
      fetchJson(
        `https://api.twitch.tv/helix/chat/emotes?broadcaster_id=${twitchId}`,
        twitchHeaders
      ),
    ]);

    twitchGlobalEntries = normalizeList(
      (twitchGlobal.data ?? []).map((emote) => ({
        code: emote.name,
        url: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/2.0`,
      })),
      "twitch"
    );

    twitchChannelEntries = normalizeList(
      (twitchChannel.data ?? []).map((emote) => ({
        code: emote.name,
        url: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/2.0`,
      })),
      "twitch"
    );
  }

  const emoteMap = new Map();
  [
    ...bttvChannelEntries,
    ...sevenTvChannelEntries,
    ...twitchChannelEntries,
    ...bttvGlobalEntries,
    ...sevenTvGlobalEntries,
    ...twitchGlobalEntries,
  ]
    .forEach((entry) => {
      if (!emoteMap.has(entry.code)) {
        emoteMap.set(entry.code, entry);
      }
    });

  const payload = {
    updated_at: new Date().toISOString(),
    channel: {
      name: login,
      id: String(twitchId),
    },
    emotes: Array.from(emoteMap.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    ),
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");

  console.log(`Saved ${payload.emotes.length} emotes to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
