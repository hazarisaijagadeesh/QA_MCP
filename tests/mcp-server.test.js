const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { generateQaArtifacts } = require('../mcp-server');

test('generateQaArtifacts creates feature, steps, and page files from a prompt', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-qa-'));

  const result = await generateQaArtifacts(
    'Create a login flow for the DemoQA Elements page',
    tempDir
  );

  assert.equal(result.files.feature.endsWith('.feature'), true);
  assert.equal(result.files.steps.endsWith('.steps.ts'), true);
  assert.equal(result.files.page.endsWith('.page.ts'), true);

  const featureText = fs.readFileSync(result.files.feature, 'utf8');
  const stepsText = fs.readFileSync(result.files.steps, 'utf8');
  const pageText = fs.readFileSync(result.files.page, 'utf8');

  assert.match(featureText, /Feature:/);
  assert.match(featureText, /Scenario:/);
  assert.match(stepsText, /import \{ Given, When, Then, Before, After, setDefaultTimeout \} from '@cucumber\/cucumber';/);
  assert.match(stepsText, /Given\(/);
  assert.match(stepsText, /When\(/);
  assert.match(stepsText, /Then\(/);
  assert.match(stepsText, /Before\(/);
  assert.match(stepsText, /this\.launchBrowser/);
  assert.match(pageText, /export class DemoQaElementsPage/);
});
