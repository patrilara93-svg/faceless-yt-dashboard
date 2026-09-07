import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "YouTube Faceless — Panel de Control",
  description: "Panel de monitorización del pipeline de vídeos faceless para YouTube.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-canvas text-neutral-100 antialiased">{children}</body>
    </html>
  );
}
