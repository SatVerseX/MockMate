/**
 * Authentication Flow Tests
 */

const { BrowserClient } = require('../utils/browser');
const { AIAssertions } = require('../utils/assertions');
const { LLMClient } = require('../utils/llm');

class AuthTests {
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
   * Test: Login page renders correctly
   */
  async testLoginPageRenders() {
    console.log('\n📋 Test: Login page renders correctly');
    
    await this.browser.goto('/login');
    const state = await this.browser.getPageState();
    
    await this.assertions.assert(
      state.inputs.some(i => i.type === 'email'),
      'Email input should be present'
    );
    
    await this.assertions.assert(
      state.inputs.some(i => i.type === 'password'),
      'Password input should be present'
    );
    
    await this.assertions.assert(
      state.buttons.some(b => b.text?.toLowerCase().includes('sign in') || b.text?.toLowerCase().includes('login')),
      'Login button should be present'
    );
  }

  /**
   * Test: Login with invalid credentials shows error
   */
  async testInvalidLogin() {
    console.log('\n📋 Test: Invalid login shows error');
    
    await this.browser.goto('/login');
    
    // Generate fake credentials using AI
    const fakeData = await this.llm.generateTestData(
      'Invalid login credentials for testing',
      { email: 'string', password: 'string' }
    );
    
    const page = this.browser.page;
    await page.type('input[type="email"]', fakeData?.email || 'fake@test.com');
    await page.type('input[type="password"]', fakeData?.password || 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await new Promise(r => setTimeout(r, 2000));
    
    const state = await this.browser.getPageState();
    
    await this.assertions.assert(
      state.errors.length > 0 || state.url.includes('login'),
      'Should show error or stay on login page with invalid credentials'
    );
  }

  /**
   * Test: Signup page renders correctly
   */
  async testSignupPageRenders() {
    console.log('\n📋 Test: Signup page renders correctly');
    
    await this.browser.goto('/signup');
    const state = await this.browser.getPageState();
    
    await this.assertions.assert(
      state.inputs.some(i => i.type === 'email'),
      'Email input should be present on signup'
    );
    
    await this.assertions.assert(
      state.inputs.length >= 2,
      'Should have multiple input fields for signup'
    );
  }

  /**
   * Test: Protected routes redirect to login
   */
  async testProtectedRouteRedirect() {
    console.log('\n📋 Test: Protected routes redirect to login');
    
    await this.browser.goto('/dashboard');
    await new Promise(r => setTimeout(r, 2000));
    
    const state = await this.browser.getPageState();
    
    await this.assertions.assert(
      state.url.includes('login') || state.buttons.some(b => b.text?.includes('Sign')),
      'Should redirect to login or show auth prompt for protected routes'
    );
  }

  /**
   * Test: Google OAuth button present
   */
  async testGoogleAuthPresent() {
    console.log('\n📋 Test: Google OAuth option present');
    
    await this.browser.goto('/login');
    const state = await this.browser.getPageState();
    
    const hasGoogleAuth = state.buttons.some(b => 
      b.text?.toLowerCase().includes('google')
    );
    
    await this.assertions.assert(
      hasGoogleAuth,
      'Google OAuth login option should be available'
    );
  }

  /**
   * Run all auth tests
   */
  async runAll() {
    console.log('\n🔐 Running Authentication Tests...\n');
    
    await this.setup();
    
    try {
      await this.testLoginPageRenders();
      await this.testInvalidLogin();
      await this.testSignupPageRenders();
      await this.testProtectedRouteRedirect();
      await this.testGoogleAuthPresent();
    } catch (error) {
      console.error('Test error:', error);
    }
    
    return await this.teardown();
  }
}

module.exports = { AuthTests };

// Run if called directly
if (require.main === module) {
  const tests = new AuthTests();
  tests.runAll().then(summary => {
    console.log('\n📊 Auth Test Summary:', summary);
    process.exit(summary.failed > 0 ? 1 : 0);
  });
}
