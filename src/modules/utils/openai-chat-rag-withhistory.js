const { AzureChatOpenAI } = require("@langchain/openai");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { VectorStoreRetrieverMemory } = require("langchain/memory");

async function azureOpenAIChatWithHistory(prompt, documentStore, chatHistoryStore) {
  const model = new AzureChatOpenAI({
    model: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
    temperature: 0,
    maxTokens: 500,
    // timeout: 2,
    maxRetries: 2,
    verbose: true,
  });
  console.log("🚀 ~ azureOpenAIChatWithHistory ~ model:", model);

  // ตัวอย่าง filter สำหรับ memory retriever
  const filter = { userId: { $in: ["testko1"] } };

  const memory = new VectorStoreRetrieverMemory({
    vectorStoreRetriever: chatHistoryStore.asRetriever({ k: 3, filter: { userId: "testko1" } }),
    memoryKey: "history",
    metadata: { userId: "testko3", sessionId: "testko3", createdAt: new Date().toISOString() },
    returnDocs: true,
  });
  console.log("🚀 ~ azureOpenAIChatWithHistory ~ memory:", memory);

  const history = await memory.loadMemoryVariables({ prompt });
  console.log("🚀 ~ azureOpenAIChatWithHistory ~ history:", history);
  return history;

  const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "ตอบคำถามของผู้ใช้โดยใช้ข้อมูลจากด้านล่างที่เกี่ยวข้องกับคำถามเท่านั้น:\n\n{context}",
    ],
    ["human", "{input}"],
  ]);

  const combineDocsChain = await createStuffDocumentsChain({
    llm: model,
    prompt: questionAnsweringPrompt,
  });

  const chain = await createRetrievalChain({
    retriever: documentStore.asRetriever(),
    combineDocsChain,
  });

  const res = await chain.invoke({
    chat_history: history.history,
    input: prompt,
  });

  await memory.saveContext(
    { input: prompt },
    { output: res.answer },
  );

  console.log("🚀 ~ azureOpenAIChatWithHistory ~ res:", res);
  return res.answer;
}

module.exports = {
  azureOpenAIChatWithHistory,
};
