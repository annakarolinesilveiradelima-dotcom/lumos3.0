import { NextResponse } from "next/server";
import { updateIntelligence } from "@/lib/intelligence";

export async function POST() {
  const snapshot = await updateIntelligence();

  return NextResponse.json(snapshot);
}

export async function GET() {
  const snapshot = await updateIntelligence();

  return NextResponse.json(snapshot);
}
