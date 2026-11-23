import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LanguageProvider, Language } from "@/components/i18n/language-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "StoryRemix | Collaborative Storytelling Platform",
  description: "One story. Many minds. Endless possibilities. Co-write literature paragraph by paragraph through community voting.",
  openGraph: {
    title: "StoryRemix | Collaborative Storytelling Platform",
    description: "Co-write literature paragraph by paragraph through community voting.",
    url: "https://storyremix.com",
    siteName: "StoryRemix",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StoryRemix | Collaborative Storytelling Platform",
    description: "Co-write literature paragraph by paragraph through community voting.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale: Language =
    rawLocale === "fr" || rawLocale === "ar" ? rawLocale : "en";
  const isRtl = locale === "ar";

  return (
    <html lang={locale} dir={isRtl ? "rtl" : "ltr"} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased selection:bg-amber-200 selection:text-amber-950 dark:selection:bg-amber-900 dark:selection:text-amber-100">
        <LanguageProvider initialLocale={locale}>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <Footer />
            <Toaster position="bottom-right" richColors closeButton />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
