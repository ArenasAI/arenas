import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "next-themes";
import Footer from "@/components/footer";
import { Navbar } from "@/components/nav";


const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
  });
  
  const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
  });
  

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <body className={`bg-background font-sans tracking-tight antialiased flex flex-col min-h-screen`}>
          <ThemeProvider
            attribute="class"
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            <div className="flex min-h-screen flex-col overflow-auto">
              <Navbar />
              {children}
              <Footer/>
              <Toaster position="bottom-right" richColors />
              <Analytics />
              <SpeedInsights />
            </div>
          </ThemeProvider>
          <Analytics />
        </body>
    </html>
  );
}