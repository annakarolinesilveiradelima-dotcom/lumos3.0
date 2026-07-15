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

export const seedItems: IntelligenceItem[] = [
  item({
    title: "HBO Max revela teaser oficial da nova série Harry Potter",
    source: "Wizarding World",
    sourceKind: "official",
    url: "https://www.harrypotter.com/news/watch-the-first-teaser-for-hbo-original-harry-potter-series-premiering-christmas-2026",
    publishedAt: "2026-03-25T12:00:00.000Z",
    summary:
      "A IA usa esta fonte oficial como baseline: o teaser confirmou a primeira temporada, o retorno a Hogwarts e a janela de estreia no Natal de 2026.",
    sentiment: "positive",
    sentimentReason:
      "Fonte oficial de alto impacto, com potencial forte para nostalgia, PR e aquecimento de fandom.",
    riskScore: 18,
    opportunityScore: 96,
    tags: ["teaser", "official", "hbo", "launch", "nostalgia"],
    reach: 96,
    region: "Global"
  }),

  item({
    title: "HBO anuncia teaser, título da primeira temporada e estreia no Natal de 2026",
    source: "Warner Bros. Discovery Pressroom",
    sourceKind: "official",
    url: "https://press.wbd.com/us/media-release/hbo-0/harry-potter/hbo-original-harry-potter-series-releases-first-official-teaser-and-announces",
    publishedAt: "2026-03-25T13:00:00.000Z",
    summary:
      "A IA usa o press release da WBD como fonte primária para título, janela de estreia, elenco divulgado e posicionamento oficial da série.",
    sentiment: "positive",
    sentimentReason:
      "Press release oficial reduz incerteza e serve como referência para mensagens, apresentações e social copy.",
    riskScore: 14,
    opportunityScore: 94,
    tags: ["press-release", "official", "hbo", "cast", "release"],
    reach: 94,
    region: "Global"
  }),

  item({
    title: "Fandom brasileiro reage ao retorno de Harry Potter como série",
    source: "Lumos AI Analysis",
    sourceKind: "news",
    url: "https://news.google.com/search?q=Harry%20Potter%20HBO%20Max%20Brasil%20teaser&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    publishedAt: "2026-03-28T15:00:00.000Z",
    summary:
      "A IA identifica que a conversa brasileira tende a girar em torno de nostalgia, comparação com os filmes, fidelidade aos livros e curiosidade sobre elenco.",
    sentiment: "positive",
    sentimentReason:
      "A leitura combina o marco oficial com padrões de interesse de fandom e cobertura de entretenimento no Brasil.",
    riskScore: 30,
    opportunityScore: 82,
    tags: ["brasil", "fandom", "nostalgia", "imprensa"],
    reach: 70,
    region: "BR"
  }),

  item({
    title: "Discussões sobre elenco e fidelidade aos livros pedem monitoramento contínuo",
    source: "Lumos AI Analysis",
    sourceKind: "news",
    url: "https://news.google.com/search?q=Harry%20Potter%20HBO%20Max%20elenco%20fidelidade%20livros&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    publishedAt: "2026-04-08T12:00:00.000Z",
    summary:
      "A IA aponta casting, caracterização e fidelidade aos livros como temas sensíveis, porque costumam concentrar debate entre fãs antigos e novas audiências.",
    sentiment: "neutral",
    sentimentReason:
      "Tema com oportunidade editorial, mas também com risco de polarização caso a percepção de adaptação seja negativa.",
    riskScore: 58,
    opportunityScore: 70,
    tags: ["casting", "adaptation", "fandom", "risk"],
    reach: 64,
    region: "BR"
  }),

  item({
    title: "Nostalgia segue como oportunidade para social, PR e CRM",
    source: "Lumos AI Analysis",
    sourceKind: "news",
    url: "https://news.google.com/search?q=Harry%20Potter%20nostalgia%20HBO%20Max%20Brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    publishedAt: "2026-05-02T12:00:00.000Z",
    summary:
      "A IA recomenda ativar conteúdos de memória afetiva, linhas do tempo da franquia, guias de personagens e materiais de preparação para novos públicos.",
    sentiment: "positive",
    sentimentReason:
      "Nostalgia é um eixo favorável, de baixo risco e alto potencial para engajamento always-on.",
    riskScore: 18,
    opportunityScore: 88,
    tags: ["nostalgia", "crm", "social", "opportunity"],
    reach: 72,
    region: "BR"
  }),

  item({
    title: "Comparação com os filmes é o principal risco narrativo",
    source: "Lumos AI Analysis",
    sourceKind: "x",
    url: "https://x.com/search?q=Harry%20Potter%20HBO%20Max%20filmes%20s%C3%A9rie&src=typed_query&f=live",
    publishedAt: "2026-05-18T21:00:00.000Z",
    summary:
      "A IA identifica risco recorrente em conversas que comparam a nova série com o legado dos filmes, especialmente sobre tom, elenco e sensação de magia original.",
    sentiment: "negative",
    sentimentReason:
      "Comparação direta com uma franquia altamente afetiva pode gerar resistência se a comunicação não reforçar fidelidade, cuidado e valor de formato longo.",
    riskScore: 74,
    opportunityScore: 54,
    tags: ["risk", "fandom", "comparison", "x"],
    reach: 67,
    region: "BR"
  }),

  item({
    title: "Creators geek podem explicar diferenças entre filme e série",
    source: "Lumos AI Analysis",
    sourceKind: "youtube",
    url: "https://www.youtube.com/results?search_query=Harry+Potter+HBO+Max+s%C3%A9rie+Brasil",
    publishedAt: "2026-06-05T18:00:00.000Z",
    summary:
      "A IA recomenda creators de cultura pop para vídeos explicadores, reacts, teorias e conteúdos de preparação para o público brasileiro.",
    sentiment: "positive",
    sentimentReason:
      "YouTube e creators ajudam a transformar dúvidas de fandom em educação e expectativa positiva.",
    riskScore: 24,
    opportunityScore: 86,
    tags: ["youtube", "creators", "education", "brasil"],
    reach: 78,
    region: "BR",
    creator: "Creators geek BR"
  }),

  item({
    title: "Portais brasileiros podem sustentar a conversa com guias e retrospectivas",
    source: "Lumos AI Analysis",
    sourceKind: "news",
    url: "https://news.google.com/search?q=Harry%20Potter%20HBO%20Max%20guia%20retrospectiva%20Brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    publishedAt: "2026-06-19T12:00:00.000Z",
    summary:
      "A IA identifica oportunidade para conteúdos editoriais em português, como guias de personagens, explicações sobre Hogwarts, linha do tempo e contexto para novos espectadores.",
    sentiment: "positive",
    sentimentReason:
      "Conteúdos explicadores reduzem barreira de entrada e mantêm o interesse ativo entre grandes assets oficiais.",
    riskScore: 20,
    opportunityScore: 84,
    tags: ["press", "editorial", "guides", "brasil"],
    reach: 69,
    region: "BR"
  }),

  item({
    title: "Reddit funciona como termômetro antecipado de objeções do fandom",
    source: "Lumos AI Analysis",
    sourceKind: "reddit",
    url: "https://www.reddit.com/search/?q=Harry%20Potter%20HBO%20series%20adaptation&sort=new",
    publishedAt: "2026-06-27T21:00:00.000Z",
    summary:
      "A IA recomenda monitorar Reddit como sinal antecipado de dúvidas e objeções sobre adaptação, elenco, tom e comparação com os filmes.",
    sentiment: "neutral",
    sentimentReason:
      "Reddit pode trazer riscos antes de eles chegarem a conversas mais amplas, mas também revela dúvidas úteis para conteúdo educativo.",
    riskScore: 56,
    opportunityScore: 66,
    tags: ["reddit", "fandom", "monitoring", "risk"],
    reach: 61,
    region: "Global"
  }),

  item({
    title: "Semana atual: conversa precisa de novos assets oficiais para crescer",
    source: "Lumos AI Analysis",
    sourceKind: "news",
    url: "https://news.google.com/search?q=Harry%20Potter%20HBO%20Max%20s%C3%A9rie%20Brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    publishedAt: "2026-07-15T12:00:00.000Z",
    summary:
      "A IA avalia que, sem novo trailer, casting beat ou asset oficial, a conversa tende a depender de recirculação, nostalgia e creators.",
    sentiment: "neutral",
    sentimentReason:
      "A leitura indica manutenção de interesse, mas não pico orgânico sustentado sem novidade adicional.",
    riskScore: 34,
    opportunityScore: 72,
    tags: ["always-on", "weekly", "strategy", "brasil"],
    reach: 58,
    region: "BR"
  })
];
