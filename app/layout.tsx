import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Révisio IA — Assistant scolaire intelligent",
  description: "Révisio IA t'aide à réviser avec des quiz, fiches de révision, flashcards et résumés générés par l'IA. L'assistant scolaire pour élèves et enseignants.",
  keywords: "révision, scolaire, IA, quiz, flashcards, fiches de révision, assistant, élève, enseignant",
  authors: [{ name: "Révisio IA" }],
  openGraph: {
    title: "Révisio IA — Assistant scolaire intelligent",
    description: "Quiz, fiches, flashcards et résumés générés par l'IA pour réviser efficacement.",
    url: "https://www.revisioapp.pro",
    siteName: "Révisio IA",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Révisio IA — Assistant scolaire intelligent",
    description: "Quiz, fiches, flashcards et résumés générés par l'IA pour réviser efficacement.",
  },
  metadataBase: new URL("https://www.revisioapp.pro"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}