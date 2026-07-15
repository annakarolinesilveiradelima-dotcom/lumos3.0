import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function uid(value: string) { return crypto.createHash("sha256").update(value).digest("hex").slice(0, 18); }
export function cleanText(value: string) { return String(value || "").replace(/<[^>]+>/g, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim(); }
export function iso(d: Date) { return d.toISOString().slice(0, 10); }
export function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
export function host(url: string) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "unknown"; } }
