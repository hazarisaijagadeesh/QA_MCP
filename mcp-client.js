const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function runMcpArtifactGeneration(prompt) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['mcp-server.js'],
  });

  const client = new Client({ name: 'qa-client', version: '1.0.0' });
  await client.connect(transport);

  const tools = await client.listTools();
  const tool = tools.tools.find((item) => item.name === 'generate_qa_artifacts');

  if (!tool) {
    throw new Error('generate_qa_artifacts tool not found');
  }

  const response = await client.callTool({
    name: 'generate_qa_artifacts',
    arguments: { prompt },
  });

  const text = response.content?.[0]?.text || 'No response';
  await client.close();
  return text;
}

module.exports = { runMcpArtifactGeneration };
