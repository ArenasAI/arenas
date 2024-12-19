import Navigation from '@/components/Navigation';
import Footer from '@/components/footer';
import Newsletter from '@/components/Newsletter';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navigation />
      
      <main className="flex-grow">
        {/* Hero Section - Left aligned with padding */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="min-h-[80vh] flex flex-col justify-center">
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-6">
                Arenas: Open Source AI-Powered Data Analyst
              </h1>
              <p className="text-2xl sm:text-3xl text-gray-600 mb-8">
                Replace Excel forever
              </p>
              <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg w-full sm:w-auto">
            <Link href="/chat">
              Take me there!
            </Link>
          </Button>
        </div>
        </div>
        </div>

        {/* Newsletter Section - Brought up with distinct background */}
        <div className="bg-gray-50 mt-[-120px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <Newsletter />
    </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}