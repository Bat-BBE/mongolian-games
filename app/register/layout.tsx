import type { Metadata } from "next";
import { Inter, Cinzel, Marcellus } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });
const cinzel = Cinzel({ 
  subsets: ["latin"], 
  variable: "--font-cinzel" 
});
const marcellus = Marcellus({ 
  weight: "400", 
  subsets: ["latin"],
  variable: "--font-marcellus" 
});

export const metadata: Metadata = {
  title: "Journey Through Mongolian Time | Cinematic 3D Adventure",
  description: "Embark on an epic journey through Mongolian history and traditions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Inter:wght@300;400;500;600&family=Marcellus&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} ${cinzel.variable} ${marcellus.variable}`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}