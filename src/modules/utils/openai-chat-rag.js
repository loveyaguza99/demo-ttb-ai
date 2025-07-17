import { AzureChatOpenAI } from "@langchain/openai";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
// import { VectorStoreRetrieverMemory } from "langchain/memory";
import { MongoDBChatMessageHistory } from "@langchain/mongodb";

export async function azureOpenAIChat(prompt, documentStore, chatHistoryStore) {

  const model = new AzureChatOpenAI({
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_ENDPOINT,
    deploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
    openAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
    temperature: 1,
    maxTokens: 500,
    // timeout: 2,
    maxRetries: 2,
    verbose: true,
  });

  // const filter = {userId: {"$in": ["testko1"]}}
  // const filter = { userId: { $in: ["testko2"] } };
  // const filter = { userId: { "$eq": "testko1" } };
  // const filter = { "metadata.userId": { $eq: "testko1" } };
  // const filter = { "metadata.userId": { $in: ["testko1"] } };
  // const filter = {
  //   must: [{ key: "metadata.userId", match: { value: "testko1" } }],
  // };

  // const memory = new VectorStoreRetrieverMemory({
  //   vectorStoreRetriever: chatHistoryStore.asRetriever(3), // topK = 1
  //   // vectorStoreRetriever: chatHistoryStore.asRetriever({ k: 3, filter: filter }), // topK = 1
  //   memoryKey: "history",
  //   metadata: { userId: "testko1", sessionId: "testko1", createdAt: new Date().toISOString() },
  //   returnDocs: true,
  // });
  // console.log("🚀 ~ azureOpenAIChat ~ memory:", memory)

  // const history = await memory.loadMemoryVariables({
  //   prompt: prompt,
  // });
  // console.log("🚀 ~ azureOpenAIChat ~ history:", history)
  // return history

  const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      // "คุณคือผู้ช่วยที่เชี่ยวชาญในการตอบคำถามตามข้อมูลที่ให้ด้านล่าง\n\n{context}",
      // "คุณคือผู้ช่วยที่เชี่ยวชาญในการตอบคำถามตามข้อมูลที่ให้ด้านล่าง\n\n{context}\n\nหากไม่พบคำตอบในข้อมูลด้านบน ให้ตอบว่า ไม่พบข้อมูล",
      "ตอบคำถามของผู้ใช้โดยใช้ข้อมูลจากด้านล่างที่เกี่ยวข้องกับคำถามเท่านั้น:\n\n{context}",
      // "Answer the user's questions based on the below context:\n\n{context}",
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

  console.log("🚀 ~ azureOpenAIChat ~ res:", res)
  return res.answer;
}
