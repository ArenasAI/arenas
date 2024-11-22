import '@/styles/globals.css'
import { Inter } from 'next/font/google'
import { Dela_Gothic_One } from 'next/font/google'
import localFont from "next/font/local";
import { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] })
const delaGothic = Dela_Gothic_One({
  weight: '400',
  subsets: ['latin'],
})

export const metadata = {
  title: "Arenas AI - Your Personal Data Analyst",
  description: "Get rid of Excel forever!"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${delaGothic.className} antialiased`}>
        <div className="main">
          <div className="gradient" />
        </div>
        <main className="app">
          {children}
        </main>
      </body>
    </html>
  );
}
