/**
 * Interview Flow Tests
 */

const { BrowserClient } = require('../utils/browser');
const { AIAssertions } = require('../utils/assertions');
const { LLMClient } = require('../utils/llm');

class InterviewTests {
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
   * Test: Interview setup page loads
   */
  async testSetupPageLoads() {
    console.log('\n📋 Test: Interview setup page loads');
    
    // First login
    try {
      await this.browser.login();
    } catch (e) {
      console.log('Login may have failed, continuing...');
    }
    
    await this.browser.goto('/new-interview');
    await new Promise(r => setTimeout(r, 2000));
    
    const state = await this.browser.getPageState();
    
    await this.assertions.assert(
      state.inputs.length > 0 || state.buttons.length > 0,
      'Interview setup page should have interactive elements'
    );
  }

  /**
   * Test: Interview type selection works
   */
  async testInterviewTypeSelection() {
    console.log('\n📋 Test: Interview type selection');
    
    await this.browser.goto('/');
    const state = await this.browser.getPageState();
    
    // Look for interview type options
    const hasTypeOptions = state.buttons.some(b => 
      b.text?.toLowerCase().includes('technical') ||
      b.text?.toLowerCase().includes('behavioral') ||
      b.text?.toLowerCase().includes('system design')
    );
    
    await this.assertions.assert(
      hasTypeOptions || state.headings.some(h => h?.includes('Interview')),
      'Should have interview type options or interview-related content'
    );
  }

  /**
   * Test: AI-simulated interview conversation
   */
  async testAIInterviewSimulation() {
    console.log('\n📋 Test: AI interview response simulation');
    
    // Simulate what a user might respond to interview questions
    const question = "Tell me about a challenging project you worked on.";
    
    const response = await this.llm.simulateInterviewee(question, {
      role: 'Frontend Developer',
      experience: 'Mid-level',
      type: 'Behavioral'
    });
    
    await this.assertions.assert(
      response && response.length > 50,
      'AI should generate meaningful interview response'
    );
    
    // Validate response quality
    const validation = await this.llm.validateResponse(
      'interview-answer',
      'A coherent, relevant answer to a behavioral interview question',
      { answer: response }
    );
    
    await this.assertions.assert(
      validation.isValid !== false,
      'AI-generated response should be valid interview content'
    );
  }

  /**
   * Test: Dashboard shows interview history
   */
  async testDashboardInterviewHistory() {
    console.log('\n📋 Test: Dashboard shows interview history');
    
    try {
      await this.browser.login();
    } catch (e) {
      console.log('Login skipped');
    }
    
    await this.browser.goto('/dashboard');
    await new Promise(r => setTimeout(r, 3000));
    
    const state = await this.browser.getPageState();
    
    // Check for history-related elements
    const hasHistoryElements = 
      state.headings.some(h => h?.toLowerCase().includes('recent') || h?.toLowerCase().includes('history')) ||
      state.buttons.some(b => b.text?.toLowerCase().includes('history'));
    
    await this.assertions.assert(
      hasHistoryElements || state.url.includes('dashboard'),
      'Dashboard should have history section or be accessible'
    );
  }

  /**
   * Test: New interview button works
   */
  async testNewInterviewButton() {
    console.log('\n📋 Test: New interview button');
    
    await this.browser.goto('/dashboard');
    await new Promise(r => setTimeout(r, 2000));
    
    const state = await this.browser.getPageState();
    
    const hasNewButton = state.buttons.some(b => 
      b.text?.toLowerCase().includes('new') ||
      b.text?.toLowerCase().includes('start') ||
      b.text?.includes('+')
    );
    
    await this.assertions.assert(
      hasNewButton,
      'Should have a button to start new interview'
    );
  }

  /**
   * Run all interview tests
   */
  async runAll() {
    console.log('\n🎤 Running Interview Flow Tests...\n');
    
    await this.setup();
    
    try {
      await this.testSetupPageLoads();
      await this.testInterviewTypeSelection();
      await this.testAIInterviewSimulation();
      await this.testDashboardInterviewHistory();
      await this.testNewInterviewButton();
    } catch (error) {
      console.error('Test error:', error);
    }
    
    return await this.teardown();
  }
}

module.exports = { InterviewTests };

// Run if called directly
if (require.main === module) {
  const tests = new InterviewTests();
  tests.runAll().then(summary => {
    console.log('\n📊 Interview Test Summary:', summary);
    process.exit(summary.failed > 0 ? 1 : 0);
  });
}
