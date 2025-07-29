const { MongoClient } = require("mongodb");
const { MongoDBChatMessageHistory } = require("@langchain/mongodb");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { ChatPromptTemplate, MessagesPlaceholder } = require("@langchain/core/prompts");
const { BufferWindowMemory } = require("langchain/memory");

const client = new MongoClient(process.env.MONGODB_ATLAS_CONNECTION_STRING, {
  driverInfo: { name: "langchainjs" },
});

async function azureOpenAIChatWithHistory(prompt, llm, documentStore, chatHistoryStore, userId, sessionId) {
  await client.connect();
  const collection = client.db("test").collection("chat_history");

  const memory = new BufferWindowMemory({
    k: 5,
    chatHistory: new MongoDBChatMessageHistory({
      collection,
      sessionId: `${userId}-${sessionId}`,
      // userId: userId
    }),
    memoryKey: "chat_history",
    returnMessages: true,
  });

  const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
    ["system", "ตอบคำถามของผู้ใช้โดยใช้ข้อมูลจากด้านล่างที่เกี่ยวข้องกับคำถามเท่านั้น:\n\n{context}"],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
  ]);

  const combineDocsChain = await createStuffDocumentsChain({
    llm: llm,
    prompt: questionAnsweringPrompt,
  });

  const retrievalChain = await createRetrievalChain({
    retriever: documentStore.asRetriever({ k: 5 }),
    combineDocsChain,
  });

  const history = await memory.loadMemoryVariables({ input: prompt });
  // console.log("🚀 ~ azureOpenAIChatWithHistory ~ history:", history.chat_history)

  const res = await retrievalChain.invoke({
    input: prompt,
    chat_history: history.chat_history
  });

  await memory.saveContext(
    { input: prompt },
    { output: res.answer },
  );

  return res.answer;
}

module.exports = {
  azureOpenAIChatWithHistory,
};
