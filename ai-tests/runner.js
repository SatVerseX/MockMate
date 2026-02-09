/**
 * AI Test Runner for MockMate
 * Uses Llama 3.1 8B via Ollama for intelligent testing
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import all test suites
const { AuthTests } = require('./tests/auth.test');
const { InterviewTests } = require('./tests/interview.test');
const { BillingTests } = require('./tests/billing.test');
const { APITests } = require('./tests/api.test');
const { PerformanceTests } = require('./tests/performance.test');
const { AccessibilityTests } = require('./tests/accessibility.test');
const { SecurityTests } = require('./tests/security.test');
const { E2ETests } = require('./tests/e2e.test');
const { ComponentTests } = require('./tests/components.test');
const { IntegrationTests } = require('./tests/integration.test');
const { ExploratoryTests } = require('./tests/exploratory.test');
const { VisualTests } = require('./tests/visual.test');

class TestRunner {
  constructor() {
    this.suites = {
      // Core functionality tests
      auth: AuthTests,
      interview: InterviewTests,
      billing: BillingTests,
      api: APITests,
      
      // Quality tests
      performance: PerformanceTests,
      accessibility: AccessibilityTests,
      security: SecurityTests,
      
      // UI & UX tests
      components: ComponentTests,
      visual: VisualTests,
      
      // Flow tests
      e2e: E2ETests,
      integration: IntegrationTests,
      
      // AI-driven tests
      exploratory: ExploratoryTests,
    };
    this.results = {};
    this.startTime = null;
  }

  /**
   * Parse command line arguments
   */
  parseArgs() {
    const args = process.argv.slice(2);
    
    // Check for --suite=value or --suite value
    let suite = null;
    const suiteArg = args.find(a => a.startsWith('--suite'));
    if (suiteArg) {
      if (suiteArg.includes('=')) {
        suite = suiteArg.split('=')[1];
      } else {
        const idx = args.indexOf('--suite');
        if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) {
          suite = args[idx + 1];
        }
      }
    }
    
    // Check for --category=value or --category value
    let category = null;
    const categoryArg = args.find(a => a.startsWith('--category'));
    if (categoryArg) {
      if (categoryArg.includes('=')) {
        category = categoryArg.split('=')[1];
      } else {
        const idx = args.indexOf('--category');
        if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) {
          category = args[idx + 1];
        }
      }
    }
    
    return {
      all: args.includes('--all'),
      suite,
      category,
      verbose: args.includes('--verbose'),
    };
  }


  /**
   * Check Ollama availability
   */
  async checkOllama() {
    const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
    console.log(chalk.cyan(`\n🔌 Checking Ollama at ${host}...`));
    
    try {
      const response = await fetch(`${host}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        const hasLlama = data.models?.some(m => m.name.includes('llama3.1'));
        
        if (hasLlama) {
          console.log(chalk.green('✅ Ollama connected with Llama 3.1 model'));
          return true;
        } else {
          console.log(chalk.yellow('⚠️  Llama 3.1 model not found. Run: ollama pull llama3.1:8b'));
          return false;
        }
      }
    } catch (error) {
      console.log(chalk.red('❌ Ollama not running. Start it with: ollama serve'));
      console.log(chalk.gray('   Tests will run with limited AI features.\n'));
      return false;
    }
    return false;
  }

  /**
   * Run a specific test suite
   */
  async runSuite(name) {
    if (!this.suites[name]) {
      console.log(chalk.red(`Unknown test suite: ${name}`));
      console.log(chalk.gray(`Available suites: ${Object.keys(this.suites).join(', ')}`));
      return null;
    }

    console.log(chalk.blue(`\n${'='.repeat(50)}`));
    console.log(chalk.blue.bold(`  Running ${name.toUpperCase()} Tests`));
    console.log(chalk.blue(`${'='.repeat(50)}`));

    const TestClass = this.suites[name];
    const tests = new TestClass();
    
    try {
      const summary = await tests.runAll();
      this.results[name] = summary;
      return summary;
    } catch (error) {
      console.error(chalk.red(`Suite ${name} failed:`, error.message));
      this.results[name] = { total: 0, passed: 0, failed: 1, error: error.message };
      return this.results[name];
    }
  }

  /**
   * Run tests by category
   */
  async runCategory(category) {
    const categories = {
      core: ['auth', 'interview', 'billing', 'api'],
      quality: ['performance', 'accessibility', 'security'],
      ui: ['components', 'visual'],
      flows: ['e2e', 'integration'],
      ai: ['exploratory'],
    };

    if (!categories[category]) {
      console.log(chalk.red(`Unknown category: ${category}`));
      console.log(chalk.gray(`Available categories: ${Object.keys(categories).join(', ')}`));
      return;
    }

    console.log(chalk.magenta.bold(`\n🧪 Running ${category.toUpperCase()} Tests`));
    
    for (const suite of categories[category]) {
      await this.runSuite(suite);
    }
  }

  /**
   * Run all test suites
   */
  async runAll() {
    console.log(chalk.magenta.bold('\n🧪 MockMate AI Test Suite'));
    console.log(chalk.magenta('   Powered by Llama 3.1 8B\n'));

    await this.checkOllama();

    this.startTime = Date.now();

    for (const suiteName of Object.keys(this.suites)) {
      await this.runSuite(suiteName);
    }

    this.printFinalReport();
  }

  /**
   * Print final test report
   */
  printFinalReport() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    console.log(chalk.magenta(`\n${'='.repeat(50)}`));
    console.log(chalk.magenta.bold('  📊 FINAL TEST REPORT'));
    console.log(chalk.magenta(`${'='.repeat(50)}\n`));

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    for (const [suite, result] of Object.entries(this.results)) {
      const icon = result.failed === 0 ? '✅' : '❌';
      const color = result.failed === 0 ? chalk.green : chalk.red;
      
      console.log(color(`${icon} ${suite.toUpperCase()}: ${result.passed}/${result.total} passed`));
      
      totalTests += result.total;
      totalPassed += result.passed;
      totalFailed += result.failed;
    }

    console.log(chalk.gray(`\n${'─'.repeat(50)}`));
    console.log(chalk.bold(`Total: ${totalPassed}/${totalTests} tests passed`));
    console.log(chalk.bold(`Pass Rate: ${totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0}%`));
    console.log(chalk.gray(`Duration: ${duration}s`));
    console.log(chalk.gray(`${'─'.repeat(50)}\n`));

    // Save report to file
    this.saveReport({
      timestamp: new Date().toISOString(),
      duration: parseFloat(duration),
      totalTests,
      totalPassed,
      totalFailed,
      passRate: totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0,
      suites: this.results,
    });

    if (totalFailed > 0) {
      console.log(chalk.yellow('⚠️  Some tests failed. Check output above for details.\n'));
    } else {
      console.log(chalk.green('🎉 All tests passed!\n'));
    }
  }

  /**
   * Save report to file
   */
  saveReport(report) {
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `report-${Date.now()}.json`;
    fs.writeFileSync(
      path.join(reportsDir, filename),
      JSON.stringify(report, null, 2)
    );
    console.log(chalk.gray(`Report saved: reports/${filename}`));
  }

  /**
   * Print help
   */
  printHelp() {
    console.log(chalk.cyan.bold('\n🧪 MockMate AI Test Suite\n'));
    console.log(chalk.white('Usage:'));
    console.log('  npm test                    - Run all tests');
    console.log('  npm run test:<suite>        - Run specific suite');
    console.log('  npm run test:category:<cat> - Run test category\n');
    
    console.log(chalk.white('Individual Suites:'));
    console.log('  test:auth         - Authentication tests');
    console.log('  test:interview    - Interview flow tests');
    console.log('  test:billing      - Billing/subscription tests');
    console.log('  test:api          - API endpoint tests');
    console.log('  test:performance  - Performance tests');
    console.log('  test:accessibility - Accessibility (a11y) tests');
    console.log('  test:security     - Security tests');
    console.log('  test:components   - UI component tests');
    console.log('  test:visual       - Visual regression tests');
    console.log('  test:e2e          - End-to-end tests');
    console.log('  test:integration  - Integration tests');
    console.log('  test:exploratory  - AI exploratory tests\n');
    
    console.log(chalk.white('Categories:'));
    console.log('  test:category:core    - Auth, Interview, Billing, API');
    console.log('  test:category:quality - Performance, Accessibility, Security');
    console.log('  test:category:ui      - Components, Visual');
    console.log('  test:category:flows   - E2E, Integration');
    console.log('  test:category:ai      - Exploratory\n');
    
    console.log(chalk.gray('Make sure Ollama is running: ollama serve'));
    console.log(chalk.gray('Pull the model: ollama pull llama3.1:8b\n'));
  }

  /**
   * Main entry point
   */
  async run() {
    const args = this.parseArgs();

    if (args.category) {
      this.startTime = Date.now();
      await this.runCategory(args.category);
      this.printFinalReport();
    } else if (args.suite) {
      this.startTime = Date.now();
      await this.runSuite(args.suite);
      this.printFinalReport();
    } else if (args.all) {
      await this.runAll();
    } else {
      this.printHelp();
    }

    return Object.values(this.results).some(r => r.failed > 0) ? 1 : 0;
  }
}

// Run
const runner = new TestRunner();
runner.run().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
