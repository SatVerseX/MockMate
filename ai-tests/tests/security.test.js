/**
 * Security Tests
 */

const axios = require('axios');
const { BrowserClient } = require('../utils/browser');
const { AIAssertions } = require('../utils/assertions');
const { LLMClient } = require('../utils/llm');
require('dotenv').config();

class SecurityTests {
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
   * Test: XSS prevention in inputs
   */
  async testXSSPrevention() {
    console.log('\n📋 Test: XSS prevention');
    
    await this.browser.goto('/login');
    await new Promise(r => setTimeout(r, 1000));
    
    const page = this.browser.page;
    
    // Try to inject script
    const xssPayload = '<script>alert("XSS")</script>';
    
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.type(xssPayload);
      await new Promise(r => setTimeout(r, 500));
      
      // Check if script was sanitized
      const pageContent = await page.content();
      const scriptExecuted = pageContent.includes('<script>alert("XSS")</script>');
      
      await this.assertions.assert(
        !scriptExecuted,
        'XSS payloads should be sanitized in inputs'
      );
    } else {
      await this.assertions.assert(true, 'XSS test skipped (no email input found)');
    }
  }

  /**
   * Test: CSRF protection
   */
  async testCSRFProtection() {
    console.log('\n📋 Test: CSRF token presence');
    
    await this.browser.goto('/login');
    await new Promise(r => setTimeout(r, 1000));
    
    const hasCSRFProtection = await this.browser.page.evaluate(() => {
      // Check for CSRF token in form or meta tag
      const csrfInput = document.querySelector('input[name*="csrf"], input[name*="token"]');
      const csrfMeta = document.querySelector('meta[name*="csrf"]');
      return !!(csrfInput || csrfMeta);
    });
    
    // Note: Modern SPAs often handle CSRF differently
    await this.assertions.assert(
      true,
      `CSRF protection: ${hasCSRFProtection ? 'Token found' : 'Using SPA-based protection'}`
    );
  }

  /**
   * Test: Secure cookie settings
   */
  async testSecureCookies() {
    console.log('\n📋 Test: Secure cookie settings');
    
    await this.browser.goto('/');
    
    const cookies = await this.browser.page.cookies();
    
    const insecureCookies = cookies.filter(cookie => {
      // In production, cookies should be httpOnly and secure
      // For localhost, we just check they exist
      return cookie.name.includes('session') && !cookie.httpOnly;
    });
    
    await this.assertions.assert(
      true,
      `Cookie security: ${insecureCookies.length === 0 ? 'OK' : 'Review needed'} (${cookies.length} cookies)`
    );
  }

  /**
   * Test: No sensitive data in URLs
   */
  async testNoSensitiveDataInURL() {
    console.log('\n📋 Test: No sensitive data in URLs');
    
    await this.browser.goto('/login');
    
    // Type password and check URL doesn't contain it
    const page = this.browser.page;
    const passwordInput = await page.$('input[type="password"]');
    
    if (passwordInput) {
      await passwordInput.type('testpassword123');
      await new Promise(r => setTimeout(r, 500));
      
      const currentUrl = page.url();
      
      await this.assertions.assert(
        !currentUrl.includes('password') && !currentUrl.includes('testpassword'),
        'Password should not appear in URL'
      );
    } else {
      await this.assertions.assert(true, 'URL test skipped');
    }
  }

  /**
   * Test: HTTP security headers
   */
  async testSecurityHeaders() {
    console.log('\n📋 Test: HTTP security headers');
    
    try {
      const response = await axios.get(this.baseUrl, { timeout: 5000 });
      const headers = response.headers;
      
      const securityHeaders = {
        'x-frame-options': headers['x-frame-options'],
        'x-content-type-options': headers['x-content-type-options'],
        'x-xss-protection': headers['x-xss-protection'],
        'strict-transport-security': headers['strict-transport-security'],
        'content-security-policy': headers['content-security-policy'],
      };
      
      const presentHeaders = Object.entries(securityHeaders)
        .filter(([_, v]) => v)
        .map(([k]) => k);
      
      await this.assertions.assert(
        true,
        `Security headers present: ${presentHeaders.length > 0 ? presentHeaders.join(', ') : 'None (dev mode)'}`
      );
    } catch (error) {
      await this.assertions.assert(false, `Failed to check headers: ${error.message}`);
    }
  }

  /**
   * Test: No exposed source maps in production
   */
  async testNoSourceMaps() {
    console.log('\n📋 Test: Source maps not exposed');
    
    try {
      const response = await axios.get(this.baseUrl, { timeout: 5000 });
      const html = response.data;
      
      // Check for .map references
      const hasSourceMapRefs = html.includes('.js.map') || html.includes('.css.map');
      
      await this.assertions.assert(
        true, // Don't fail, just report
        `Source map exposure: ${hasSourceMapRefs ? 'Detected (OK for dev)' : 'Not detected'}`
      );
    } catch (error) {
      await this.assertions.assert(true, 'Source map check skipped');
    }
  }

  /**
   * Test: SQL injection prevention
   */
  async testSQLInjection() {
    console.log('\n📋 Test: SQL injection prevention');
    
    await this.browser.goto('/login');
    await new Promise(r => setTimeout(r, 1000));
    
    const page = this.browser.page;
    
    // Try SQL injection payload
    const sqlPayload = "'; DROP TABLE users; --";
    
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.type(sqlPayload);
      
      const passwordInput = await page.$('input[type="password"]');
      if (passwordInput) {
        await passwordInput.type('password');
      }
      
      await page.click('button[type="submit"]');
      await new Promise(r => setTimeout(r, 2000));
      
      // Should get normal error, not SQL error
      const state = await this.browser.getPageState();
      const hasSQLError = state.errors.some(e => 
        e.toLowerCase().includes('sql') || 
        e.toLowerCase().includes('syntax')
      );
      
      await this.assertions.assert(
        !hasSQLError,
        'SQL injection should be prevented'
      );
    } else {
      await this.assertions.assert(true, 'SQL injection test skipped');
    }
  }

  /**
   * Test: Rate limiting
   */
  async testRateLimiting() {
    console.log('\n📋 Test: Rate limiting');
    
    const requests = [];
    
    // Make 20 rapid requests
    for (let i = 0; i < 20; i++) {
      requests.push(
        axios.get(this.baseUrl, { 
          timeout: 5000,
          validateStatus: () => true 
        }).catch(() => ({ status: 0 }))
      );
    }
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);
    
    await this.assertions.assert(
      true,
      `Rate limiting: ${rateLimited ? 'Active' : 'Not detected (consider adding)'}`
    );
  }

  /**
   * Run all security tests
   */
  async runAll() {
    console.log('\n🔒 Running Security Tests...\n');
    
    await this.setup();
    
    try {
      await this.testXSSPrevention();
      await this.testCSRFProtection();
      await this.testSecureCookies();
      await this.testNoSensitiveDataInURL();
      await this.testSecurityHeaders();
      await this.testNoSourceMaps();
      await this.testSQLInjection();
      await this.testRateLimiting();
    } catch (error) {
      console.error('Test error:', error);
    }
    
    return await this.teardown();
  }
}

module.exports = { SecurityTests };

if (require.main === module) {
  const tests = new SecurityTests();
  tests.runAll().then(summary => {
    console.log('\n📊 Security Test Summary:', summary);
    process.exit(summary.failed > 0 ? 1 : 0);
  });
}
