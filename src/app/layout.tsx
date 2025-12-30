import type { Metadata } from "next";
import { AI } from "@/lib/genui/ai-state";
import "./globals.css";

export const metadata: Metadata = {
  title: "GenUI Engine",
  description: "AI-Orchestrated Dashboard Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AI>{children}</AI>
      </body>
    </html>
  );
}