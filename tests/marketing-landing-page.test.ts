import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('page.tsx checks session and renders landing view for unauthenticated visitors', () => {
  const pagePath = path.resolve(process.cwd(), 'src/app/page.tsx');
  const content = fs.readFileSync(pagePath, 'utf8');
  assert.ok(content.includes('getCurrentUserSession'), 'Must check session');
  assert.ok(content.includes("redirect('/dashboard')"), 'Must redirect authenticated users');
  assert.ok(content.includes('MarketingLandingView'), 'Must render landing view for guests');
});

test('marketing components exist with required sections', () => {
  const marketingViewPath = path.resolve(process.cwd(), 'src/features/marketing/components/marketing-landing-view.tsx');
  assert.ok(fs.existsSync(marketingViewPath), 'MarketingLandingView must exist');
  const content = fs.readFileSync(marketingViewPath, 'utf8');
  assert.ok(content.includes('HeroSection'), 'Must include HeroSection');
  assert.ok(content.includes('FeatureGrid'), 'Must include FeatureGrid');
  assert.ok(content.includes('PricingSection'), 'Must include PricingSection');
});

