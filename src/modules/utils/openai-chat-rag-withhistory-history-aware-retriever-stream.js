const { MongoDBChatMessageHistory } = require("@langchain/mongodb");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { ChatPromptTemplate, MessagesPlaceholder } = require("@langchain/core/prompts");
const { BufferWindowMemory } = require("langchain/memory");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { RunnableSequence } = require("@langchain/core/runnables");
const { v4: uuidv4 } = require('uuid');
const { createHistoryAwareRetriever } = require("langchain/chains/history_aware_retriever");
// const { pull } = require("langchain/hub");

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
    ["system", "ตอบคำถามการใช้งานใดๆ โดยอิงตามบริบทด้านล่างนี้เท่านั้น:\n\n<context>{context}</context>"],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
  ]);

  const combineDocsChain = await createStuffDocumentsChain({
    llm: llm,
    prompt: questionAnsweringPrompt,
  });

  const rephrasePrompt = ChatPromptTemplate.fromMessages([
    ["system", `จากบทสนทนาและคำถามติดตามด้านล่าง กรุณาแปลงคำถามติดตามให้เป็นคำถามใหม่ที่สมบูรณ์ และเข้าใจได้โดยไม่ต้องพึ่งบริบทก่อนหน้า`],
    new MessagesPlaceholder("chat_history"),
    ["human", "คำถามติดตาม: {input}\nคำถามที่แปลงแล้ว:"]
  ]);

  // const rephrasePrompt = await pull("langchain-ai/chat-langchain-rephrase");

  const historyAwareRetriever = await createHistoryAwareRetriever({
    llm: llm,
    retriever: documentStore.asRetriever({ k: 4 }),
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
    ["system", "คุณคือผู้ช่วยในการสรุปบทสนทนา โดยมีหน้าที่ตั้งชื่อให้กับบทสนทนาในรูปแบบหัวข้อที่สั้น กระชับ เข้าใจง่าย และสื่อความหมายของเนื้อหา ต้องเป็นข้อความสั้น กระชับ ไม่เกิน 10 คำ และอยู่ในบรรทัดเดียว"],
    ["human", "บทสนทนา:\n{chat}\n\n"],
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
