const { AzureChatOpenAI } = require("@langchain/openai");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
// const { VectorStoreRetrieverMemory } = require("langchain/memory");

async function azureOpenAIChat(prompt, documentStore) {
  const model = new AzureChatOpenAI({
    model: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
    temperature: 0,
    maxTokens: 500,
    // timeout: 2,
    maxRetries: 2,
    verbose: true,
  });

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
    // chat_history: history.history,
    input: prompt,
  });

  // await memory.saveContext(
  //   { input: prompt },
  //   { output: res.answer },
  // );

  return res.answer;
}

module.exports = {
  azureOpenAIChat,
};
