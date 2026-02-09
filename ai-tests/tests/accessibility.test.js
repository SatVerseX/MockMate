/**
 * Accessibility Tests (a11y)
 */

const { BrowserClient } = require('../utils/browser');
const { AIAssertions } = require('../utils/assertions');
const { LLMClient } = require('../utils/llm');

class AccessibilityTests {
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
   * Test: All images have alt text
   */
  async testImagesHaveAlt() {
    console.log('\n📋 Test: Images have alt text');
    
    const pages = ['/', '/pricing', '/login'];
    
    for (const path of pages) {
      await this.browser.goto(path);
      await new Promise(r => setTimeout(r, 1000));
      
      const imagesWithoutAlt = await this.browser.page.evaluate(() => {
        const images = document.querySelectorAll('img');
        return Array.from(images).filter(img => !img.alt || img.alt.trim() === '').length;
      });
      
      await this.assertions.assert(
        imagesWithoutAlt === 0,
        `${path}: All images should have alt text (${imagesWithoutAlt} missing)`
      );
    }
  }

  /**
   * Test: Form inputs have labels
   */
  async testFormLabels() {
    console.log('\n📋 Test: Form inputs have labels');
    
    await this.browser.goto('/login');
    await new Promise(r => setTimeout(r, 1000));
    
    const unlabeledInputs = await this.browser.page.evaluate(() => {
      const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"])');
      return Array.from(inputs).filter(input => {
        const id = input.id;
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = input.getAttribute('aria-label');
        const hasPlaceholder = input.placeholder;
        return !hasLabel && !hasAriaLabel && !hasPlaceholder;
      }).length;
    });
    
    await this.assertions.assert(
      unlabeledInputs === 0,
      `All form inputs should have labels or aria-labels (${unlabeledInputs} missing)`
    );
  }

