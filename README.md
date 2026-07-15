# Lumos V2 - Weekly Entertainment Intelligence

Esta versao transforma o Lumos em um Command Center com memoria semanal desde o teaser oficial de 25/03/2026.

## Rodar

```bash
npm install
npm run dev
```

## Deploy

Use Vercel. GitHub Pages nao executa rotas API do Next.js.

## O que mudou

- Weekly Intelligence Archive desde 25/03/2026.
- Historico local preservado em `localStorage`.
- Estrutura pronta para Supabase em `supabase/schema.sql`.
- Design mais premium: command center, cards editoriais, risk radar, opportunity pipeline, source map.
- Export CSV/PDF/PPT corrigidos.

## Variaveis opcionais

Copie `.env.example` para `.env.local` e adicione APIs quando tiver:

- `YOUTUBE_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
