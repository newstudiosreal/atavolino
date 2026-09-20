import type { Metadata } from "next";
import { Baloo_2, Inter } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AppToaster } from "@/components/ui/Toaster";
import "@/styles/globals.css";

const baloo = Baloo_2({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "aTavolino — Il gioco di carte dove il tavolo è sempre aperto",
  description:
    "aTavolino è il gioco di carte multiplayer online di NeW Studios. Crea un tavolo, invita gli amici e gioca in tempo reale dal browser."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${baloo.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col bg-brand-ink font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <AppToaster />
      </body>
    </html>
  );
}
