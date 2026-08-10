const fs = require('fs');
const path = require('path');
const { setWorldConstructor } = require('@cucumber/cucumber');
const { chromium } = require('playwright');

class CustomWorld {
  constructor(options) {
    this.context = options;
    this.browser = null;
    this.contextInstance = null;
    this.page = null;
  }

  async launchBrowser() {
    this.browser = await chromium.launch({ headless: true });
    const videoDir = path.join(process.cwd(), 'videos');
    fs.mkdirSync(videoDir, { recursive: true });

    const scenarioName = this.context?.pickle?.name || 'scenario';
    const safeName = scenarioName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    this.contextInstance = await this.browser.newContext({
      viewport: { width: 1440, height: 900 },
      recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } }
    });

    this.page = await this.contextInstance.newPage();
    this.videoName = `${safeName}.webm`;
  }

  async closeBrowser() {
    if (this.page) {
      try {
        const videoPath = await this.page.video()?.path();
        if (videoPath) {
          console.log(`Video recorded: ${videoPath}`);
        }
      } catch (error) {
        console.log('Video path not available yet');
      }
    }

    if (this.contextInstance) await this.contextInstance.close();
    if (this.browser) await this.browser.close();
  }
}

setWorldConstructor(CustomWorld);
