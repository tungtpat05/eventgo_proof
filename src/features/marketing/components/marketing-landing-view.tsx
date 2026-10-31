'use client';

import React from 'react';
import { HeroSection } from './hero-section';
import { FeatureGrid } from './feature-grid';
import { PricingSection } from './pricing-section';
import { FaqSection } from './faq-section';
import { MarketingFooter } from './marketing-footer';

export function MarketingLandingView() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <main className="flex-1">
        <HeroSection />
        <FeatureGrid />
        <PricingSection />
        <FaqSection />
      </main>
      <MarketingFooter />
    </div>
  );
}

