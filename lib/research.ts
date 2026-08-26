export interface ResearchResult {
  summary: string;
  facts: string[];
  sourceUrl?: string;
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

async function extractPageMeta(pageUrl: string): Promise<{ description?: string; themeColor?: string }> {
  try {
    const res = await fetchWithTimeout(pageUrl, { headers: { "User-Agent": "Mozilla/5.0 (ppt-auto-bot)" } });
    if (!res.ok) return {};
    const html = await res.text();
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    const themeMatch = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i);
    return {
      description: descMatch?.[1],
      themeColor: themeMatch?.[1],
    };
  } catch {
    return {};
  }
}

/**
 * Looks up the target institution on the web to ground content generation in real facts
 * and (when available) pick up on its actual brand color. Requires NAVER_CLIENT_ID /
 * NAVER_CLIENT_SECRET (free tier at https://developers.naver.com) — without them this
 * quietly returns null and the rest of the pipeline falls back to keyword-based design/content.
 */
export async function researchInstitution(input: {
  institutionName: string;
  institutionUrl?: string;
  topic: string;
}): Promise<ResearchResult | null> {
  if (!input.institutionName.trim()) return null;

  try {
    let sourceUrl = input.institutionUrl;
    const facts: string[] = [];

    const items = await searchNaver(`${input.institutionName} ${input.topic}`);
    for (const item of items.slice(0, 3)) {
      facts.push(`${item.title}: ${item.description}`);
    }
    if (!sourceUrl && items.length > 0) {
      sourceUrl = items[0].link;
    }

    if (facts.length === 0 && !sourceUrl) return null;

    let themeColor: string | undefined;
    if (sourceUrl) {
      const meta = await extractPageMeta(sourceUrl);
      if (meta.description) facts.unshift(meta.description);
      themeColor = meta.themeColor?.replace("#", "");
    }

    if (facts.length === 0) return null;

    return {
      summary: facts.slice(0, 3).join(" / "),
      facts,
      sourceUrl,
      themeColor,
    };
  } catch {
    return null;
  }
}
