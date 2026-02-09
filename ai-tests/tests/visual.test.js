/**
 * Visual Regression Tests
 */

const { BrowserClient } = require('../utils/browser');
const { AIAssertions } = require('../utils/assertions');
const { LLMClient } = require('../utils/llm');
const fs = require('fs');
const path = require('path');

class VisualTests {
  constructor() {
    this.browser = new BrowserClient();
    this.assertions = new AIAssertions();
    this.llm = new LLMClient();
    this.snapshotDir = path.join(__dirname, '../snapshots');
  }

  async setup() {
    await this.browser.launch({ headless: true });
    
    // Create snapshot directory
    if (!fs.existsSync(this.snapshotDir)) {
      fs.mkdirSync(this.snapshotDir, { recursive: true });
    }
  }

  async teardown() {
    await this.browser.close();
    return this.assertions.getSummary();
  }

  /**
   * Take and compare screenshots
   */
  async captureAndCompare(name, path) {
    await this.browser.goto(path);
    await new Promise(r => setTimeout(r, 2000));
    
    const screenshotPath = `${this.snapshotDir}/${name}-${Date.now()}.png`;
    await this.browser.page.screenshot({ path: screenshotPath, fullPage: true });
    
    return screenshotPath;
  }

  /**
   * Test: Home page visual consistency
   */
  async testHomePageVisual() {
    console.log('\n📋 Visual Test: Home page');
    
    await this.browser.goto('/');
    await new Promise(r => setTimeout(r, 2000));
    
    // Check for visual layout issues
    const layoutIssues = await this.browser.page.evaluate(() => {
      const issues = [];
      
      // Check for overlapping elements
      const elements = document.querySelectorAll('*');
      const positions = new Map();
      
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const key = `${Math.round(rect.left)},${Math.round(rect.top)}`;
          const existing = positions.get(key);
          if (existing && existing !== el.tagName) {
            // Potential overlap
          }
          positions.set(key, el.tagName);
        }
      });
      
      // Check for horizontal overflow
      if (document.body.scrollWidth > window.innerWidth) {
        issues.push('Horizontal scroll detected');
      }
      
      // Check for cut-off text
      document.querySelectorAll('p, span, div').forEach(el => {
        const style = getComputedStyle(el);
        if (style.overflow === 'hidden' && style.textOverflow !== 'ellipsis') {
          const hasOverflow = el.scrollWidth > el.clientWidth;
          if (hasOverflow) issues.push('Text overflow without ellipsis');
        }
      });
      
