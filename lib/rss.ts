import { IntelligenceItem } from "@/lib/types";
import { classifySentiment } from "@/lib/analysis";
import { getWeekId } from "@/lib/dates";
import { cleanText, host, uid } from "@/lib/utils";

const GOOGLE_NEWS_BASE = "https://news.google.com/rss/search";

const QUERIES = [
  "Harry Potter HBO Max série",
  "Harry Potter série HBO",
  "Harry Potter HBO Brasil",
  "Harry Potter HBO Max Brasil",
  "Harry Potter teaser HBO",
  "Harry Potter elenco HBO",
  "Harry Potter reboot HBO",
  "Harry Potter Max série",
  "Harry Potter Wizarding World HBO",
  "Harry Potter HBO Max estreia",
  "Harry Potter nova série",
  "Harry Potter série streaming"
];

const PRIORITY_SITES = [
  "omelete.com.br",
  "jovemnerd.com.br",
  "legiaodosherois.com.br",
  "observatoriodocinema.uol.com.br",
  "adorocinema.com",
  "br.ign.com",
  "cinepop.com.br",
  "papelpop.com",
  "terra.com.br/diversao",
  "cnnbrasil.com.br/pop",
  "uol.com.br/splash",
  "tecmundo.com.br",
  "harrypotter.com",
  "press.wbd.com",
  "hbo.com",
  "max.com"
];

function rssUrl(query: string, from: string, to: string) {
  const q = encodeURIComponent(`${query} after:${from} before:${to}`);

  return `${GOOGLE_NEWS_BASE}?q=${q}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
}

function decodeXml(value: string) {
  return cleanText(
    String(value || "")
      .replace(/<!\[CDATA\[/g, "")
      .replace(/\]\]>/g, "")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
  );
}

function extractTag(xml: string, tag: string) {
  const match = xml.match(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
  );

  return match ? decodeXml(match[1]) : "";
}

function extractSource(itemXml: string, fallbackUrl: string) {
  const sourceMatch = itemXml.match(
    /<source[^>]*url="([^"]*)"[^>]*>([\s\S]*?)<\/source>/i
  );

  if (sourceMatch) {
    return {
      sourceUrl: decodeXml(sourceMatch[1]),
      sourceName: decodeXml(sourceMatch[2])
    };
  }

  return {
    sourceUrl: fallbackUrl,
    sourceName: host(fallbackUrl)
  };
}

function classifyTags(title: string, summary: string, query: string) {
  const text = `${title} ${summary} ${query}`.toLowerCase();
  const tags = new Set<string>(["news", "brasil"]);

  if (text.includes("teaser") || text.includes("trailer")) {
    tags.add("teaser");
  }

  if (text.includes("elenco") || text.includes("cast")) {
    tags.add("casting");
  }

  if (
    text.includes("estreia") ||
    text.includes("premiere") ||
    text.includes("lançamento")
  ) {
    tags.add("release");
  }

  if (text.includes("hbo") || text.includes("max")) {
    tags.add("hbo-max");
  }

  if (text.includes("fãs") || text.includes("fandom")) {
    tags.add("fandom");
  }

  if (text.includes("j.k") || text.includes("rowling")) {
    tags.add("reputation-risk");
  }

  if (text.includes("filme") || text.includes("cinema")) {
    tags.add("comparison");
  }

  return [...tags];
}

function buildItem(itemXml: string, query: string): IntelligenceItem | null {
  const title = extractTag(itemXml, "title");
  const link = extractTag(itemXml, "link");
  const pubDate = extractTag(itemXml, "pubDate");
  const description = extractTag(itemXml, "description");

  if (!title || !link || !pubDate) {
    return null;
  }

  const publishedAt = new Date(pubDate).toISOString();
  const source = extractSource(itemXml, link);
  const summary = description || `Matéria encontrada pela IA para a busca: ${query}.`;
  const sentiment = classifySentiment(`${title} ${summary}`);
  const tags = classifyTags(title, summary, query);

  const isOfficial =
    /harrypotter\.com|press\.wbd\.com|hbo\.com|max\.com/i.test(
      source.sourceUrl || link
    );

  const riskBase =
    sentiment.sentiment === "negative"
      ? 56
      : tags.includes("reputation-risk")
        ? 52
        : 22;

  const oppBase =
    sentiment.sentiment === "positive"
      ? 82
      : tags.includes("teaser") || tags.includes("release")
        ? 78
        : 58;

  return {
    id: uid(`${title}-${link}-${publishedAt}`),
    title,
    source: source.sourceName || host(link),
    sourceKind: isOfficial ? "official" : "news",
    url: link,
    publishedAt,
    weekId: getWeekId(publishedAt.slice(0, 10)),
    summary: `A IA encontrou esta fonte ao monitorar “${query}”. ${summary}`.slice(
      0,
      420
    ),
    sentiment: sentiment.sentiment,
    sentimentReason: sentiment.reason,
    riskScore: riskBase,
    opportunityScore: oppBase,
    relevanceScore: 72,
    tags,
    reach: isOfficial ? 92 : 68,
    region: "BR"
  };
}

async function fetchQuery(
  query: string,
  from: string,
  to: string
): Promise<IntelligenceItem[]> {
  try {
    const res = await fetch(rssUrl(query, from, to), {
      headers: {
        "user-agent": "Lumos Entertainment Intelligence/2.2"
      },
      next: {
        revalidate: 900
      }
    });

    if (!res.ok) {
      return [];
    }

    const xml = await res.text();

    const itemMatches = [...xml.matchAll(/<item>[\s\S]*?<\/item>/gi)].map(
      (match) => match[0]
    );

    return itemMatches
      .map((itemXml) => buildItem(itemXml, query))
      .filter(Boolean)
      .slice(0, 20) as IntelligenceItem[];
  } catch {
    return [];
  }
}

function dedupe(items: IntelligenceItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.title
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúãõç]/gi, "")
      .slice(0, 95);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export async function fetchGoogleNews(
  from: string,
  to: string
): Promise<IntelligenceItem[]> {
  const coreQueries = QUERIES;

  const siteQueries = PRIORITY_SITES.map(
    (site) => `Harry Potter HBO Max site:${site}`
  );

  const allQueries = [...coreQueries, ...siteQueries];

  const batches: IntelligenceItem[][] = [];
  const concurrency = 5;

  for (let i = 0; i < allQueries.length; i += concurrency) {
    const chunk = allQueries.slice(i, i + concurrency);

    const results = await Promise.all(
      chunk.map((query) => fetchQuery(query, from, to))
    );

    batches.push(...results);
  }

  return dedupe(batches.flat())
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, 220);
}
