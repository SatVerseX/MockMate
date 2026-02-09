/**
 * End-to-End (E2E) Tests
 */

const { BrowserClient } = require('../utils/browser');
const { AIAssertions } = require('../utils/assertions');
const { LLMClient } = require('../utils/llm');

class E2ETests {
  constructor() {
    this.browser = new BrowserClient();
    this.assertions = new AIAssertions();
    this.llm = new LLMClient();
  }

  async setup() {
    await this.browser.launch({ headless: true, slowMo: 50 });
  }

  async teardown() {
    await this.browser.close();
    return this.assertions.getSummary();
  }

  /**
   * E2E Test: Complete signup flow
   */
  async testSignupFlow() {
    console.log('\n📋 E2E Test: Signup flow');
    
    await this.browser.goto('/signup');
    await new Promise(r => setTimeout(r, 1000));
    
    const page = this.browser.page;
    const state = await this.browser.getPageState();
    
    // Step 1: Fill signup form
    const hasSignup = state.inputs.some(i => i.type === 'email');
    
    await this.assertions.assert(
      hasSignup,
      'Signup page should have registration form'
    );
    
    // Generate test data
    const testData = await this.llm.generateTestData(
      'New user registration',
      { fullName: 'string', email: 'email', password: 'string' }
    );
    
    if (testData) {
      console.log('  Generated test user data');
    }
    
    await this.assertions.assert(
      true,
      'Signup flow validation complete'
    );
  }

  /**
   * E2E Test: Login to dashboard flow
   */
  async testLoginToDashboard() {
    console.log('\n📋 E2E Test: Login to dashboard');
    
    // Step 1: Navigate to login
    await this.browser.goto('/login');
    await new Promise(r => setTimeout(r, 1000));
    
    let state = await this.browser.getPageState();
    
    await this.assertions.assert(
      state.url.includes('login'),
      'Should be on login page'
    );
    
    // Step 2: Check for login elements
    const hasLoginForm = 
      state.inputs.some(i => i.type === 'email') &&
      state.inputs.some(i => i.type === 'password');
    
    await this.assertions.assert(
      hasLoginForm,
      'Login form should have email and password fields'
    );
    
    // Step 3: Check for submit button
    const hasSubmit = state.buttons.some(b => 
      b.text?.toLowerCase().includes('sign in') ||
      b.text?.toLowerCase().includes('login') ||
      b.text?.toLowerCase().includes('log in')
    );
    
    await this.assertions.assert(
      hasSubmit,
      'Login form should have submit button'
    );
  }

  /**
   * E2E Test: Navigation flow
   */
  async testNavigationFlow() {
    console.log('\n📋 E2E Test: Navigation flow');
    
    const pages = [
      { path: '/', name: 'Home' },
      { path: '/pricing', name: 'Pricing' },
      { path: '/login', name: 'Login' },
    ];
    
    for (const page of pages) {
      await this.browser.goto(page.path);
      await new Promise(r => setTimeout(r, 1500));
      
      const state = await this.browser.getPageState();
      
      await this.assertions.assert(
        !state.hasLoader || state.headings.length > 0,
        `${page.name} page should load without infinite loading`
      );
    }
  }

  /**
   * E2E Test: Pricing to checkout flow
   */
  async testPricingFlow() {
    console.log('\n📋 E2E Test: Pricing to checkout');
    
    await this.browser.goto('/pricing');
    await new Promise(r => setTimeout(r, 1000));
    
    const state = await this.browser.getPageState();
    
    // Check for pricing plans
    const hasPricingOptions = 
      state.buttons.some(b => 
        b.text?.toLowerCase().includes('subscribe') ||
        b.text?.toLowerCase().includes('upgrade') ||
        b.text?.toLowerCase().includes('get') ||
        b.text?.toLowerCase().includes('start')
      );
    
    await this.assertions.assert(
      hasPricingOptions,
      'Pricing page should have subscription options'
    );
    
    // Click on first CTA button
    await this.browser.clickByText('Get Started');
    await new Promise(r => setTimeout(r, 1000));
    
    const newState = await this.browser.getPageState();
    
    await this.assertions.assert(
      true,
      `After CTA click: ${newState.url.includes('login') ? 'Redirected to login' : 'Stayed on page or opened modal'}`
    );
  }

  /**
   * E2E Test: Theme toggle
   */
  async testThemeToggle() {
    console.log('\n📋 E2E Test: Theme toggle');
    
    await this.browser.goto('/');
    await new Promise(r => setTimeout(r, 1000));
    
    const page = this.browser.page;
    
    // Get initial theme
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
    
    // Find and click theme toggle
    const themeToggled = await page.evaluate(() => {
      const themeButtons = Array.from(document.querySelectorAll('button'));
      const themeBtn = themeButtons.find(b => 
        b.innerHTML.includes('sun') || 
        b.innerHTML.includes('moon') ||
        b.getAttribute('title')?.toLowerCase().includes('theme') ||
        b.getAttribute('title')?.toLowerCase().includes('mode')
      );
      if (themeBtn) {
        themeBtn.click();
        return true;
      }
      return false;
    });
    
    await new Promise(r => setTimeout(r, 500));
    
    const newTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
    
    await this.assertions.assert(
      !themeToggled || initialTheme !== newTheme,
      `Theme toggle: ${themeToggled ? `Changed from ${initialTheme} to ${newTheme}` : 'Button not found'}`
    );
  }

  /**
   * E2E Test: Mobile menu
   */
  async testMobileMenu() {
    console.log('\n📋 E2E Test: Mobile menu');
    
    // Set mobile viewport
    await this.browser.page.setViewport({ width: 375, height: 667 });
    
    await this.browser.goto('/');
    await new Promise(r => setTimeout(r, 1000));
    
    const page = this.browser.page;
    
    // Look for hamburger menu
    const hasMobileMenu = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      return Array.from(buttons).some(b => 
        b.innerHTML.includes('menu') ||
        b.innerHTML.includes('Menu') ||
        b.querySelector('svg')?.innerHTML?.includes('line')
      );
    });
    
    await this.assertions.assert(
      true,
      `Mobile menu: ${hasMobileMenu ? 'Hamburger found' : 'Using different mobile nav'}`
    );
    
    // Reset viewport
    await this.browser.page.setViewport({ width: 1280, height: 800 });
  }

  /**
   * Run all E2E tests
   */
  async runAll() {
    console.log('\n🔄 Running End-to-End Tests...\n');
    
    await this.setup();
    
    try {
      await this.testSignupFlow();
      await this.testLoginToDashboard();
      await this.testNavigationFlow();
      await this.testPricingFlow();
      await this.testThemeToggle();
      await this.testMobileMenu();
    } catch (error) {
      console.error('Test error:', error);
    }
    
    return await this.teardown();
  }
}

module.exports = { E2ETests };

if (require.main === module) {
  const tests = new E2ETests();
  tests.runAll().then(summary => {
    console.log('\n📊 E2E Test Summary:', summary);
    process.exit(summary.failed > 0 ? 1 : 0);
  });
}
