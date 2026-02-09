/**
 * AI-Powered Assertion Utilities
 */

const { LLMClient } = require('./llm');

class AIAssertions {
  constructor() {
    this.llm = new LLMClient();
    this.results = [];
  }

  /**
   * Assert with AI validation
   */
  async assert(condition, message, context = {}) {
    const result = {
      passed: condition,
      message,
      context,
      timestamp: new Date().toISOString(),
    };
    
    this.results.push(result);
    
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
    } else {
      console.log(`✅ PASSED: ${message}`);
    }
    
    return result;
  }

  /**
   * AI-powered content validation
   */
  async assertContent(actual, expected, message) {
    const prompt = `Compare these two pieces of content and determine if they are semantically equivalent or if the actual matches the expected criteria.

Expected: ${expected}
Actual: ${actual}

Response (JSON only):
{ "match": boolean, "confidence": 0-100, "reason": "explanation" }`;

    try {
      const response = await this.llm.generate(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { match: false };
      
      return this.assert(result.match, message, { 
        expected, 
        actual, 
        confidence: result.confidence,
        reason: result.reason 
      });
    } catch (error) {
      return this.assert(false, message, { error: error.message });
    }
  }

  /**
   * Assert element exists on page
   */
  async assertElementExists(page, selector, message) {
    const exists = await page.$(selector) !== null;
    return this.assert(exists, message, { selector });
  }

  /**
   * Assert text visible on page
   */
  async assertTextVisible(page, text, message) {
    const visible = await page.evaluate((searchText) => {
      return document.body.innerText.includes(searchText);
    }, text);
    
    return this.assert(visible, message, { searchText: text });
  }

  /**
   * Assert no errors on page
   */
  async assertNoErrors(page, message = 'Page should have no visible errors') {
    const errors = await page.evaluate(() => {
      const errorElements = document.querySelectorAll(
        '[class*="error"], [role="alert"], .toast-error'
      );
      return Array.from(errorElements).map(e => e.textContent?.trim()).filter(Boolean);
    });
    
    return this.assert(errors.length === 0, message, { errors });
  }

  /**
   * Assert API response is valid
   */
  async assertAPIResponse(response, expectedStatus, message) {
    const statusMatch = response.status === expectedStatus;
    const hasBody = response.data !== undefined;
    
    return this.assert(statusMatch && hasBody, message, {
      expectedStatus,
      actualStatus: response.status,
      hasBody,
    });
  }

  /**
   * Get test summary
   */
  getSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    
    return {
      total: this.results.length,
      passed,
      failed,
      passRate: this.results.length > 0 
        ? Math.round((passed / this.results.length) * 100) 
        : 0,
      results: this.results,
    };
  }

  /**
   * Reset results
   */
  reset() {
    this.results = [];
  }
}

module.exports = { AIAssertions };
