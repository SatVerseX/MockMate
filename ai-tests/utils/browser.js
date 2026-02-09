/**
 * Browser Utilities using Puppeteer
 */

const puppeteer = require('puppeteer');
require('dotenv').config();

class BrowserClient {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  }

  /**
   * Launch browser and create page
   */
  async launch(options = {}) {
    this.browser = await puppeteer.launch({
      headless: options.headless !== false,
      slowMo: options.slowMo || 0,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 800 });
    
    return this.page;
  }

  /**
   * Navigate to a page
   */
  async goto(path) {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    await this.page.goto(url, { waitUntil: 'networkidle2' });
    return this.page;
  }

  /**
   * Take a screenshot
   */
  async screenshot(name) {
    const path = `./reports/screenshots/${name}-${Date.now()}.png`;
    await this.page.screenshot({ path, fullPage: true });
    return path;
  }

  /**
   * Get page state for AI analysis
   */
  async getPageState() {
    return await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
        .map(b => ({ text: b.textContent?.trim(), disabled: b.disabled }));
      
      const inputs = Array.from(document.querySelectorAll('input, textarea'))
        .map(i => ({ 
          type: i.type, 
          name: i.name, 
          placeholder: i.placeholder,
          value: i.value ? '***' : ''
        }));
      
      const links = Array.from(document.querySelectorAll('a'))
        .map(a => ({ text: a.textContent?.trim(), href: a.href }));
      
      const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
        .map(h => h.textContent?.trim());
      
      const errors = Array.from(document.querySelectorAll('[class*="error"], [role="alert"]'))
        .map(e => e.textContent?.trim());
      
      return {
        url: window.location.href,
        title: document.title,
        buttons,
        inputs,
        links: links.slice(0, 10),
        headings,
        errors,
        hasLoader: !!document.querySelector('[class*="loading"], [class*="spinner"]'),
      };
    });
  }

  /**
   * Login helper
   */
  async login(email, password) {
    await this.goto('/login');
    await this.page.waitForSelector('input[type="email"]');
    await this.page.type('input[type="email"]', email || process.env.TEST_USER_EMAIL);
    await this.page.type('input[type="password"]', password || process.env.TEST_USER_PASSWORD);
    await this.page.click('button[type="submit"]');
    await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
  }

  /**
   * Click element by text
   */
  async clickByText(text) {
    await this.page.evaluate((searchText) => {
      const elements = [...document.querySelectorAll('button, a, [role="button"]')];
      const element = elements.find(el => el.textContent?.includes(searchText));
      if (element) element.click();
    }, text);
  }

  /**
   * Wait for element
   */
  async waitFor(selector, timeout = 10000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = { BrowserClient };
