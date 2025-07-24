const { MongoClient, ObjectId } = require("mongodb");
const { BufferMemory } = require("langchain/memory");
const { ConversationChain } = require("langchain/chains");
const { MongoDBChatMessageHistory } = require("@langchain/mongodb");
const { AzureChatOpenAI } = require("@langchain/openai");

const client = new MongoClient(process.env.MONGODB_ATLAS_CONNECTION_STRING, {
  driverInfo: { name: "langchainjs" },
});

async function azureOpenAIChatWithHistory(prompt, documentStore, chatHistoryStore, userId, sessionId) {
  await client.connect();
  const collection = client.db("test").collection("chat_history");

  // generate a new sessionId string
  // const sessionId = new ObjectId().toString();

  const memory = new BufferMemory({
    chatHistory: new MongoDBChatMessageHistory({
      collection,
      sessionId,
    }),
  });

  const model = new AzureChatOpenAI({
    model: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
    temperature: 1,
    maxTokens: 2000,
    maxRetries: 2,
    verbose: true,
  });

  const chain = new ConversationChain({ llm: model, memory });

  const res = await chain.invoke({ input: prompt });
  
  console.log("🚀 ~ azureOpenAIChatWithHistory ~ res:", res)
  // See the chat history in the MongoDb
  console.log(await memory.chatHistory.getMessages());

  // clear chat history
  // await memory.chatHistory.clear();
  return res
}

module.exports = {
  azureOpenAIChatWithHistory,
};