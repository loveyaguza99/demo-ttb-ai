const { AzureChatOpenAI, AzureOpenAIEmbeddings } = require("@langchain/openai");

const llm = new AzureChatOpenAI({
  model: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
  temperature: 0.7,
  maxTokens: 500,
  // maxCompletionTokens: 500,
  maxRetries: 2,
  verbose: true,
  // streaming: true,
});

const embedding = new AzureOpenAIEmbeddings({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_ENDPOINT,
  openAIApiVersion: process.env.AZURE_OPENAI_EMBEDDINGS_API_VERSION,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_EMBEDDINGS_MODEL,
});

module.exports = {
  llm,
  embedding,
};