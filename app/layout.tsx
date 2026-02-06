import type { Metadata } from "next";
import { Inter, Cinzel, Marcellus } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });
const marcellus = Marcellus({ 
  weight: "400", 
  subsets: ["latin"],
  variable: "--font-marcellus" 
});

export const metadata: Metadata = {
  title: "Mongolian Traditional Games Adventure",
  description: "Play, learn, and explore Mongolian culture through interactive hero journeys.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth dark">
      <body className={`${inter.className} ${cinzel.variable} ${marcellus.variable} bg-[#050608] text-slate-200`}>
        {children}
      </body>
    </html>
  );
}