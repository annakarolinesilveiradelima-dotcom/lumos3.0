import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Lumos | Harry Potter Intelligence Command Center",
  description: "Plataforma premium de Entertainment Intelligence para a serie Harry Potter."
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body className="lumos-bg min-h-screen">{children}</body></html>;
}