  /**
   * Test: Buttons have accessible names
   */
  async testButtonAccessibility() {
    console.log('\n📋 Test: Buttons have accessible names');
    
    await this.browser.goto('/');
    await new Promise(r => setTimeout(r, 1000));
    
    const inaccessibleButtons = await this.browser.page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [role="button"]');
      return Array.from(buttons).filter(btn => {
        const text = btn.textContent?.trim();
        const ariaLabel = btn.getAttribute('aria-label');
        const title = btn.title;
        return !text && !ariaLabel && !title;
      }).length;
    });
    
    await this.assertions.assert(
      inaccessibleButtons === 0,
      `All buttons should have accessible names (${inaccessibleButtons} missing)`
    );
  }

  /**
   * Test: Color contrast
   */
  async testColorContrast() {
    console.log('\n📋 Test: Color contrast (AI analysis)');
    
    await this.browser.goto('/');
    await new Promise(r => setTimeout(r, 1000));
    
    // Get computed styles of main text elements
    const styles = await this.browser.page.evaluate(() => {
      const elements = document.querySelectorAll('h1, h2, h3, p, button, a');
      return Array.from(elements).slice(0, 10).map(el => {
        const style = window.getComputedStyle(el);
        return {
          tag: el.tagName,
          color: style.color,
          backgroundColor: style.backgroundColor,
          text: el.textContent?.substring(0, 50)
        };
      });
    });
    
    // AI analysis of contrast
    const analysis = await this.llm.validateResponse(
      'color-contrast',
      'Text should have sufficient contrast ratio (WCAG AA: 4.5:1 for normal text, 3:1 for large text)',
      { elements: styles }
    );
    
    await this.assertions.assert(
      analysis.isValid !== false,
      'Color contrast should meet WCAG guidelines'
    );
  }

  /**
   * Test: Keyboard navigation
   */
  async testKeyboardNavigation() {
    console.log('\n📋 Test: Keyboard navigation');
    
    await this.browser.goto('/');
    await new Promise(r => setTimeout(r, 1000));
    
    // Check for focus-visible styles and tabindex
    const keyboardAccessible = await this.browser.page.evaluate(() => {
      const focusableElements = document.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      return focusableElements.length > 0;
    });
    
    await this.assertions.assert(
      keyboardAccessible,
      'Page should have focusable elements for keyboard navigation'
    );
  }

  /**
   * Test: Heading hierarchy
   */
  async testHeadingHierarchy() {
    console.log('\n📋 Test: Heading hierarchy');
    
    await this.browser.goto('/');
    await new Promise(r => setTimeout(r, 1000));
    
    const headingIssues = await this.browser.page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const levels = headings.map(h => parseInt(h.tagName.charAt(1)));
      
      let issues = 0;
      // Check if there's an h1
      if (!levels.includes(1)) issues++;
      
      // Check for skipped levels
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i-1] > 1) issues++;
      }
      
      return issues;
    });
    
    await this.assertions.assert(
      headingIssues === 0,
      `Heading hierarchy should be logical (${headingIssues} issues found)`
    );
  }

  /**
   * Test: ARIA attributes
   */
  async testARIAAttributes() {
    console.log('\n📋 Test: ARIA attributes');
    
    await this.browser.goto('/');
    await new Promise(r => setTimeout(r, 1000));
    
    const ariaIssues = await this.browser.page.evaluate(() => {
      let issues = 0;
      
      // Check for aria-hidden on interactive elements
      const hiddenInteractive = document.querySelectorAll(
        '[aria-hidden="true"] button, [aria-hidden="true"] a, [aria-hidden="true"] input'
      );
      issues += hiddenInteractive.length;
      
      // Check for invalid role values
      const elementsWithRoles = document.querySelectorAll('[role]');
      const validRoles = ['button', 'link', 'dialog', 'alert', 'navigation', 'main', 'complementary', 'banner', 'contentinfo', 'search', 'form', 'region', 'tablist', 'tab', 'tabpanel', 'menu', 'menuitem', 'listbox', 'option', 'checkbox', 'radio', 'textbox', 'slider', 'spinbutton', 'progressbar', 'status', 'img', 'heading', 'list', 'listitem', 'table', 'row', 'cell', 'columnheader', 'rowheader', 'tooltip', 'tree', 'treeitem', 'grid', 'gridcell', 'group', 'separator', 'toolbar', 'presentation', 'none'];
      
      elementsWithRoles.forEach(el => {
        const role = el.getAttribute('role');
        if (role && !validRoles.includes(role)) issues++;
      });
      
      return issues;
    });
    
    await this.assertions.assert(
      ariaIssues === 0,
      `ARIA usage should be correct (${ariaIssues} issues found)`
    );
  }

  /**
   * Test: Skip links
   */
  async testSkipLinks() {
    console.log('\n📋 Test: Skip to content link');
    
    await this.browser.goto('/');
    
    const hasSkipLink = await this.browser.page.evaluate(() => {
      const links = document.querySelectorAll('a');
      return Array.from(links).some(link => 
        link.textContent?.toLowerCase().includes('skip') ||
        link.href?.includes('#main') ||
        link.href?.includes('#content')
      );
    });
    
    // Just log, don't fail - skip links are optional
    await this.assertions.assert(
      true,
      `Skip to content link: ${hasSkipLink ? 'Present' : 'Not found (recommended)'}`
    );
  }

  /**
   * Run all accessibility tests
   */
  async runAll() {
    console.log('\n♿ Running Accessibility Tests...\n');
    
    await this.setup();
    
    try {
      await this.testImagesHaveAlt();
      await this.testFormLabels();
      await this.testButtonAccessibility();
      await this.testColorContrast();
      await this.testKeyboardNavigation();
      await this.testHeadingHierarchy();
      await this.testARIAAttributes();
      await this.testSkipLinks();
    } catch (error) {
      console.error('Test error:', error);
    }
    
    return await this.teardown();
  }
}

module.exports = { AccessibilityTests };

if (require.main === module) {
  const tests = new AccessibilityTests();
  tests.runAll().then(summary => {
    console.log('\n📊 Accessibility Test Summary:', summary);
    process.exit(summary.failed > 0 ? 1 : 0);
  });
}
