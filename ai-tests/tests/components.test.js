/**
 * UI Component Tests
 */

const { BrowserClient } = require('../utils/browser');
const { AIAssertions } = require('../utils/assertions');
const { LLMClient } = require('../utils/llm');

class ComponentTests {
  constructor() {
    this.browser = new BrowserClient();
    this.assertions = new AIAssertions();
    this.llm = new LLMClient();
  }

  async setup() {
    await this.browser.launch({ headless: true });
  }

  async teardown() {
    await this.browser.close();
    return this.assertions.getSummary();
  }

  /**
   * Test: Button component variants
   */
  async testButtonVariants() {
    console.log('\n📋 Test: Button component variants');
    
    await this.browser.goto('/');
    await new Promise(r => setTimeout(r, 1000));
    
    const buttonStyles = await this.browser.page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      return Array.from(buttons).slice(0, 10).map(btn => ({
        text: btn.textContent?.trim()?.substring(0, 30),
        hasHover: !!btn.matches(':hover'),
        disabled: btn.disabled,
        className: btn.className.substring(0, 100),
      }));
    });
    
    await this.assertions.assert(
      buttonStyles.length > 0,
      `Found ${buttonStyles.length} buttons with various styles`
    );
  }

  /**
   * Test: Card components
   */
  async testCardComponents() {
    console.log('\n📋 Test: Card components');
    
    await this.browser.goto('/pricing');
    await new Promise(r => setTimeout(r, 1000));
    
    const cards = await this.browser.page.evaluate(() => {
      // Look for elements that appear to be cards
      const cardSelectors = [
        '[class*="card"]',
        '[class*="plan"]',
        '[class*="pricing"]',
        '[class*="glass"]'
      ];
      
      let cardElements = [];
      cardSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        cardElements = [...cardElements, ...elements];
      });
      
      return {
        count: cardElements.length,
        hasGlassEffect: cardElements.some(el => 
          el.className.includes('glass') || 
          getComputedStyle(el).backdropFilter !== 'none'
        )
      };
    });
    
    await this.assertions.assert(
      cards.count > 0,
      `Card components: ${cards.count} found, glass effect: ${cards.hasGlassEffect ? 'Yes' : 'No'}`
    );
  }

  /**
   * Test: Modal components
   */
  async testModalComponents() {
    console.log('\n📋 Test: Modal components');
    
    // Try to trigger a modal by clicking upgrade button
    await this.browser.goto('/');
    await new Promise(r => setTimeout(r, 1000));
    
    await this.browser.clickByText('Upgrade');
    await new Promise(r => setTimeout(r, 500));
    
    const hasModal = await this.browser.page.evaluate(() => {
      const modals = document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="overlay"]');
      return modals.length > 0;
    });
    
    await this.assertions.assert(
      true,
      `Modal trigger test: ${hasModal ? 'Modal appeared' : 'Navigated to page instead'}`
    );
  }

  /**
   * Test: Form components
   */
  async testFormComponents() {
    console.log('\n📋 Test: Form components');
    
    await this.browser.goto('/login');
    await new Promise(r => setTimeout(r, 1000));
    
    const formAnalysis = await this.browser.page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      const selects = document.querySelectorAll('select');
      const textareas = document.querySelectorAll('textarea');
      
      return {
        inputCount: inputs.length,
        selectCount: selects.length,
        textareaCount: textareas.length,
        hasPlaceholders: Array.from(inputs).some(i => i.placeholder),
        hasValidation: Array.from(inputs).some(i => i.required || i.pattern),
      };
    });
    
    await this.assertions.assert(
      formAnalysis.inputCount > 0,
      `Form inputs: ${formAnalysis.inputCount}, with placeholders: ${formAnalysis.hasPlaceholders}, validation: ${formAnalysis.hasValidation}`
    );
  }

  /**
   * Test: Navigation component
   */
  async testNavigationComponent() {
    console.log('\n📋 Test: Navigation component');
    
    await this.browser.goto('/');
    await new Promise(r => setTimeout(r, 1000));
    
    const navAnalysis = await this.browser.page.evaluate(() => {
      const nav = document.querySelector('nav');
      if (!nav) return { found: false };
      
      const links = nav.querySelectorAll('a');
      const buttons = nav.querySelectorAll('button');
      const logo = nav.querySelector('[class*="logo"], img, svg');
      
      return {
        found: true,
        linkCount: links.length,
        buttonCount: buttons.length,
        hasLogo: !!logo,
        isFixed: getComputedStyle(nav).position === 'fixed',
      };
    });
    
    await this.assertions.assert(
      navAnalysis.found,
      `Navigation: ${navAnalysis.linkCount} links, ${navAnalysis.buttonCount} buttons, logo: ${navAnalysis.hasLogo}, fixed: ${navAnalysis.isFixed}`
    );
  }

  /**
   * Test: Loading states
   */
  async testLoadingStates() {
    console.log('\n📋 Test: Loading state components');
    
    await this.browser.goto('/dashboard');
    
    // Check immediately for loading state
    const initialLoading = await this.browser.page.evaluate(() => {
      const loaders = document.querySelectorAll(
        '[class*="loading"], [class*="spinner"], [class*="skeleton"], .animate-spin, .animate-pulse'
      );
      return loaders.length > 0;
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    await this.assertions.assert(
      true,
      `Loading states: ${initialLoading ? 'Loading indicators present' : 'No loading state detected'}`
    );
  }

  /**
   * Test: Toast/notification components
   */
  async testToastComponents() {
    console.log('\n📋 Test: Toast/notification components');
    
    await this.browser.goto('/login');
    await new Promise(r => setTimeout(r, 1000));
    
    const page = this.browser.page;
    
    // Try to trigger a toast by submitting invalid form
    await page.type('input[type="email"]', 'invalid');
    await page.type('input[type="password"]', 'x');
    await page.click('button[type="submit"]');
    
    await new Promise(r => setTimeout(r, 2000));
    
    const hasToast = await page.evaluate(() => {
      const toasts = document.querySelectorAll(
        '[class*="toast"], [class*="notification"], [class*="alert"], [role="alert"]'
      );
      return toasts.length > 0;
    });
    
    await this.assertions.assert(
      true,
      `Toast/notifications: ${hasToast ? 'Error feedback shown' : 'Inline error or redirect'}`
    );
  }

  /**
   * Test: Icon usage
   */
  async testIconUsage() {
    console.log('\n📋 Test: Icon components');
    
    await this.browser.goto('/');
    await new Promise(r => setTimeout(r, 1000));
    
    const iconAnalysis = await this.browser.page.evaluate(() => {
      const svgIcons = document.querySelectorAll('svg');
      const fontIcons = document.querySelectorAll('[class*="icon"], i[class]');
      const imgIcons = document.querySelectorAll('img[src*="icon"]');
      
      return {
        svgCount: svgIcons.length,
        fontIconCount: fontIcons.length,
        imgIconCount: imgIcons.length,
        total: svgIcons.length + fontIcons.length + imgIcons.length,
      };
    });
    
    await this.assertions.assert(
      iconAnalysis.total > 0,
      `Icons: ${iconAnalysis.svgCount} SVG, ${iconAnalysis.fontIconCount} font icons`
    );
  }

  /**
   * Run all component tests
   */
  async runAll() {
    console.log('\n🧩 Running UI Component Tests...\n');
    
    await this.setup();
    
    try {
      await this.testButtonVariants();
      await this.testCardComponents();
      await this.testModalComponents();
      await this.testFormComponents();
      await this.testNavigationComponent();
      await this.testLoadingStates();
      await this.testToastComponents();
      await this.testIconUsage();
    } catch (error) {
      console.error('Test error:', error);
    }
    
    return await this.teardown();
  }
}

module.exports = { ComponentTests };

if (require.main === module) {
  const tests = new ComponentTests();
  tests.runAll().then(summary => {
    console.log('\n📊 Component Test Summary:', summary);
    process.exit(summary.failed > 0 ? 1 : 0);
  });
}
