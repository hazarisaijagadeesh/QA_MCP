# MCP QA Demo

This project demonstrates the difference between:

- general automation: execute a browser flow with Playwright + Cucumber
- MCP-assisted automation: run the same flow and then invoke an MCP tool for analysis

## 1. Setup on another machine

### Prerequisites

- Node.js 18+ installed
- npm installed
- Internet access for downloading Playwright browsers

### Install dependencies

```bash
git clone <your-repo-url>
cd mcp-qa-demo
npm install
npx playwright install
```

### VS Code MCP setup

1. Open the workspace in VS Code.
2. Make sure the folder contains [.vscode/mcp.json](.vscode/mcp.json).
3. Restart VS Code or reload the window.
4. Open Copilot Chat and use the MCP server from the workspace.

## 2. Run the general flow

```bash
npm run test:general
```

## 3. Run the MCP flow

```bash
npm run test:mcp
```

## 4. Run both flows back to back

```bash
npm run demo:both
```

## 5. Start the MCP server directly

```bash
npm run mcp:server
```

## 6. How to use it

1. Start the MCP server:

```bash
npm run mcp:server
```

2. In Claude or another MCP-compatible chat client, send a prompt such as:

```text
Open Google and search for automation demo
```

3. The MCP tool exposed by this server will launch a real browser, perform the interaction, and generate the feature/step/page artifacts.

4. The generated files will be written under the generated folder.

## 7. TypeScript prompt runner

You can also try a prompt-driven browser flow directly in TypeScript:

```bash
node -r ts-node/register/transpile-only src/demo.ts "open google and search for automation demo"
```

## 8. Quick demo summary

- Traditional automation: write scripts manually and execute them.
- MCP automation: describe the task in chat, let the tool observe the browser, and generate the automation assets.
