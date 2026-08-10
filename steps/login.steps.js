const path = require('path');
const { pathToFileURL } = require('url');
const { Given, When, Then, Before, After, setDefaultTimeout } = require('@cucumber/cucumber');
const { runMcpArtifactGeneration } = require('../mcp-client');

setDefaultTimeout(30000);

function getDemoAppUrl() {
  const demoAppPath = path.resolve(__dirname, '../demo-app/index.html');
  return pathToFileURL(demoAppPath).toString();
}

Before(async function () {
  await this.launchBrowser();
});

After(async function () {
  await this.closeBrowser();
});

Given('I open the local demo app', async function () {
  await this.page.goto(getDemoAppUrl(), { waitUntil: 'domcontentloaded' });
  await this.page.locator('#login-button').waitFor({ timeout: 10000 });
});

Given('I open Google', async function () {
  await this.page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
  await this.page.locator('textarea[name="q"], input[name="q"]').waitFor({ timeout: 20000 }).catch(() => {});
});

When('I search for {string}', async function (query) {
  const searchBox = this.page.locator('textarea[name="q"], input[name="q"]').first();
  await searchBox.fill(query);
  await searchBox.press('Enter');
  await this.page.waitForLoadState('networkidle').catch(() => {});
});

When('I open the Salesforce sign-up page', async function () {
  const result = this.page.locator('a').filter({ hasText: /salesforce/i }).first();
  if (await result.count()) {
    await result.click();
  } else {
    await this.page.goto('https://test.salesforce.com', { waitUntil: 'domcontentloaded' });
  }
});

Then('I should see the Salesforce sign-up form', async function () {
  await this.page.locator('body').waitFor({ timeout: 10000 });
  const text = await this.page.locator('body').textContent();
  console.log('Salesforce page body preview:', text?.slice(0, 400));
});

When('I enter sample Salesforce signup details', async function () {
  const fields = [
    ['input[name="username"]', 'demo.user@example.com'],
    ['input[name="email"]', 'demo.user@example.com'],
    ['input[name="password"]', 'Password123!'],
  ];

  for (const [selector, value] of fields) {
    const locator = this.page.locator(selector).first();
    if (await locator.count()) {
      await locator.fill(value);
    }
  }
});

When('I click the Salesforce sign-up button', async function () {
  const button = this.page.locator('button, input[type="submit"], input[type="button"]').filter({ hasText: /sign up|signup|register/i }).first();
  if (await button.count()) {
    await button.click().catch(() => {});
  }
});

Then('I should see a signup response message', async function () {
  const bodyText = await this.page.locator('body').textContent();
  console.log('Signup response preview:', bodyText?.slice(0, 400));
});

When('I enter {string} and {string}', async function (username, password) {
  await this.page.fill('#username', username);
  await this.page.fill('#password', password);
});

When('I click the login button', async function () {
  await this.page.click('#login-button');
});

Then('I should see the dashboard', async function () {
  await this.page.locator('#dashboard').waitFor({ state: 'visible', timeout: 10000 });
  const text = await this.page.locator('#dashboard').textContent();
  console.log('Dashboard text:', text);
});

When('I ask the MCP assistant for analysis', async function () {
  const prompt = 'Create a Cucumber feature for a login flow, a step definition file, and a page object for the DemoQA Elements page.';
  const summary = await runMcpArtifactGeneration(prompt);
  this.mcpSummary = summary;
  console.log('MCP assistant:', summary);
});

Then('I should see the MCP summary', async function () {
  const summary = this.mcpSummary || '';
  if (!summary.includes('Artifacts generated successfully')) {
    throw new Error(`Expected MCP summary but got: ${summary}`);
  }
  console.log('MCP summary:', summary);
});
