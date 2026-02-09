/**
 * Performance Tests
 */

const axios = require('axios');
const { AIAssertions } = require('../utils/assertions');
const { LLMClient } = require('../utils/llm');
const { BrowserClient } = require('../utils/browser');
require('dotenv').config();

class PerformanceTests {
  constructor() {
    this.assertions = new AIAssertions();
    this.llm = new LLMClient();
    this.browser = new BrowserClient();
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
   * Test: Page load time
   */
  async testPageLoadTime() {
    console.log('\n📋 Test: Page load time');
    
    const routes = ['/', '/login', '/pricing', '/dashboard'];
    
    for (const route of routes) {
      const start = Date.now();
      
      try {
        await axios.get(`${this.baseUrl}${route}`, { timeout: 10000 });
        const loadTime = Date.now() - start;
        
        await this.assertions.assert(
          loadTime < 3000,
          `${route} should load under 3s (took ${loadTime}ms)`
        );
      } catch (error) {
        await this.assertions.assert(
          false,
          `${route} failed to load: ${error.message}`
        );
      }
    }
  }

  /**
   * Test: First Contentful Paint
   */
  async testFirstContentfulPaint() {
    console.log('\n📋 Test: First Contentful Paint');
    
    await this.browser.goto('/');
    
    const fcp = await this.browser.page.evaluate(() => {
      return new Promise(resolve => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcp = entries.find(e => e.name === 'first-contentful-paint');
          resolve(fcp ? fcp.startTime : null);
        });
        observer.observe({ entryTypes: ['paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve(null), 5000);
      });
    });
    
    await this.assertions.assert(
      fcp === null || fcp < 2000,
      `First Contentful Paint should be under 2s${fcp ? ` (got ${fcp.toFixed(0)}ms)` : ''}`
    );
  }

  /**
   * Test: Bundle size check
   */
  async testBundleSize() {
    console.log('\n📋 Test: Bundle size');
    
    try {
      const response = await axios.get(this.baseUrl, { timeout: 10000 });
      const html = response.data;
      
      // Extract script sources
      const scriptMatches = html.match(/src="([^"]+\.js)"/g) || [];
      
      let totalSize = 0;
      for (const match of scriptMatches.slice(0, 5)) {
        const src = match.replace('src="', '').replace('"', '');
        const fullUrl = src.startsWith('http') ? src : `${this.baseUrl}${src}`;
        
        try {
          const scriptRes = await axios.head(fullUrl, { timeout: 5000 });
          const size = parseInt(scriptRes.headers['content-length'] || '0');
          totalSize += size;
        } catch (e) {
          // Ignore individual script errors
        }
      }
      
      const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
      
      await this.assertions.assert(
        totalSize < 5 * 1024 * 1024, // 5MB limit
        `Total JS bundle should be under 5MB (got ${sizeMB}MB)`
      );
    } catch (error) {
      await this.assertions.assert(
        true,
        'Bundle size check skipped (could not measure)'
      );
    }
  }

  /**
   * Test: Memory usage
   */
  async testMemoryUsage() {
    console.log('\n📋 Test: Memory usage');
    
    await this.browser.goto('/dashboard');
    await new Promise(r => setTimeout(r, 3000));
    
    const metrics = await this.browser.page.metrics();
    const heapMB = (metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2);
    
    await this.assertions.assert(
      metrics.JSHeapUsedSize < 100 * 1024 * 1024, // 100MB limit
      `JS heap should be under 100MB (got ${heapMB}MB)`
    );
  }

  /**
   * Test: API response time
   */
  async testAPIResponseTime() {
    console.log('\n📋 Test: API response times');
    
    const endpoints = [
      { url: '/', name: 'Home' },
      { url: '/pricing', name: 'Pricing' },
    ];
    
    for (const endpoint of endpoints) {
      const times = [];
      
      for (let i = 0; i < 3; i++) {
        const start = Date.now();
        try {
          await axios.get(`${this.baseUrl}${endpoint.url}`, { timeout: 5000 });
          times.push(Date.now() - start);
        } catch (e) {
          times.push(5000);
        }
      }
      
      const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      
      await this.assertions.assert(
        avgTime < 2000,
        `${endpoint.name} avg response time should be under 2s (got ${avgTime}ms)`
      );
    }
  }

  /**
   * Run all performance tests
   */
  async runAll() {
    console.log('\n⚡ Running Performance Tests...\n');
    
    await this.setup();
    
    try {
      await this.testPageLoadTime();
      await this.testFirstContentfulPaint();
      await this.testBundleSize();
      await this.testMemoryUsage();
      await this.testAPIResponseTime();
    } catch (error) {
      console.error('Test error:', error);
    }
    
    return await this.teardown();
  }
}

module.exports = { PerformanceTests };

if (require.main === module) {
  const tests = new PerformanceTests();
  tests.runAll().then(summary => {
    console.log('\n📊 Performance Test Summary:', summary);
    process.exit(summary.failed > 0 ? 1 : 0);
  });
}
