import { NextRequest } from "next/server";
import { updateIntelligence } from "@/lib/intelligence";
import { toCSV } from "@/lib/exporters";
export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null);
  const snapshot = data?.snapshot || (await updateIntelligence());
  return new Response(toCSV(snapshot), { headers: { "content-type": "text/csv;charset=utf-8", "content-disposition": "attachment; filename=lumos-weekly-intelligence.csv" } });
}
