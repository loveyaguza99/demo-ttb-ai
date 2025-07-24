const { AzureChatOpenAI } = require("@langchain/openai");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { VectorStoreRetrieverMemory } = require("langchain/memory");

async function azureOpenAIChatWithHistory(prompt, documentStore, chatHistoryStore, userId, sessionId) {
  const model = new AzureChatOpenAI({
    model: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
    temperature: 1,
    maxTokens: 2000,
    maxRetries: 2,
    verbose: true,
  });

  const memory = new VectorStoreRetrieverMemory({
    vectorStoreRetriever: chatHistoryStore.asRetriever({
      k: 3,
      filter: {
        userId: userId,
        sessionId: sessionId
      }
    }),
    memoryKey: "history",
    metadata: { userId: userId, sessionId: sessionId, createdAt: new Date().toISOString() },
  });
  console.log("🚀 ~ azureOpenAIChatWithHistory ~ memory:", memory);

  const history = await memory.loadMemoryVariables({ input: prompt });
  // console.log("🚀 ~ azureOpenAIChatWithHistory ~ history:", history);
  // return history;

  const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "ประวัติการสนทนา:\n\n{chat_history}\n\n\n\n" +
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
  console.log("🚀 ~ azureOpenAIChatWithHistory ~ res:", res)

  await memory.saveContext(
    { input: prompt },
    { output: res.answer },
  );

  return res.answer;
}

module.exports = {
  azureOpenAIChatWithHistory,
};
