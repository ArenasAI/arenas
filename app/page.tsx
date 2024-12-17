import Navigation from '@/components/Navigation';
import Footer from '@/components/footer';
import Newsletter from '@/components/Newsletter';
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
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg">
            <Link href="/chat">
              Take me there!
            </Link>
          </Button>
        </div>

        <div className="py-24 px-4">
          <Newsletter />
        </div>
      </main>

      <Footer />
    </div>
  );
}