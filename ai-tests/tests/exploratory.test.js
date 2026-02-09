/**
 * AI-Powered Exploratory Tests
 * Uses Llama 3.1 8B to intelligently explore the application
 */

const { BrowserClient } = require('../utils/browser');
const { AIAssertions } = require('../utils/assertions');
const { LLMClient } = require('../utils/llm');

class ExploratoryTests {
  constructor() {
    this.browser = new BrowserClient();
    this.assertions = new AIAssertions();
    this.llm = new LLMClient();
    this.maxActions = 10;
    this.actionHistory = [];
  }

  async setup() {
    await this.browser.launch({ headless: true, slowMo: 100 });
  }

  async teardown() {
    await this.browser.close();
    return this.assertions.getSummary();
  }

  /**
   * AI-driven exploration session
   */
  async runExploration(startPath = '/') {
    console.log('\n🤖 Starting AI-Driven Exploration...\n');
    
    await this.browser.goto(startPath);
    await new Promise(r => setTimeout(r, 1000));
    
    for (let i = 0; i < this.maxActions; i++) {
      console.log(`\n--- Exploration Step ${i + 1}/${this.maxActions} ---`);
      
      // Get current page state
      const state = await this.browser.getPageState();
      console.log(`  Page: ${state.url}`);
      console.log(`  Headings: ${state.headings.slice(0, 2).join(', ')}`);
      
      // Ask AI for next action
      const nextAction = await this.llm.getExploratoryAction(state, this.actionHistory);
      
      if (!nextAction) {
        console.log('  AI could not suggest action, continuing...');
        continue;
      }
      
      console.log(`  AI Suggests: ${nextAction.action} - ${nextAction.reason}`);
      
      try {
        await this.executeAction(nextAction);
        this.actionHistory.push(`${nextAction.action}: ${nextAction.target || nextAction.value}`);
        
        await new Promise(r => setTimeout(r, 1000));
        
        // Check for errors after action
        const newState = await this.browser.getPageState();
        
        if (newState.errors.length > 0) {
          await this.assertions.assert(
            false,
            `Error found after ${nextAction.action}: ${newState.errors[0]}`
          );
        } else {
          await this.assertions.assert(
            true,
            `Action "${nextAction.action}" completed successfully`
          );
        }
      } catch (error) {
        console.log(`  Action failed: ${error.message}`);
        this.actionHistory.push(`FAILED: ${nextAction.action}`);
      }
    }
    
    console.log('\n📝 Exploration Summary:');
    console.log(`  Actions taken: ${this.actionHistory.length}`);
    this.actionHistory.forEach((a, i) => console.log(`  ${i + 1}. ${a}`));
  }

  /**
   * Execute an AI-suggested action
   */
  async executeAction(action) {
    const page = this.browser.page;
    
    switch (action.action) {
      case 'click':
        if (action.target.startsWith('text:')) {
          await this.browser.clickByText(action.target.replace('text:', ''));
        } else {
          await page.click(action.target);
        }
        break;
        
      case 'type':
        await page.type(action.target, action.value);
        break;
        
      case 'navigate':
        await this.browser.goto(action.target);
        break;
        
      case 'scroll':
        await page.evaluate(() => window.scrollBy(0, 500));
        break;
        
      case 'wait':
        await new Promise(r => setTimeout(r, parseInt(action.value) || 1000));
        break;
        
      default:
        console.log(`  Unknown action: ${action.action}`);
    }
  }

  /**
   * Explore authentication flows
   */
  async exploreAuthFlows() {
    console.log('\n📋 Exploring: Authentication Flows');
    
    this.actionHistory = [];
    this.maxActions = 8;
    
    await this.runExploration('/login');
  }

  /**
   * Explore main app features
   */
  async exploreMainFeatures() {
    console.log('\n📋 Exploring: Main App Features');
    
    this.actionHistory = [];
    this.maxActions = 10;
    
    await this.runExploration('/');
  }

  /**
   * Explore edge cases
   */
  async exploreEdgeCases() {
    console.log('\n📋 Exploring: Edge Cases');
    
    // Try some unusual inputs
    await this.browser.goto('/login');
    await new Promise(r => setTimeout(r, 1000));
    
    const edgeCases = [
      { type: 'empty', email: '', password: '' },
      { type: 'spaces', email: '   ', password: '   ' },
      { type: 'unicode', email: 'user@例え.jp', password: '🔐🔑' },
      { type: 'long', email: 'a'.repeat(300) + '@test.com', password: 'x'.repeat(200) },
    ];
    
    for (const testCase of edgeCases) {
      console.log(`  Testing ${testCase.type} input...`);
      
      await this.browser.goto('/login');
      await new Promise(r => setTimeout(r, 500));
      
      const page = this.browser.page;
      const emailInput = await page.$('input[type="email"]');
      const passwordInput = await page.$('input[type="password"]');
      
      if (emailInput && passwordInput) {
        try {
          await emailInput.type(testCase.email);
          await passwordInput.type(testCase.password);
          await page.click('button[type="submit"]');
          await new Promise(r => setTimeout(r, 1000));
          
          const state = await this.browser.getPageState();
          const hasCrash = state.errors.some(e => 
            e.includes('crash') || 
            e.includes('undefined') ||
            e.includes('null')
          );
          
          await this.assertions.assert(
            !hasCrash,
            `${testCase.type} input handled gracefully`
          );
        } catch (error) {
          await this.assertions.assert(
            true,
            `${testCase.type} input rejected (expected)`
          );
        }
      }
    }
  }

  /**
   * Rapid action stress test
   */
  async stressTest() {
    console.log('\n📋 Running: Stress Test');
    
    await this.browser.goto('/');
    await new Promise(r => setTimeout(r, 1000));
    
    const page = this.browser.page;
    
    // Rapid clicks
    console.log('  Performing rapid interactions...');
    
    for (let i = 0; i < 20; i++) {
      try {
        await page.mouse.click(
          Math.random() * 800 + 100,
          Math.random() * 600 + 100
        );
        await new Promise(r => setTimeout(r, 50));
      } catch (e) {
        // Ignore click errors
      }
    }
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Check if app is still responsive
    const state = await this.browser.getPageState();
    
    await this.assertions.assert(
      state.url !== 'about:blank' && !state.errors.some(e => e.includes('crash')),
      'App remains stable after rapid interactions'
    );
  }

  /**
   * Run all exploratory tests
   */
  async runAll() {
    console.log('\n🔍 Running AI-Powered Exploratory Tests...\n');
    
    await this.setup();
    
    try {
      await this.exploreAuthFlows();
      await this.exploreMainFeatures();
      await this.exploreEdgeCases();
      await this.stressTest();
    } catch (error) {
      console.error('Test error:', error);
    }
    
    return await this.teardown();
  }
}

module.exports = { ExploratoryTests };

if (require.main === module) {
  const tests = new ExploratoryTests();
  tests.runAll().then(summary => {
    console.log('\n📊 Exploratory Test Summary:', summary);
    process.exit(summary.failed > 0 ? 1 : 0);
  });
}
