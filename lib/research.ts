import { ResearchSource } from "./types";

export interface ResearchResult {
  sources: ResearchSource[];
  themeColor?: string;
}

interface NaverWebItem {
  title: string;
  link: string;
  description: string;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

function publisherFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "출처 확인 필요";
  }
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 6000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function searchNaver(query: string): Promise<NaverWebItem[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return [];

  const url = `https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(query)}&display=5`;
  const res = await fetchWithTimeout(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: NaverWebItem[] };
  return (data.items ?? []).map((item) => ({
    title: stripTags(item.title),
    link: item.link,
    description: stripTags(item.description),
  }));
}

async function searchBingRss(query: string): Promise<NaverWebItem[]> {
  try {
    const url = `https://www.bing.com/search?format=rss&q=${encodeURIComponent(query)}`;
    const res = await fetchWithTimeout(url, { headers: { "User-Agent": "Mozilla/5.0 (ppt-auto-bot)" } }, 9000);
    if (!res.ok) return [];
    const xml = await res.text();
    return [...xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<description>([\s\S]*?)<\/description>[\s\S]*?<\/item>/gi)]
      .slice(0, 5)
      .map((m) => ({ title: stripTags(m[1]), link: m[2].trim(), description: stripTags(m[3]) }));
  } catch {
    return [];
  }
}

function metaContent(html: string, key: string): string | undefined {
  const tag = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*>`, "i"))?.[0];
  if (!tag) return undefined;
  return tag.match(/content=["']([^"']+)["']/i)?.[1];
}

async function extractPageMeta(pageUrl: string): Promise<{ description?: string; themeColor?: string; imageUrl?: string }> {
  try {
    const res = await fetchWithTimeout(pageUrl, { headers: { "User-Agent": "Mozilla/5.0 (ppt-auto-bot)" } });
    if (!res.ok) return {};
    const html = await res.text();
    const rawImage = metaContent(html, "og:image");
    return {
      description: metaContent(html, "description") ?? metaContent(html, "og:description"),
      themeColor: metaContent(html, "theme-color"),
      imageUrl: rawImage ? new URL(rawImage, pageUrl).toString() : undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Looks up the target institution on the web to ground content generation in real, cited facts
 * and (when available) pick up on its actual brand color. Every fact becomes a ResearchSource
 * with a stable id (S1, S2, ...) so slide content can cite exactly which claim it's based on,
 * instead of loosely paraphrasing an unattributed blob of text.
 *
 * Requires NAVER_CLIENT_ID / NAVER_CLIENT_SECRET (free tier at https://developers.naver.com) —
 * without them this quietly returns null and the rest of the pipeline falls back to
 * keyword-based design/content with no fabricated sources.
 */
export async function researchInstitution(input: {
  institutionName: string;
  institutionUrl?: string;
  topic: string;
  audience?: string;
  /** Doc-type-specific search angles (e.g. IR → "시장 규모", 회사소개서 → "주요 제품"). */
  angles?: string[];
}): Promise<ResearchResult | null> {
  if (!input.institutionName.trim()) return null;

  try {
    const sourceUrl = input.institutionUrl;
    const sources: ResearchSource[] = [];
    const accessedAt = new Date().toISOString();
    let nextId = 1;

    // Two queries: the plain brief, plus one biased by the document type's angle,
    // so an IR deck surfaces market/funding coverage while a 회사소개서 surfaces
    // product/company coverage for the very same institution.
    const audience = input.audience?.trim() ?? "";
    const queries = [
      `"${input.topic}" ${audience} ${input.angles?.[0] ?? "활용 사례"}`.trim(),
      `${input.topic} ${input.angles?.[1] ?? "사용 방법"} ${input.institutionName}`.trim(),
    ];

    const hasNaver = Boolean(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET);
    const results = await Promise.all(queries.map((q) => (hasNaver ? searchNaver(q) : searchBingRss(q)).catch(() => [])));
    const seenLinks = new Set<string>();
    const items = results.flat().filter((item) => {
      if (seenLinks.has(item.link)) return false;
      seenLinks.add(item.link);
      return true;
    });

    const itemMeta = await Promise.all(items.slice(0, 5).map((item) => extractPageMeta(item.link)));
    for (const [index, item] of items.slice(0, 5).entries()) {
      sources.push({
        id: `S${nextId++}`,
        title: item.title,
        url: item.link,
        publisher: publisherFromUrl(item.link),
        excerpt: item.description,
        accessedAt,
        imageUrl: itemMeta[index]?.imageUrl,
      });
    }
    let themeColor: string | undefined;
    if (sourceUrl) {
      const meta = await extractPageMeta(sourceUrl);
      if (meta.description) {
        sources.unshift({
          id: `S${nextId++}`,
          title: `${input.institutionName} 공식 페이지`,
          url: sourceUrl,
          publisher: publisherFromUrl(sourceUrl),
          excerpt: meta.description,
          accessedAt,
          imageUrl: meta.imageUrl,
        });
      }
      themeColor = meta.themeColor?.replace("#", "");
    }

    if (sources.length === 0) return null;

    return { sources, themeColor };
  } catch {
    return null;
  }
}
