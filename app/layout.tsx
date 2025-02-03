import "./globals.css";
import { geistSans, geistMono } from "@/components/ui/fonts";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "next-themes";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <head>
        <link rel="icon" type="image/png" href="/assets/ar-dark.png" />
      </head>
      <body className="bg-background font-sans tracking-tight antialiased flex flex-col min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <div className="flex min-h-screen flex-col overflow-auto">
              {children}
              <Toaster position="bottom-right" richColors />
              <Analytics />
              <SpeedInsights />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
