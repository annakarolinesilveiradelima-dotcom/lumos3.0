import { NextRequest, NextResponse } from "next/server";
import { updateIntelligence } from "@/lib/intelligence";
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const snapshot = await updateIntelligence(body?.lastRun);
  return NextResponse.json(snapshot);
}
export async function GET() {
  const snapshot = await updateIntelligence();
  return NextResponse.json(snapshot);
}
