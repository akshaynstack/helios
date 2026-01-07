import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Helios CLI - AI Coding Assistant",
  description: "AI Coding Assistant with 130+ Tools, MCP Support, and Multi-Provider Integration. Like Claude Code but supercharged.",
  keywords: ["AI", "coding", "assistant", "CLI", "LLM", "OpenRouter", "Claude", "GPT", "MCP"],
  authors: [{ name: "akshaynstack" }],
  openGraph: {
    title: "Helios CLI - AI Coding Assistant",
    description: "AI Coding Assistant with 130+ Tools, MCP Support, and Multi-Provider Integration",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased bg-zinc-950 text-zinc-100`}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
