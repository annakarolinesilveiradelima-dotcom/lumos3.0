"use client";

import { useEffect, useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  BarChart3,
  Bot,
  Download,
  ExternalLink,
  FileWarning,
  Flame,
  Lightbulb,
  Newspaper,
  RefreshCw,
  Search,
  Sparkles,
  Users
} from "lucide-react";
import { TEASER_LAUNCH_DATE } from "@/lib/config";
import { buildSnapshot } from "@/lib/analysis";
import { seedItems } from "@/lib/mock-data";
import type {
  IntelligenceItem,
  IntelligenceSnapshot,
  Sentiment
} from "@/lib/types";

type ViewKey =
  | "overview"
  | "narratives"
  | "coverage"
  | "sentiment"
  | "creators"
  | "risks"
  | "opps"
  | "assistant";

type PeriodKey = "week" | "all";

type CoverageFilter =
  | "all"
  | Sentiment
  | "official"
  | "news"
  | "youtube"
  | "reddit"
  | "x"
  | "trends";

type NarrativeInsight = {
  id: string;
  title: string;
  summary: string;
  whyItMatters: string;
  sourceNames: string[];
  evidence: IntelligenceItem[];
  sentiment: Sentiment;
  riskScore: number;
  opportunityScore: number;
};

const initialSnapshot = buildSnapshot(
  seedItems,
  TEASER_LAUNCH_DATE,
  new Date().toISOString().slice(0, 10)
);

const CACHE_KEY = "lumos.v9.clean-page.snapshot";

const COVERAGE_DISPLAY_LIMIT = 35;
const EVIDENCE_DISPLAY_LIMIT = 12;
const NARRATIVE_DISPLAY_LIMIT = 5;

const navItems: { key: ViewKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Visão geral", icon: BarChart3 },
  { key: "narratives", label: "Narrativas", icon: Sparkles },
  { key: "coverage", label: "Cobertura & fontes", icon: Newspaper },
  { key: "sentiment", label: "Sentimento", icon: Flame },
  { key: "creators", label: "Creators", icon: Users },
  { key: "risks", label: "Riscos", icon: FileWarning },
  { key: "opps", label: "Oportunidades", icon: Lightbulb },
  { key: "assistant", label: "Assistant", icon: Bot }
];

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function average(
  items: IntelligenceItem[],
  field: "riskScore" | "opportunityScore" | "reach"
) {
  if (!items.length) return 0;

  return Math.round(
    items.reduce((sum, item) => sum + item[field], 0) / items.length
  );
}

function weekNumber(weekId: string) {
  return Number(weekId.replace("W", ""));
}

function sentimentLabel(value: Sentiment) {
  if (value === "positive") return "Positivo";
  if (value === "negative") return "Crítico";
  return "Neutro";
}

function sentimentClass(value: Sentiment) {
  if (value === "positive") return "pos";
  if (value === "negative") return "neg";
  return "neu";
}

function cleanUrl(url: string) {
  if (!url || !/^https?:\/\//i.test(url)) return "#";
  return url;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isSearchBackfill(item: IntelligenceItem) {
  return (
    item.sourceKind === "google" ||
    item.url.includes("news.google.com/search") ||
    item.url.includes("google.com/search") ||
    item.title.toLowerCase().includes("monitoramento semanal") ||
    item.title.toLowerCase().includes("busca aberta")
  );
}

function isHarryPotterRelevant(item: IntelligenceItem) {
  const text = normalizeText(
    `${item.title} ${item.summary} ${item.tags.join(" ")} ${item.source}`
  );

  const hasHarryPotter = text.includes("harry") && text.includes("potter");

  const hasWizardingTerm =
    text.includes("hogwarts") ||
    text.includes("wizarding world") ||
    text.includes("mundo bruxo") ||
    text.includes("dumbledore") ||
    text.includes("hermione") ||
    text.includes("ron weasley") ||
    text.includes("voldemort");

  const hasSeriesContext =
    text.includes("hbo") ||
    text.includes("max") ||
    text.includes("serie") ||
    text.includes("série") ||
    text.includes("teaser") ||
    text.includes("elenco") ||
    text.includes("estreia");

  const sourceIsOfficial = item.sourceKind === "official";

  return (