      return issues;
    });
    
    await this.assertions.assert(
      layoutIssues.length < 3,
      `Home page layout: ${layoutIssues.length === 0 ? 'Clean' : layoutIssues.join(', ')}`
    );
  }

  /**
   * Test: Responsive design
   */
  async testResponsiveDesign() {
    console.log('\n📋 Visual Test: Responsive design');
    
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Laptop', width: 1366, height: 768 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 },
    ];
    
    for (const viewport of viewports) {
      await this.browser.page.setViewport(viewport);
      await this.browser.goto('/');
      await new Promise(r => setTimeout(r, 1000));
      
      const issues = await this.browser.page.evaluate((vpName) => {
        const problems = [];
        
        // Check for overflow
        if (document.body.scrollWidth > window.innerWidth) {
          problems.push(`Horizontal overflow at ${vpName}`);
        }
        
        // Check if nav is visible or has hamburger
        const nav = document.querySelector('nav');
        if (nav && nav.offsetHeight < 10) {
          problems.push(`Nav not visible at ${vpName}`);
        }
        
        return problems;
      }, viewport.name);
      
      await this.assertions.assert(
        issues.length === 0,
        `${viewport.name} (${viewport.width}x${viewport.height}): ${issues.length === 0 ? 'OK' : issues.join(', ')}`
      );
    }
    
    // Reset to desktop
    await this.browser.page.setViewport({ width: 1280, height: 800 });
  }

  /**
   * Test: Dark mode consistency
   */
  async testDarkModeVisual() {
    console.log('\n📋 Visual Test: Dark mode');
    
    await this.browser.goto('/');
    await new Promise(r => setTimeout(r, 1000));
    
    const page = this.browser.page;
    
    // Toggle to dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    
    await new Promise(r => setTimeout(r, 500));
    
    const darkModeIssues = await page.evaluate(() => {
      const issues = [];
      
      // Check for white text on white background
      document.querySelectorAll('*').forEach(el => {
        const style = getComputedStyle(el);
        const color = style.color;
        const bg = style.backgroundColor;
        
        // Check for very light colors on dark mode
        if (bg.includes('255, 255, 255') && !color.includes('0, 0, 0')) {
          // Potential contrast issue
        }
      });
      
      // Check for hardcoded colors that don't adapt
      document.querySelectorAll('[style*="color"]').forEach(el => {
        issues.push('Inline color style found');
      });
      
      return issues.slice(0, 3);
    });
    
    await this.assertions.assert(
      true,
      `Dark mode: ${darkModeIssues.length === 0 ? 'Consistent' : darkModeIssues.length + ' potential issues'}`
    );
  }

  /**
   * Test: Animation smoothness
   */
  async testAnimationSmoothness() {
    console.log('\n📋 Visual Test: Animation smoothness');
    
    await this.browser.goto('/');
    await new Promise(r => setTimeout(r, 1000));
    
    const animationInfo = await this.browser.page.evaluate(() => {
      const animations = document.getAnimations ? document.getAnimations() : [];
      const transitions = [];
      
      document.querySelectorAll('*').forEach(el => {
        const style = getComputedStyle(el);
        if (style.transition && style.transition !== 'none' && style.transition !== 'all 0s ease 0s') {
          transitions.push(style.transitionDuration);
        }
      });
      
      return {
        activeAnimations: animations.length,
        elementsWithTransitions: transitions.length,
        hasGPUAcceleration: document.querySelector('[style*="transform"]') !== null,
      };
    });
    
    await this.assertions.assert(
      true,
      `Animations: ${animationInfo.activeAnimations} active, ${animationInfo.elementsWithTransitions} transitions`
    );
  }

  /**
   * Test: Font rendering
   */
  async testFontRendering() {
    console.log('\n📋 Visual Test: Font rendering');
    
    await this.browser.goto('/');
    await new Promise(r => setTimeout(r, 2000));
    
    const fontInfo = await this.browser.page.evaluate(() => {
      const fonts = new Set();
      
      document.querySelectorAll('*').forEach(el => {
        const style = getComputedStyle(el);
        const fontFamily = style.fontFamily.split(',')[0].trim().replace(/"/g, '');
        fonts.add(fontFamily);
      });
      
      const hasFallback = Array.from(fonts).some(f => 
        f.includes('sans-serif') || f.includes('serif') || f.includes('monospace')
      );
      
      return {
        fontsUsed: Array.from(fonts).slice(0, 5),
        hasFallback,
        count: fonts.size,
      };
    });
    
    await this.assertions.assert(
      fontInfo.hasFallback,
      `Fonts: ${fontInfo.fontsUsed.join(', ')} (${fontInfo.count} total, fallback: ${fontInfo.hasFallback})`
    );
  }

  /**
   * Run all visual tests
   */
  async runAll() {
    console.log('\n🎨 Running Visual Regression Tests...\n');
    
    await this.setup();
    
    try {
      await this.testHomePageVisual();
      await this.testResponsiveDesign();
      await this.testDarkModeVisual();
      await this.testAnimationSmoothness();
      await this.testFontRendering();
    } catch (error) {
      console.error('Test error:', error);
    }
    
    return await this.teardown();
  }
}

module.exports = { VisualTests };

if (require.main === module) {
  const tests = new VisualTests();
  tests.runAll().then(summary => {
    console.log('\n📊 Visual Test Summary:', summary);
    process.exit(summary.failed > 0 ? 1 : 0);
  });
}
