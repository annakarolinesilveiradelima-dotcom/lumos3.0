import { IntelligenceItem } from "@/lib/types";
import { cleanText, host, uid } from "@/lib/utils";
import { getWeekId } from "@/lib/dates";
import { classifySentiment } from "@/lib/analysis";
export async function fetchGoogleNews(from: string, to: string): Promise<IntelligenceItem[]> {
  const query = encodeURIComponent(`Harry Potter HBO Max serie Brasil after:${from} before:${to}`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
  try {
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) return [];
    const xml = await res.text();
    const matches = [...xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>[\s\S]*?<description>([\s\S]*?)<\/description>[\s\S]*?<\/item>/g)];
    return matches.slice(0, 70).map((m) => {
      const title = cleanText(m[1]);
      const link = cleanText(m[2]);
      const summary = cleanText(m[4]).slice(0, 260);
      const publishedAt = new Date(cleanText(m[3])).toISOString();
      const c = classifySentiment(`${title} ${summary}`);
      return { id: uid(title + link), title, source: host(link).includes("google") ? "Google News Brasil" : host(link), sourceKind: "news", url: link, publishedAt, weekId: getWeekId(publishedAt.slice(0, 10)), summary, sentiment: c.sentiment, sentimentReason: c.reason, riskScore: c.sentiment === "negative" ? 55 : 19, opportunityScore: c.sentiment === "positive" ? 76 : 48, relevanceScore: 60, tags: ["news", "brasil", "harry-potter"], reach: 60, region: "BR" };
    });
  } catch { return []; }
}
