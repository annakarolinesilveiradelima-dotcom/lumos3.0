import { IntelligenceItem } from "@/lib/types";
import { getWeekId } from "@/lib/dates";
import { uid } from "@/lib/utils";

type SeedInput = Omit<IntelligenceItem, "id" | "weekId" | "relevanceScore">;

function item(input: SeedInput): IntelligenceItem {
  return {
    ...input,
    id: uid(input.title + input.url + input.publishedAt),
    weekId: getWeekId(input.publishedAt.slice(0, 10)),
    relevanceScore: Math.round(
      (input.reach + input.opportunityScore + (100 - input.riskScore)) / 3
    )
  };
}

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function googleNewsUrl(query: string, after: string, before: string) {
  return `https://news.google.com/search?q=${encodeURIComponent(
    `${query} after:${after} before:${before}`
  )}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
}

function googleSearchUrl(query: string, after: string, before: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(
    `${query} after:${after} before:${before}`
  )}&hl=pt-BR&gl=BR`;
}

function youtubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    query
  )}`;
}

function redditSearchUrl(query: string) {
  return `https://www.reddit.com/search/?q=${encodeURIComponent(
    query
  )}&sort=new`;
}

const editorialThemes = [
  {
    tag: "teaser",
    narrative:
      "Teaser oficial e retorno a Hogwarts seguem como principal âncora de conversa.",
    risk: 18,
    opp: 92,
    sentiment: "positive" as const
  },
  {
    tag: "fandom",
    narrative:
      "Fandom compara nova série com os filmes e reage a qualquer detalhe de produção.",
    risk: 48,
    opp: 74,
    sentiment: "neutral" as const
  },
  {
    tag: "casting",
    narrative:
      "Discussões sobre elenco, caracterização e fidelidade aos livros concentram atenção.",
    risk: 58,
    opp: 68,
    sentiment: "neutral" as const
  },
  {
    tag: "nostalgia",
    narrative:
      "Nostalgia, maratonas e lembrança dos filmes sustentam conversa always-on.",
    risk: 16,
    opp: 86,
    sentiment: "positive" as const
  },
  {
    tag: "brasil",
    narrative:
      "Portais brasileiros e buscas em português indicam apetite por contexto local.",
    risk: 22,
    opp: 82,
    sentiment: "positive" as const
  },
  {
    tag: "risk",
    narrative:
      "Parte da conversa questiona decisões criativas e possíveis mudanças de adaptação.",
    risk: 74,
    opp: 50,
    sentiment: "negative" as const
  }
];

function buildWeeklyBackfill(): IntelligenceItem[] {
  const start = new Date("2026-03-25T00:00:00.000Z");
  const today = new Date();
  const items: IntelligenceItem[] = [];
  let week = 1;

  for (let cursor = start; cursor <= today; cursor = addDays(cursor, 7)) {
    const end = addDays(cursor, 6);
    const after = iso(cursor);
    const before = iso(end);
    const theme = editorialThemes[(week - 1) % editorialThemes.length];
    const weekId = getWeekId(after);
    const baseQuery = `Harry Potter HBO Max serie Brasil ${theme.tag}`;

    items.push(
      item({
        title: `Monitoramento semanal ${weekId}: ${theme.narrative}`,
        source: "Google News Brasil",
        sourceKind: "news",
        url: googleNewsUrl(baseQuery, after, before),
        publishedAt: `${after}T12:00:00.000Z`,
        summary:
          `Busca semanal pronta para abrir matérias brasileiras sobre Harry Potter, HBO Max e ${theme.tag}. ` +
          "Esta entrada funciona como porta de investigação da semana, sem inventar veículo específico.",
        sentiment: theme.sentiment,
        sentimentReason:
          "Entrada de monitoramento semanal baseada em janela histórica e busca aberta de notícias.",
        riskScore: theme.risk,
        opportunityScore: theme.opp,
        tags: [theme.tag, "weekly", "news", "brasil"],
        reach: Math.min(96, 42 + week * 2),
        region: "BR"
      }),
      item({
        title: `Busca aberta ${weekId}: notícias e páginas brasileiras sobre Harry Potter HBO`,
        source: "Google Search Brasil",
        sourceKind: "google",
        url: googleSearchUrl(baseQuery, after, before),
        publishedAt: `${iso(addDays(cursor, 1))}T12:00:00.000Z`,
        summary:
          `Atalho clicável para investigar páginas, matérias e resultados brasileiros publicados na semana ${weekId}.`,
        sentiment: "neutral",
        sentimentReason:
          "Sinal de busca usado para investigação e backfill histórico.",
        riskScore: Math.max(12, theme.risk - 8),
        opportunityScore: Math.min(92, theme.opp - 2),
        tags: [theme.tag, "search", "backfill"],
        reach: Math.min(90, 36 + week * 2),
        region: "BR"
      })
    );

    if (week % 2 === 0) {
      items.push(
        item({
          title: `YouTube BR ${weekId}: vídeos e reacts sobre Harry Potter HBO Max`,
          source: "YouTube Brasil",
          sourceKind: "youtube",
          url: youtubeSearchUrl(baseQuery),
          publishedAt: `${iso(addDays(cursor, 2))}T18:00:00.000Z`,
          summary:
            "Atalho para vídeos brasileiros, análises, teorias e reacts relacionados à nova série.",
          sentiment: theme.sentiment,
          sentimentReason:
            "YouTube é canal relevante para explicadores e creators de cultura pop.",
          riskScore: theme.risk,
          opportunityScore: Math.min(96, theme.opp + 4),
          tags: [theme.tag, "youtube", "creators"],
          reach: Math.min(88, 44 + week * 2),
          region: "BR",
          creator: "Creators geek BR"
        })
      );
    }

    if (week % 3 === 0) {
      items.push(
        item({
          title: `Reddit ${weekId}: discussão de fandom sobre adaptação, elenco e expectativas`,
          source: "Reddit",
          sourceKind: "reddit",
          url: redditSearchUrl(`Harry Potter HBO series ${theme.tag}`),
          publishedAt: `${iso(addDays(cursor, 3))}T21:00:00.000Z`,
          summary:
            "Atalho para discussões de comunidade e sinais de fandom global que podem antecipar riscos ou oportunidades.",
          sentiment: theme.risk > 60 ? "negative" : "neutral",
          sentimentReason:
            "Reddit funciona como termômetro de fandom e pode concentrar objeções rapidamente.",
          riskScore: Math.min(86, theme.risk + 8),
          opportunityScore: theme.opp,
          tags: [theme.tag, "reddit", "fandom"],
          reach: Math.min(82, 38 + week * 2),
          region: "Global"
        })
      );
    }

    week += 1;
  }

  return items;
}

const officialAndKnownItems: IntelligenceItem[] = [
  item({
    title: "HBO Max revela teaser oficial da nova série Harry Potter",
    source: "HBO / Wizarding World",
    sourceKind: "official",
    url: "https://www.harrypotter.com/news/watch-the-first-teaser-for-hbo-original-harry-potter-series-premiering-christmas-2026",
    publishedAt: "2026-03-25T12:00:00.000Z",
    summary:
      "Marco inicial do monitoramento: teaser oficial, título da primeira temporada e janela de estreia no Natal de 2026.",
    sentiment: "positive",
    sentimentReason: "Evento oficial de alto impacto.",
    riskScore: 18,
    opportunityScore: 96,
    tags: ["teaser", "official", "hbo", "launch"],
    reach: 96,
    region: "Global"
  }),
  item({
    title: "Fandom brasileiro reage ao primeiro teaser e ao retorno a Hogwarts",
    source: "Google News Brasil",
    sourceKind: "news",
    url: googleNewsUrl(
      "Harry Potter HBO Max Brasil teaser",
      "2026-03-25",
      "2026-04-01"
    ),
    publishedAt: "2026-03-28T15:00:00.000Z",
    summary:
      "Conversas no Brasil se concentram em nostalgia, fidelidade aos livros e comparações com os filmes.",
    sentiment: "positive",
    sentimentReason: "Reação inicial favorável e alto potencial de nostalgia.",
    riskScore: 24,
    opportunityScore: 86,
    tags: ["brasil", "fandom", "nostalgia"],
    reach: 78,
    region: "BR"
  }),
  item({
    title: "Parte do fandom critica escolhas e teme perda da magia original",
    source: "Social Listening",
    sourceKind: "x",
    url: "https://x.com/search?q=Harry%20Potter%20HBO%20Max%20series&src=typed_query&f=live",
    publishedAt: "2026-05-18T21:00:00.000Z",
    summary:
      "Sinais negativos aparecem em conversas sobre comparação com os filmes e possíveis mudanças criativas.",
    sentiment: "negative",
    sentimentReason: "Risco reputacional em comparação direta com os filmes.",
    riskScore: 72,
    opportunityScore: 51,
    tags: ["risk", "fandom", "comparison"],
    reach: 67,
    region: "BR"
  })
];

export const seedItems: IntelligenceItem[] = [
  ...officialAndKnownItems,
  ...buildWeeklyBackfill()
];
