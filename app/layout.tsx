import type { Metadata } from "next";
import {
  Archivo,
  Big_Shoulders,
  Geist_Mono,
  Michroma,
  Six_Caps,
} from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
});

// Tall, squared condensed face — closest open match to the cover title.
const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin", "latin-ext"],
  weight: ["700", "800", "900"],
  adjustFontFallback: false,
  fallback: ["Arial Narrow", "Impact", "sans-serif"],
});

// Ultra-condensed caps for big titles — closest open match to the cover
// title lettering.
const sixCaps = Six_Caps({
  variable: "--font-six-caps",
  subsets: ["latin", "latin-ext"],
  weight: "400",
});

// Wide geometric face — closest open match to the cover subtitle.
const michroma = Michroma({
  variable: "--font-michroma",
  subsets: ["latin", "latin-ext"],
  weight: "400",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PICE PCUD | PCU Dasmariñas Student Chapter",
  description:
    "PICE – Philippine Christian University – Dasmariñas Student Chapter: a student-led organization developing future civil engineers through technical training, leadership, and professional growth.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${bigShoulders.variable} ${sixCaps.variable} ${michroma.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
