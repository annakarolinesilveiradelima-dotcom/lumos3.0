import { IntelligenceItem } from "@/lib/types";
import { classifySentiment } from "@/lib/analysis";
import { getWeekId } from "@/lib/dates";
import { cleanText, host, uid } from "@/lib/utils";

const GOOGLE_NEWS_BASE = "https://news.google.com/rss/search";

const CORE_QUERIES = [
  '"Harry Potter" "HBO"',
  '"Harry Potter" "HBO Max"',
  '"Harry Potter" "Max" "série"',
  '"Harry Potter" "nova série"',
  '"Harry Potter" "teaser" "HBO"',
  '"Harry Potter" "elenco" "HBO"',
  '"Harry Potter" "estreia" "HBO"',
  '"Harry Potter" "Wizarding World"',
  '"Harry Potter" "Hogwarts" "HBO"'
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
  "terra.com.br",
  "cnnbrasil.com.br",
  "uol.com.br/splash",
  "tecmundo.com.br",
  "harrypotter.com",
  "press.wbd.com"
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
