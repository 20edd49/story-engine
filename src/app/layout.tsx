import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { universeRepository, searchArchive } from "@/lib/repositories/archive";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "The Archives — A collection of worlds",
    template: "%s — The Archives",
  },
  description:
    "A personal story archive. Explore characters, histories, and the worlds they call home.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Shell universes={universeRepository.list()} index={searchArchive()} />
        <main id="main">{children}</main>
        <footer className="site-footer">
          <Link href="/" className="footer-wordmark">
            THE ARCHIVES
          </Link>
          <p>Every story deserves a place to belong.</p>
          <span>
            A PERSONAL COLLECTION <span className="footer-dot">◆</span> EST.
            2026
          </span>
        </footer>
      </body>
    </html>
  );
}
