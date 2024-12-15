// 'use client';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/footer';
import Newsletter from '@/components/Newsletter';
import Page from './(chat)/page';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navigation />
      
      <main className="flex-grow pt-16">
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <h1 className="text-6xl font-bold mb-4 text-gray-900">Arenas</h1>
        <p className="text-xl mb-8 text-gray-600">Open Source AI Data Analyst</p>
        <Button>
          <Link href="/chat">
            <Page />
          </Link>
        </Button>
        
        {/* <a 
          href="/chat"
            className="bg-gradient-to-r from-coral-500 to-orange-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Take me there!
        </a> */}
        </div>

        {/* Newsletter Section */}
        <div className="py-24 px-4">
          <Newsletter />
        </div>
      </main>

      <Footer />
    </div>
  );
}
