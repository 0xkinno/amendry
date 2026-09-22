import { TopNav } from "../components/layout/TopNav";
import { Hero } from "../components/landing/Hero";
import { ScrollStatement } from "../components/landing/ScrollStatement";
import { FeatureRail } from "../components/landing/FeatureRail";
import { TallStoryCards } from "../components/landing/TallStoryCards";
import { ProductShowcase } from "../components/landing/ProductShowcase";
import { ProblemSection } from "../components/landing/ProblemSection";
import { Footer } from "../components/landing/Footer";

export default function Landing() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--paper)", position: "relative" }}>
      {/* 1. Top Navigation */}
      <TopNav />

      {/* 2. Hero Section */}
      <Hero />

      {/* 3. Signature Scroll Statement Choreography */}
      <ScrollStatement />

      {/* 4. Horizontal Feature Rail */}
      <FeatureRail />

      {/* 5. Tall Story Cards */}
      <TallStoryCards />

      {/* 6. Live Product Showcase */}
      <ProductShowcase />

      {/* 7. Problem & Technical Mechanism Split */}
      <ProblemSection />

      {/* 8. Dark Editorial Footer */}
      <Footer />
    </div>
  );
}
