import type { Metadata } from "next";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "DIRECTIVE // V",
  description: "FIVE GO IN. FIVE COME OUT. Enter the classified briefing for DIRECTIVE V, a fictional near-future tactical shooter.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
