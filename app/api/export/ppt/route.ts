import { NextRequest } from "next/server";
import pptxgen from "pptxgenjs";
import { updateIntelligence } from "@/lib/intelligence";
function safeText(value: string, max = 500) { return String(value || "").replace(/[\r\n]+/g, " ").slice(0, max); }
function bulletList(items: string[], max = 180) { return items.map((item: string) => "- " + safeText(item, max)).join("\n"); }
export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null);
  const s = data?.snapshot || (await updateIntelligence());
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Lumos";
  pptx.subject = "Harry Potter Entertainment Intelligence";
  pptx.title = "Lumos Weekly Intelligence";
  pptx.company = "Lumos";
  const slide1 = pptx.addSlide();
  slide1.background = { color: "090806" };
  slide1.addText("Lumos", { x: 0.5, y: 0.4, w: 4, h: 0.5, fontSize: 26, bold: true, color: "D4AF37" });
  slide1.addText("Weekly Intelligence Archive", { x: 0.5, y: 1, w: 8, h: 0.3, fontSize: 16, color: "F7EEDB" });
  slide1.addText(safeText(s.summary.headline, 220), { x: 0.5, y: 1.6, w: 11.5, h: 0.8, fontSize: 13, color: "F7EEDB" });
  slide1.addText(bulletList(s.summary.bullets, 220), { x: 0.7, y: 2.6, w: 11, h: 2.8, fontSize: 12, color: "F7EEDB", fit: "shrink" });
  const slide2 = pptx.addSlide();
  slide2.background = { color: "090806" };
  slide2.addText("Risks & Opportunities", { x: 0.5, y: 0.5, w: 8, h: 0.5, fontSize: 24, bold: true, color: "D4AF37" });
  slide2.addText("Risks", { x: 0.7, y: 1.2, w: 5.7, h: 0.3, fontSize: 15, bold: true, color: "EF4444" });
  slide2.addText(bulletList(s.summary.risks, 180), { x: 0.7, y: 1.7, w: 5.7, h: 4.4, fontSize: 10, color: "F7EEDB", fit: "shrink" });
  slide2.addText("Opportunities", { x: 6.8, y: 1.2, w: 5.7, h: 0.3, fontSize: 15, bold: true, color: "D4AF37" });
  slide2.addText(bulletList(s.summary.opportunities, 180), { x: 6.8, y: 1.7, w: 5.7, h: 4.4, fontSize: 10, color: "F7EEDB", fit: "shrink" });
  const arrayBuffer = await pptx.write({ outputType: "arraybuffer" } as any);
  return new Response(Buffer.from(arrayBuffer as ArrayBuffer), { headers: { "content-type": "application/vnd.openxmlformats-officedocument.presentationml.presentation", "content-disposition": "attachment; filename=lumos-weekly-intelligence.pptx" } });
}
