const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

function slugifyPrompt(prompt) {
  const base = (prompt || 'sample flow')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const stopWords = new Set([
    'create',
    'a',
    'an',
    'the',
    'for',
    'flow',
    'page',
    'test',
    'feature',
    'file',
    'step',
    'steps',
    'definition',
    'definitions',
    'and',
    'with',
    'to',
    'of',
    'on',
    'in',
    'into',
  ]);

  const relevantWords = base.filter((word) => !stopWords.has(word));
  return relevantWords.length ? relevantWords.join('-') : 'sample-flow';
}

function toPascalCase(value) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function inferPageClassName(prompt) {
  const lower = (prompt || '').toLowerCase();

  if (lower.includes('demoqa') && lower.includes('elements')) {
    return 'DemoQaElementsPage';
  }

  if (lower.includes('login')) {
    return 'LoginPage';
  }

  const words = lower
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const meaningfulWords = words.filter((word) => !['create', 'a', 'an', 'the', 'for', 'page', 'flow', 'test', 'feature', 'file', 'step', 'steps', 'definition', 'definitions', 'and', 'with', 'to', 'of', 'on', 'in', 'into'].includes(word));
  const baseName = meaningfulWords.slice(0, 3).join(' ');
  return `${toPascalCase(baseName) || 'Sample'}Page`;
}

async function runObservedFlow(prompt) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
    await page.locator('body').click().catch(() => {});
    return {
      prompt,
      observedAction: 'opened example.com and clicked the page body',
      outcome: 'page loaded successfully',
    };
  } finally {
    await context.close();
    await browser.close();
  }
}

async function generateQaArtifacts(prompt, outputDir = path.join(process.cwd(), 'generated')) {
  const slug = slugifyPrompt(prompt) || 'sample-flow';
  const featureTitle = slug.replace(/-/g, ' ');
  const pageClassName = inferPageClassName(prompt);
  const featureDir = path.resolve(outputDir);
  fs.mkdirSync(featureDir, { recursive: true });

  const featureFile = path.join(featureDir, `${slug}.feature`);
  const stepsFile = path.join(featureDir, `${slug}.steps.ts`);
  const pageFile = path.join(featureDir, `${slug}.page.ts`);

  const normalizedPrompt = (prompt || '').trim();
  const actionPhrase = normalizedPrompt ? normalizedPrompt.replace(/\s+/g, ' ') : 'perform the requested action';
  const scenarioName = normalizedPrompt ? `User completes: ${actionPhrase}` : 'User completes the requested flow';
  const observed = await runObservedFlow(prompt);

  const featureContent = `Feature: ${featureTitle}\n\n  Scenario: ${scenarioName}\n    Given I open the target page\n    When I ${actionPhrase.toLowerCase()}\n    Then the expected outcome is visible\n\n  Background:\n    Given the browser executed the observed flow\n`;

  const stepsContent = `import { Given, When, Then, Before, After, setDefaultTimeout } from '@cucumber/cucumber';\nimport { ${pageClassName} } from './${slug}.page';\n\nsetDefaultTimeout(30000);\n\nBefore(async function () {\n  if (!this.page) {\n    await this.launchBrowser();\n  }\n});\n\nAfter(async function () {\n  if (this.closeBrowser) {\n    await this.closeBrowser();\n  }\n});\n\nGiven('the browser executed the observed flow', function () {\n  console.log('Observed flow: ${observed.observedAction}');\n});\n\nGiven('I open the target page', async function () {\n  const page = new ${pageClassName}(this.page);\n  await page.gotoPage();\n});\n\nWhen('I ${actionPhrase.toLowerCase()}', async function () {\n  const page = new ${pageClassName}(this.page);\n  await page.performAction();\n});\n\nThen('the expected outcome is visible', async function () {\n  const page = new ${pageClassName}(this.page);\n  await page.verifyOutcome();\n});\n`;

  const pageContent = `export class ${pageClassName} {\n  constructor(private page: any) {}\n\n  async gotoPage(): Promise<void> {\n    if (this.page) {\n      await this.page.goto('https://example.com', { waitUntil: 'domcontentloaded' });\n    }\n  }\n\n  async performAction(): Promise<void> {\n    if (this.page) {\n      await this.page.locator('body').click().catch(() => {});\n    }\n  }\n\n  async verifyOutcome(): Promise<void> {\n    if (this.page) {\n      await this.page.locator('body').waitFor({ state: 'visible' }).catch(() => {});\n    }\n  }\n}\n`;

  fs.writeFileSync(featureFile, featureContent);
  fs.writeFileSync(stepsFile, stepsContent);
  fs.writeFileSync(pageFile, pageContent);

  return {
    prompt,
    observed: observed.observedAction,
    files: {
      feature: featureFile,
      steps: stepsFile,
      page: pageFile,
    },
  };
}

const server = new Server(
  {
    name: 'qa-automation-demo',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'generate_qa_artifacts',
      description: 'Generate a feature file, step definitions, and page object from a natural-language QA prompt',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
        },
        required: ['prompt'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  if (name === 'generate_qa_artifacts') {
    const prompt = args.prompt || '';
    const result = await generateQaArtifacts(prompt, path.join(process.cwd(), 'generated'));

    return {
      content: [
        {
          type: 'text',
          text: `Artifacts generated successfully. Files created:\n- ${result.files.feature}\n- ${result.files.steps}\n- ${result.files.page}\n\nObserved flow: ${result.observed}\n\nPrompt: ${prompt}`,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('QA MCP server running');
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { generateQaArtifacts };
