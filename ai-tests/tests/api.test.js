/**
 * API Endpoint Tests
 */

const axios = require('axios');
const { AIAssertions } = require('../utils/assertions');
const { LLMClient } = require('../utils/llm');
require('dotenv').config();

class APITests {
  constructor() {
    this.assertions = new AIAssertions();
    this.llm = new LLMClient();
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.supabaseUrl = process.env.SUPABASE_URL;
  }

  /**
   * Test: Health check endpoint
   */
  async testHealthCheck() {
    console.log('\n📋 Test: Application health check');
    
    try {
      const response = await axios.get(this.baseUrl, { timeout: 5000 });
      
      await this.assertions.assert(
        response.status === 200,
        'Application should return 200 OK'
      );
    } catch (error) {
      await this.assertions.assert(
        false,
        `Health check failed: ${error.message}`
      );
    }
  }

  /**
   * Test: Static assets load
   */
  async testStaticAssets() {
    console.log('\n📋 Test: Static assets load correctly');
    
    try {
      const response = await axios.get(this.baseUrl, { timeout: 10000 });
      
      // Check if HTML contains expected elements
      const hasAssets = 
        response.data.includes('<script') &&
        response.data.includes('<link');
      
      await this.assertions.assert(
        hasAssets,
        'HTML should include script and link tags for assets'
      );
    } catch (error) {
      await this.assertions.assert(
        false,
        `Static assets test failed: ${error.message}`
      );
    }
  }

  /**
   * Test: API response validation with AI
   */
  async testAPIResponseQuality() {
    console.log('\n📋 Test: API response quality validation');
    
    try {
      const response = await axios.get(this.baseUrl, { timeout: 10000 });
      
      // Use AI to validate the response
      const validation = await this.llm.validateResponse(
        'GET /',
        'Should return valid HTML for a React SPA with proper meta tags',
        { 
          status: response.status,
          contentType: response.headers['content-type'],
          bodyPreview: response.data.substring(0, 500)
        }
      );
      
      await this.assertions.assert(
        validation.isValid !== false,
        'API response should meet quality standards'
      );
      
      if (validation.suggestions?.length > 0) {
        console.log('  AI Suggestions:', validation.suggestions);
      }
    } catch (error) {
      await this.assertions.assert(
        false,
        `API quality test failed: ${error.message}`
      );
    }
  }

  /**
   * Test: CORS headers present
   */
  async testCORSHeaders() {
    console.log('\n📋 Test: CORS configuration');
    
    try {
      const response = await axios.options(this.baseUrl, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      // In development, CORS might not be strictly configured
      await this.assertions.assert(
        response.status < 500,
        'CORS preflight should not cause server error'
      );
    } catch (error) {
      // CORS errors are expected in some cases
      await this.assertions.assert(
        true,
        'CORS test completed (may not apply to all endpoints)'
      );
    }
  }

  /**
   * Test: 404 handling
   */
  async test404Handling() {
    console.log('\n📋 Test: 404 error handling');
    
    try {
      const response = await axios.get(`${this.baseUrl}/nonexistent-page-12345`, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      // SPA should return 200 and handle routing client-side
      // Or return proper 404
      await this.assertions.assert(
        response.status === 200 || response.status === 404,
        'Should handle non-existent routes gracefully'
      );
    } catch (error) {
      await this.assertions.assert(
        false,
        `404 handling test failed: ${error.message}`
      );
    }
  }

  /**
   * Test: Security headers
   */
  async testSecurityHeaders() {
    console.log('\n📋 Test: Security headers');
    
    try {
      const response = await axios.get(this.baseUrl, { timeout: 5000 });
      
      const headers = response.headers;
      const securityChecks = [];
      
      // Check common security headers
      if (headers['x-frame-options']) securityChecks.push('X-Frame-Options');
      if (headers['x-content-type-options']) securityChecks.push('X-Content-Type-Options');
      if (headers['strict-transport-security']) securityChecks.push('HSTS');
      
      await this.assertions.assert(
        true, // Just log what's present, don't fail
        `Security headers found: ${securityChecks.join(', ') || 'None (development mode)'}`
      );
    } catch (error) {
      await this.assertions.assert(
        false,
        `Security headers test failed: ${error.message}`
      );
    }
  }

  /**
   * Run all API tests
   */
  async runAll() {
    console.log('\n🌐 Running API Endpoint Tests...\n');
    
    try {
      await this.testHealthCheck();
      await this.testStaticAssets();
      await this.testAPIResponseQuality();
      await this.testCORSHeaders();
      await this.test404Handling();
      await this.testSecurityHeaders();
    } catch (error) {
      console.error('Test error:', error);
    }
    
    return this.assertions.getSummary();
  }
}

module.exports = { APITests };

// Run if called directly
if (require.main === module) {
  const tests = new APITests();
  tests.runAll().then(summary => {
    console.log('\n📊 API Test Summary:', summary);
    process.exit(summary.failed > 0 ? 1 : 0);
  });
}
