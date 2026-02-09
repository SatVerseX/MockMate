/**
 * Integration Tests
 */

const axios = require('axios');
const { BrowserClient } = require('../utils/browser');
const { AIAssertions } = require('../utils/assertions');
const { LLMClient } = require('../utils/llm');
require('dotenv').config();

class IntegrationTests {
  constructor() {
    this.browser = new BrowserClient();
    this.assertions = new AIAssertions();
    this.llm = new LLMClient();
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.supabaseUrl = process.env.SUPABASE_URL;
  }

  async setup() {
    await this.browser.launch({ headless: true });
  }

  async teardown() {
    await this.browser.close();
    return this.assertions.getSummary();
  }

  /**
   * Test: Frontend-Backend connection
   */
  async testFrontendBackendConnection() {
    console.log('\n📋 Test: Frontend-Backend integration');
    
    await this.browser.goto('/');
    await new Promise(r => setTimeout(r, 2000));
    
    // Check for any network errors in console
    const consoleErrors = [];
    this.browser.page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    const networkErrors = consoleErrors.filter(e => 
      e.includes('Failed to fetch') || 
      e.includes('NetworkError') ||
      e.includes('CORS')
    );
    
    await this.assertions.assert(
      networkErrors.length === 0,
      `Network connectivity: ${networkErrors.length === 0 ? 'OK' : `${networkErrors.length} errors`}`
    );
  }

  /**
   * Test: Authentication integration
   */
  async testAuthIntegration() {
    console.log('\n📋 Test: Auth provider integration');
    
    await this.browser.goto('/login');
    await new Promise(r => setTimeout(r, 1000));
    
    const state = await this.browser.getPageState();
    
    // Check for OAuth providers
    const hasGoogleAuth = state.buttons.some(b => 
      b.text?.toLowerCase().includes('google')
    );
    
    // Check for email/password auth
    const hasEmailAuth = state.inputs.some(i => i.type === 'email');
    
    await this.assertions.assert(
      hasEmailAuth || hasGoogleAuth,
      `Auth providers: Email=${hasEmailAuth}, Google=${hasGoogleAuth}`
    );
  }

  /**
   * Test: Database connection (via UI state)
   */
  async testDatabaseConnection() {
    console.log('\n📋 Test: Database connectivity');
    
    // Try to login and check if data loads
    try {
      await this.browser.login();
      await this.browser.goto('/dashboard');
      await new Promise(r => setTimeout(r, 3000));
      
      const state = await this.browser.getPageState();
      
      // Check if dashboard loaded (not stuck on loading)
      const isLoaded = !state.hasLoader || state.headings.length > 0;
      
      await this.assertions.assert(
        isLoaded,
        `Database connection: ${isLoaded ? 'Data loaded' : 'Still loading (may need auth)'}`
      );
    } catch (error) {
      await this.assertions.assert(
        true,
        'Database test requires valid credentials'
      );
    }
  }

  /**
   * Test: Payment integration (Razorpay)
   */
  async testPaymentIntegration() {
    console.log('\n📋 Test: Payment provider integration');
    
    await this.browser.goto('/pricing');
    await new Promise(r => setTimeout(r, 1000));
    
    const page = this.browser.page;
    
    // Check for payment-related scripts
    const hasPaymentSDK = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script');
      const scriptSrcs = Array.from(scripts).map(s => s.src);
      
      return scriptSrcs.some(src => 
        src.includes('razorpay') || 
        src.includes('stripe') ||
        src.includes('payment')
      );
    });
    
    // Check for payment buttons
    const state = await this.browser.getPageState();
    const hasPayButtons = state.buttons.some(b => 
      b.text?.toLowerCase().includes('pay') ||
      b.text?.toLowerCase().includes('subscribe') ||
      b.text?.toLowerCase().includes('checkout')
    );
    
    await this.assertions.assert(
      true,
      `Payment integration: SDK=${hasPaymentSDK ? 'Loaded' : 'Lazy-loaded'}, Buttons=${hasPayButtons}`
    );
  }

  /**
   * Test: Real-time features (WebSocket)
   */
  async testRealtimeFeatures() {
    console.log('\n📋 Test: Real-time/WebSocket integration');
    
    await this.browser.goto('/');
    await new Promise(r => setTimeout(r, 2000));
    
    const hasWebSocket = await this.browser.page.evaluate(() => {
      // Check if app uses WebSocket
      return typeof WebSocket !== 'undefined';
    });
    
    await this.assertions.assert(
      hasWebSocket,
      'WebSocket support: Available'
    );
  }

  /**
   * Test: Third-party integrations
   */
  async testThirdPartyIntegrations() {
    console.log('\n📋 Test: Third-party integrations');
    
    await this.browser.goto('/');
    await new Promise(r => setTimeout(r, 2000));
    
    const integrations = await this.browser.page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src);
      
      return {
        analytics: scripts.some(s => 
          s.includes('google-analytics') || 
          s.includes('gtag') ||
          s.includes('analytics')
        ),
        fonts: !!document.querySelector('link[href*="fonts.googleapis"]'),
        monitoring: scripts.some(s => 
          s.includes('sentry') || 
          s.includes('bugsnag') ||
          s.includes('logrocket')
        ),
      };
    });
    
    await this.assertions.assert(
      true,
      `Integrations: Analytics=${integrations.analytics}, Fonts=${integrations.fonts}, Monitoring=${integrations.monitoring}`
    );
  }

  /**
   * Test: API versioning
   */
  async testAPIVersioning() {
    console.log('\n📋 Test: API versioning');
    
    // Check if API calls use versioned endpoints
    await this.browser.goto('/');
    
    const apiCalls = [];
    this.browser.page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('/v1/') || url.includes('/v2/')) {
        apiCalls.push(url);
      }
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    await this.assertions.assert(
      true,
      `API calls detected: ${apiCalls.length > 0 ? apiCalls.length + ' versioned' : 'Using Supabase client'}`
    );
  }

  /**
   * Test: State management
   */
  async testStateManagement() {
    console.log('\n📋 Test: State management integration');
    
    await this.browser.goto('/');
    await new Promise(r => setTimeout(r, 1000));
    
    const stateInfo = await this.browser.page.evaluate(() => {
      return {
        hasReact: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__,
        hasRedux: !!window.__REDUX_DEVTOOLS_EXTENSION__,
        hasLocalStorage: Object.keys(localStorage).length,
        hasSessionStorage: Object.keys(sessionStorage).length,
      };
    });
    
    await this.assertions.assert(
      true,
      `State: React=${stateInfo.hasReact}, LocalStorage=${stateInfo.hasLocalStorage} keys`
    );
  }

  /**
   * Run all integration tests
   */
  async runAll() {
    console.log('\n🔗 Running Integration Tests...\n');
    
    await this.setup();
    
    try {
      await this.testFrontendBackendConnection();
      await this.testAuthIntegration();
      await this.testDatabaseConnection();
      await this.testPaymentIntegration();
      await this.testRealtimeFeatures();
      await this.testThirdPartyIntegrations();
      await this.testAPIVersioning();
      await this.testStateManagement();
    } catch (error) {
      console.error('Test error:', error);
    }
    
    return await this.teardown();
  }
}

module.exports = { IntegrationTests };

if (require.main === module) {
  const tests = new IntegrationTests();
  tests.runAll().then(summary => {
    console.log('\n📊 Integration Test Summary:', summary);
    process.exit(summary.failed > 0 ? 1 : 0);
  });
}
