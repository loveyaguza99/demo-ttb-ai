const { MongoDBChatMessageHistory } = require("@langchain/mongodb");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { ChatPromptTemplate, MessagesPlaceholder } = require("@langchain/core/prompts");
const { BufferWindowMemory } = require("langchain/memory");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { RunnableSequence } = require("@langchain/core/runnables");
const { v4: uuidv4 } = require('uuid');
const { createHistoryAwareRetriever } = require("langchain/chains/history_aware_retriever");
const { pull } = require("langchain/hub");

async function azureOpenAIChatWithHistory(prompt, llm, documentStore, chatHistoryStore, client, userId, sessionId, streamChunkResponse) {
  const dbName = process.env.MONGODB_ATLAS_DATABASE_NAME
  const collection = client.db(dbName).collection("chat_history");

  if (!sessionId) {
    sessionId = uuidv4();
    await client.db(dbName).collection("chat_sessions").insertOne({
      userId: userId,
      sessionId: sessionId,
      createdAt: new Date(),
      lastUpdated: new Date(),
      topic: await generatedTopic(llm, prompt),
    });
  } else {
    await client.db(dbName).collection("chat_sessions").updateOne(
      { sessionId: sessionId },
      { $set: { lastUpdated: new Date() } }
    );
  }

  const memory = new BufferWindowMemory({
    k: 3,
    chatHistory: new MongoDBChatMessageHistory({
      collection,
      sessionId: sessionId
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

  const rephrasePrompt = await pull("langchain-ai/chat-langchain-rephrase");

  const historyAwareRetriever = await createHistoryAwareRetriever({
    llm: llm,
    retriever: documentStore.asRetriever({ k: 3 }),
    rephrasePrompt: rephrasePrompt,
  });

  const retrievalChain = await createRetrievalChain({
    retriever: historyAwareRetriever,
    combineDocsChain: combineDocsChain,
  });


  const history = await memory.loadMemoryVariables();

  const res = await retrievalChain.stream({
    input: prompt,
    chat_history: history.chat_history
  });

  let fullAnswer = '';

  for await (const chunk of res) {
    const resChunk = chunk?.answer || '';
    fullAnswer += resChunk;

    if (streamChunkResponse) {
      streamChunkResponse(resChunk);
    }
  }

  await memory.saveContext(
    { input: prompt },
    { output: fullAnswer },
  );

}

async function generatedTopic(llm, transcriptText) {
  const topicPrompt = ChatPromptTemplate.fromMessages([
    ["system", "คุณคือนักสรุปหัวข้อที่จะตั้งชื่อให้บทสนทนาในรูปแบบกระชับและมีความหมาย"],
    ["human", "บทสนทนา:\n{chat}\n\nกรุณาตั้งชื่อ topic ที่สั้น บรรทัดเดียว ไม่ต้องใส่หัวข้อ"],
  ]);

  const topicChain = RunnableSequence.from([
    topicPrompt,
    llm,
    new StringOutputParser(),
  ]);

  const generatedTopic = await topicChain.invoke({
    chat: transcriptText,
  });

  return generatedTopic;
}

module.exports = {
  azureOpenAIChatWithHistory,
};
