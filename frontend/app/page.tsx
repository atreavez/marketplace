import { Hero } from '../components/landing/Hero';
import { CategoryExplorer } from '../components/landing/CategoryExplorer';
import { Trending } from '../components/landing/Trending';
import { AIRecommendations } from '../components/landing/AIRecommendations';
import { Sellers } from '../components/landing/Sellers';
import { TrustStats } from '../components/landing/TrustStats';
import { Testimonials } from '../components/landing/Testimonials';
import { ClosingCTA } from '../components/landing/ClosingCTA';

export default function Home() {
  return (
    <main>
      <Hero />
      <CategoryExplorer />
      <Trending />
      <AIRecommendations />
      <Sellers />
      <TrustStats />
      <Testimonials />
      <ClosingCTA />
    </main>
  );
}
