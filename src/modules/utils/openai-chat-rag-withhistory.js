const { MongoClient } = require("mongodb");
const { ConversationChain } = require("langchain/chains");
const { MongoDBChatMessageHistory } = require("@langchain/mongodb");
const { AzureChatOpenAI } = require("@langchain/openai");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { ChatPromptTemplate, MessagesPlaceholder } = require("@langchain/core/prompts");
const { BufferWindowMemory } = require("langchain/memory");

const client = new MongoClient(process.env.MONGODB_ATLAS_CONNECTION_STRING, {
  driverInfo: { name: "langchainjs" },
});

async function azureOpenAIChatWithHistory(prompt, documentStore, chatHistoryStore, userId, sessionId) {
  await client.connect();
  const collection = client.db("test").collection("chat_history");

  const memory = new BufferWindowMemory({
    k: 5,
    chatHistory: new MongoDBChatMessageHistory({
      collection,
      // sessionId,
      sessionId: `${userId}-${sessionId}`,
    }),
    memoryKey: "chat_history",
    returnMessages: true,
  });

  const model = new AzureChatOpenAI({
    model: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
    temperature: 0.7,
    maxTokens: 2000,
    maxRetries: 2,
    verbose: true,
  });

  const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
    ["system", "ตอบคำถามของผู้ใช้โดยใช้ข้อมูลจากด้านล่างที่เกี่ยวข้องกับคำถามเท่านั้น:\n\n{context}"],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
  ]);

  const combineDocsChain = await createStuffDocumentsChain({
    llm: model,
    prompt: questionAnsweringPrompt,
  });

  const retrievalChain = await createRetrievalChain({
    retriever: documentStore.asRetriever({ k: 3 }),
    combineDocsChain,
  });

  // const chain = new ConversationChain({
  //   memory,
  //   llm: model,
  //   prompt: questionAnsweringPrompt,
  // });
  const history = await memory.loadMemoryVariables({ input: prompt });
  // const history = await memory.chatHistory.getMessages();
  console.log("🚀 ~ azureOpenAIChatWithHistory ~ history:", history.chat_history)

  const res = await retrievalChain.invoke({
    input: prompt,
    chat_history: history.chat_history
  });

  await memory.saveContext(
    { input: prompt },
    { output: res.answer },
  );

  console.log("📌 Answer:", res);
  return res.answer;
}

module.exports = {
  azureOpenAIChatWithHistory,
};
