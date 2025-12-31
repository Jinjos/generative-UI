import type { Metadata } from "next";
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
        {children}
      </body>
    </html>
  );
}