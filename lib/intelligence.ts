import { TEASER_LAUNCH_DATE } from "@/lib/config";
import { buildSnapshot } from "@/lib/analysis";
import { seedItems } from "@/lib/mock-data";
import { fetchGoogleNews } from "@/lib/rss";
import { fetchYouTube } from "@/lib/youtube";
import { fetchReddit } from "@/lib/reddit";
import { fetchXSignals } from "@/lib/x";
export async function updateIntelligence(lastRun?: string) {
  const to = new Date().toISOString().slice(0, 10);
  const from = lastRun || TEASER_LAUNCH_DATE;
  const batches = await Promise.all([fetchGoogleNews(from, to), fetchYouTube(from, to), fetchReddit(), fetchXSignals()]);
  const items = [...seedItems, ...batches.flat()];
  return buildSnapshot(items, TEASER_LAUNCH_DATE, to);
}
