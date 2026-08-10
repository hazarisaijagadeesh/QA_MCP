const path = require('path');
const { generateQaArtifacts } = require('./mcp-server');

function runAgentConversation(prompt) {
  const normalized = prompt.trim();
  const conversation = [];

  conversation.push(`User: ${normalized}`);
  conversation.push('Agent: I will create the automation scaffolding for this request.');
  conversation.push('Agent: I will define a feature file, step definitions, and a page object model.');

  const result = generateQaArtifacts(normalized, path.join(process.cwd(), 'generated'));

  conversation.push('Agent: The feature file has been drafted.');
  conversation.push('Agent: The step definitions have been prepared.');
  conversation.push('Agent: The page object has been created.');
  conversation.push(`Agent: Files created at ${path.dirname(result.files.feature)}`);

  return {
    conversation,
    files: [result.files.feature, result.files.steps, result.files.page],
  };
}

module.exports = { runAgentConversation };
