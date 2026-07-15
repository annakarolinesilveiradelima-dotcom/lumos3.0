import { IntelligenceItem } from "@/lib/types";
import { uid } from "@/lib/utils";
import { getWeekId } from "@/lib/dates";
import { classifySentiment } from "@/lib/analysis";
export async function fetchReddit(): Promise<IntelligenceItem[]> {
  try {
    const res = await fetch("https://www.reddit.com/search.json?q=Harry%20Potter%20HBO%20series&sort=new&limit=25", { headers: { "User-Agent": process.env.REDDIT_USER_AGENT || "Lumos/2.1" }, next: { revalidate: 900 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data?.children || []).map((x: any) => {
      const p = x.data;
      const publishedAt = new Date(p.created_utc * 1000).toISOString();
      const c = classifySentiment(`${p.title} ${p.selftext || ""}`);
      return { id: uid(p.permalink), title: p.title, source: `r/${p.subreddit}`, sourceKind: "reddit", url: `https://reddit.com${p.permalink}`, publishedAt, weekId: getWeekId(publishedAt.slice(0, 10)), summary: (p.selftext || "Discussao no Reddit sobre Harry Potter e a nova serie.").slice(0, 260), sentiment: c.sentiment, sentimentReason: c.reason, riskScore: c.sentiment === "negative" ? 64 : 28, opportunityScore: c.sentiment === "positive" ? 70 : 48, relevanceScore: 55, tags: ["reddit", "fandom", "global"], reach: Math.min(100, 20 + (p.score || 0)), region: "Global" };
    });
  } catch { return []; }
}
