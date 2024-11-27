import Pricing from '@/components/Pricing';
import Navigation from '@/components/Navigation';
import Footer from '@/components/footer';

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-grow">
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
