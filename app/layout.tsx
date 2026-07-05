import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import "./dark-mode.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { ThemeAwareToaster } from "@/components/theme/ThemeAwareToaster";
import { themeBootstrapScript } from "@/lib/theme";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Khata — Nepal's Business Operating System",
  description: "Multi-tenant ERP platform for Nepali businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body
        className={`${plusJakarta.variable} ${plexMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <AppProviders>
          {children}
        </AppProviders>
        <ThemeAwareToaster />
      </body>
    </html>
  );
}
