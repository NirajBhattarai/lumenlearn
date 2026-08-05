import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { SiteHeader } from "@/components/ui/SiteHeader";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LumenLearn",
  description:
    "Interactive technical knowledge engine — learn by seeing, interacting, and experimenting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body
        className={`${plexSans.variable} ${plexMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="mx-auto w-full max-w-[var(--max-width)] flex-1 px-4 py-8 sm:px-6 sm:py-10">
            {children}
          </main>
          <footer className="border-t border-border py-6 text-center font-mono text-[11px] text-subtle">
            LumenLearn · motion teaches, never decorates
          </footer>
        </div>
      </body>
    </html>
  );
}
