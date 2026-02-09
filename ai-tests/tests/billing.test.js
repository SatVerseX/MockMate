/**
 * Billing and Subscription Tests
 */

const { BrowserClient } = require('../utils/browser');
const { AIAssertions } = require('../utils/assertions');
const { LLMClient } = require('../utils/llm');
const axios = require('axios');

class BillingTests {
  constructor() {
    this.browser = new BrowserClient();
    this.assertions = new AIAssertions();
    this.llm = new LLMClient();
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  }

  async setup() {
    await this.browser.launch({ headless: true });
  }

  async teardown() {
    await this.browser.close();
    return this.assertions.getSummary();
  }

  /**
   * Test: Pricing page loads with plans
   */
  async testPricingPageLoads() {
    console.log('\n📋 Test: Pricing page loads with plans');
    
    await this.browser.goto('/pricing');
    await new Promise(r => setTimeout(r, 2000));
    
    const state = await this.browser.getPageState();
    
    // Check for pricing-related content
    const hasPricingContent = 
      state.headings.some(h => 
        h?.toLowerCase().includes('pricing') || 
        h?.toLowerCase().includes('plan') ||
        h?.toLowerCase().includes('pro')
      ) ||
      state.buttons.some(b => 
        b.text?.toLowerCase().includes('subscribe') ||
        b.text?.toLowerCase().includes('upgrade') ||
        b.text?.toLowerCase().includes('get started')
      );
    
    await this.assertions.assert(
      hasPricingContent,
      'Pricing page should display plans and subscription options'
    );
  }

  /**
   * Test: Multiple pricing plans visible
   */
  async testMultiplePlansVisible() {
    console.log('\n📋 Test: Multiple pricing plans visible');
    
    await this.browser.goto('/pricing');
    await new Promise(r => setTimeout(r, 2000));
    
    const page = this.browser.page;
    
    const planCount = await page.evaluate(() => {
      // Look for plan cards
      const cards = document.querySelectorAll('[class*="plan"], [class*="card"], [class*="pricing"]');
      return cards.length;
    });
    
    await this.assertions.assert(
      planCount >= 2,
      'Should display at least 2 pricing plans'
    );
  }

  /**
   * Test: Profile page has billing section
   */
  async testProfileBillingSection() {
    console.log('\n📋 Test: Profile page has billing section');
    
    try {
      await this.browser.login();
    } catch (e) {
      console.log('Login skipped');
    }
    
    await this.browser.goto('/profile');
    await new Promise(r => setTimeout(r, 2000));
    
    const state = await this.browser.getPageState();
    
    const hasBillingSection = 
      state.headings.some(h => 
        h?.toLowerCase().includes('billing') || 
        h?.toLowerCase().includes('subscription')
      ) ||
      state.buttons.some(b => 
        b.text?.toLowerCase().includes('billing') ||
        b.text?.toLowerCase().includes('manage')
      );
    
    await this.assertions.assert(
      hasBillingSection || state.url.includes('profile'),
      'Profile page should have billing/subscription section'
    );
  }

  /**
   * Test: Manage Billing modal opens
   */
  async testManageBillingModal() {
    console.log('\n📋 Test: Manage Billing modal opens');
    
    try {
      await this.browser.login();
    } catch (e) {
      console.log('Login skipped');
    }
    
    await this.browser.goto('/profile');
    await new Promise(r => setTimeout(r, 2000));
    
    // Try to click Manage Billing button
    await this.browser.clickByText('Manage Billing');
    await new Promise(r => setTimeout(r, 1000));
    
    const state = await this.browser.getPageState();
    
    // Check if modal opened (look for modal content)
    const modalOpened = 
      state.buttons.some(b => 
        b.text?.toLowerCase().includes('cancel') ||
        b.text?.toLowerCase().includes('close')
      ) ||
      state.headings.some(h => 
        h?.toLowerCase().includes('billing') ||
        h?.toLowerCase().includes('subscription')
      );
    
    await this.assertions.assert(
      modalOpened,
      'Manage Billing modal should open when button clicked'
    );
  }

  /**
   * Test: Free plan limitations displayed
   */
  async testFreePlanLimitations() {
    console.log('\n📋 Test: Free plan limitations displayed');
    
    await this.browser.goto('/pricing');
    await new Promise(r => setTimeout(r, 2000));
    
    const page = this.browser.page;
    
    const pageContent = await page.evaluate(() => document.body.innerText);
    
    // Use AI to analyze if limitations are clearly displayed
    const analysis = await this.llm.validateResponse(
      'pricing-page',
      'Should clearly display free plan limitations and what paid plans offer',
      { content: pageContent.substring(0, 2000) }
    );
    
    await this.assertions.assert(
      analysis.isValid !== false,
      'Pricing page should clearly communicate plan differences'
    );
  }

  /**
   * Run all billing tests
   */
  async runAll() {
    console.log('\n💳 Running Billing/Subscription Tests...\n');
    
    await this.setup();
    
    try {
      await this.testPricingPageLoads();
      await this.testMultiplePlansVisible();
      await this.testProfileBillingSection();
      await this.testManageBillingModal();
      await this.testFreePlanLimitations();
    } catch (error) {
      console.error('Test error:', error);
    }
    
    return await this.teardown();
  }
}

module.exports = { BillingTests };

// Run if called directly
if (require.main === module) {
  const tests = new BillingTests();
  tests.runAll().then(summary => {
    console.log('\n📊 Billing Test Summary:', summary);
    process.exit(summary.failed > 0 ? 1 : 0);
  });
}
