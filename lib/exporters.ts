import { IntelligenceSnapshot } from "@/lib/types";
export function toCSV(snapshot: IntelligenceSnapshot) {
  const rows = [["weekId", "publishedAt", "source", "type", "sentiment", "riskScore", "opportunityScore", "relevanceScore", "title", "summary", "url"], ...snapshot.items.map((i) => [i.weekId, i.publishedAt, i.source, i.sourceKind, i.sentiment, String(i.riskScore), String(i.opportunityScore), String(i.relevanceScore), i.title, i.summary, i.url])];
  return rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
}
