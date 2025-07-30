const { MongoClient } = require("mongodb");
const { MongoDBChatMessageHistory } = require("@langchain/mongodb");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { ChatPromptTemplate, MessagesPlaceholder } = require("@langchain/core/prompts");
const {
  VectorStoreRetrieverMemory,
} = require("langchain/memory");
const { HumanMessage, AIMessage } = require("@langchain/core/messages");

const client = new MongoClient(process.env.MONGODB_ATLAS_CONNECTION_STRING, {
  driverInfo: { name: "langchainjs" },
});

async function azureOpenAIChatWithHistory(prompt, llm, documentStore, chatHistoryStore, client, userId, sessionId) {
  try {
    await client.connect();
    const collection = client.db("test").collection("chat_history");

    const vectorMemory = new VectorStoreRetrieverMemory({
      vectorStoreRetriever: chatHistoryStore.asRetriever(5),
      memoryKey: "chat_history",
      inputKey: "input",
      returnDocs: true,
      metadata: {
        userId,
        sessionId,
        createdAt: new Date().toISOString(),
      },
    });

    const sequentialChatHistory = new MongoDBChatMessageHistory({
      collection,
      sessionId: `${userId}-${sessionId}`,
    });

    const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
      ["system", "ตอบคำถามของผู้ใช้โดยใช้ข้อมูลจากด้านล่างที่เกี่ยวข้องกับคำถามเท่านั้น:\n\n{context}"],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
    ]);

    const combineDocsChain = await createStuffDocumentsChain({
      llm,
      prompt: questionAnsweringPrompt,
    });

    const retrievalChain = await createRetrievalChain({
      retriever: documentStore.asRetriever({ k: 3 }),
      combineDocsChain,
    });

    const history = await vectorMemory.loadMemoryVariables({ input: prompt });
    // console.log("🚀 ~ azureOpenAIChatWithHistory ~ history:", history)
    const chat_history = history.chat_history.flatMap(doc => convertToMessages(doc.pageContent));
    // console.log("🚀 ~ azureOpenAIChatWithHistory ~ chat_history:", chat_history)

    const res = await retrievalChain.invoke({
      input: prompt,
      chat_history: chat_history,
    });
    // console.log("🚀 ~ azureOpenAIChatWithHistory ~ res:", res)

    await vectorMemory.saveContext({ input: prompt }, { output: res.answer });
    await sequentialChatHistory.addUserMessage(prompt);
    await sequentialChatHistory.addAIMessage(res.answer);

    return res.answer;
  } catch (error) {
    console.error("Error in azureOpenAIChatWithHistory:", error);
    throw error;
  }
}

function convertToMessages(pageContent) {
  const [inputLine, ...outputLines] = pageContent.trim().split("\n");
  const input = inputLine.replace(/^input:\s*/i, "").trim();
  const output = outputLines.join("\n").replace(/^output:\s*/i, "").trim();

  return [
    new HumanMessage(input),
    new AIMessage(output),
  ];
}

module.exports = {
  azureOpenAIChatWithHistory,
};
