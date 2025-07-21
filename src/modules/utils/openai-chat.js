const { AzureOpenAI } = require("openai");

const apiKey = process.env.AZURE_OPENAI_API_KEY;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
const endpoint = process.env.AZURE_OPENAI_API_ENDPOINT;
const modelName = process.env.AZURE_OPENAI_MODEL;
const deployment = process.env.AZURE_OPENAI_MODEL; // ถ้า deployment ต่างจาก modelName ให้แก้ไข
const options = { endpoint, apiKey, deployment, apiVersion };

async function azureOpenAIChat(testScript, text, history = []) {
  const client = new AzureOpenAI(options);

  const response = await client.chat.completions.create({
    messages: [
      { role: "system", content: testScript.system_instruction },
      ...(history.length > 0 && history[history.length - 1].role === "assistant" ? history : []),
      { role: "user", content: text },
    ],
    max_tokens: 150,
    temperature: 0.4,
    top_p: 1,
    model: modelName,
  });

  if (response?.error !== undefined && response.status !== "200") {
    throw response.error;
  }

  for (const choice of response.choices) {
    return choice.message;
  }
}

module.exports = {
  azureOpenAIChat,
};
