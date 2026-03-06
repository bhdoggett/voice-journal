import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora, Merriweather, EB_Garamond, Crimson_Text } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
});

const crimsonText = Crimson_Text({
  variable: "--font-crimson",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Voice Journal",
  description: "A browser-based voice journal — speak your thoughts and save them.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('vj-theme');if(t)document.documentElement.setAttribute('data-theme',t);var f=localStorage.getItem('vj-font');if(f&&f!=='lora')document.documentElement.setAttribute('data-font',f);var s=localStorage.getItem('vj-text-size');if(s&&s!=='medium')document.documentElement.setAttribute('data-text-size',s);var l=localStorage.getItem('vj-line-spacing');if(l&&l!=='normal')document.documentElement.setAttribute('data-line-spacing',l);}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} ${merriweather.variable} ${ebGaramond.variable} ${crimsonText.variable}`}>
        {children}
      </body>
    </html>
  );
}
