import { IntelligenceItem } from "@/lib/types";
import { uid } from "@/lib/utils";
import { getWeekId } from "@/lib/dates";
import { classifySentiment } from "@/lib/analysis";
export async function fetchYouTube(from: string, to: string): Promise<IntelligenceItem[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];
  const q = encodeURIComponent("Harry Potter HBO Max serie Brasil");
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=25&regionCode=BR&order=date&q=${q}&publishedAfter=${from}T00:00:00Z&publishedBefore=${to}T23:59:59Z&key=${key}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map((v: any) => {
      const s = v.snippet;
      const c = classifySentiment(`${s.title} ${s.description}`);
      return { id: uid(v.id.videoId), title: s.title, source: s.channelTitle, sourceKind: "youtube", url: `https://www.youtube.com/watch?v=${v.id.videoId}`, publishedAt: s.publishedAt, weekId: getWeekId(s.publishedAt.slice(0, 10)), summary: s.description || "Video brasileiro relacionado a serie Harry Potter.", sentiment: c.sentiment, sentimentReason: c.reason, riskScore: c.sentiment === "negative" ? 50 : 18, opportunityScore: c.sentiment === "positive" ? 82 : 44, relevanceScore: 68, tags: ["youtube", "creator", "brasil"], reach: 70, region: "BR", creator: s.channelTitle };
    });
  } catch { return []; }
}
