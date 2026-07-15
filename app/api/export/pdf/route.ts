import { NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { updateIntelligence } from "@/lib/intelligence";
function safeText(value: string, max = 120) { return String(value || "").replace(/[\r\n]+/g, " ").slice(0, max); }
export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null);
  const s = data?.snapshot || (await updateIntelligence());
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawRectangle({ x: 0, y: 0, width: 842, height: 595, color: rgb(0.035, 0.031, 0.024) });
  page.drawText("Lumos Weekly Intelligence", { x: 42, y: 540, size: 24, font: bold, color: rgb(0.83, 0.68, 0.22) });
  page.drawText(safeText(s.summary.headline, 110), { x: 42, y: 510, size: 11, font, color: rgb(0.96, 0.91, 0.8) });
  let y = 475;
  const content = [...s.summary.bullets, "", "Risks", ...s.summary.risks, "", "Opportunities", ...s.summary.opportunities].slice(0, 26);
  content.forEach((text: string) => {
    const isTitle = text === "Risks" || text === "Opportunities";
    if (text.trim()) page.drawText(safeText(text, 135), { x: 48, y, size: isTitle ? 14 : 10, font: isTitle ? bold : font, color: rgb(0.96, 0.91, 0.8) });
    y -= 18;
  });
  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), { headers: { "content-type": "application/pdf", "content-disposition": "attachment; filename=lumos-weekly-intelligence.pdf" } });
}
