'use client';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/footer';
import Newsletter from '@/components/Newsletter';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      {/* Main content */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 mt-16 overflow-y-auto">
        <h1 className="text-6xl font-bold mb-4">Arenas</h1>
        <p className="text-xl mb-8 text-gray-600">Open Source AI Data Analyst</p>
        <a 
          href="/chat" 
          className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Try it now!
        </a>
        <div className="">
          <Newsletter />
        </div>
        
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
