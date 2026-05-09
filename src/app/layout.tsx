import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { getCurrentProfile } from "@/lib/supabase/queries";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Семейные финансы",
  description: "Личное приложение учёта семейных финансов",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    title: "Финансы",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F2027",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let profile = null;
  try {
    profile = await getCurrentProfile();
  } catch {
    // not logged in or env vars missing — proxy will redirect
  }

  return (
    <html lang="ru" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg-base text-text-primary">
        <AppShell
          role={profile?.role ?? "owner"}
          displayName={profile?.display_name ?? "Гость"}
          avatarLetter={profile?.avatar_letter ?? "?"}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
