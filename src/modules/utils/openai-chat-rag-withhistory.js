const { MongoClient } = require("mongodb");
const { MongoDBChatMessageHistory } = require("@langchain/mongodb");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { ChatPromptTemplate, MessagesPlaceholder } = require("@langchain/core/prompts");
const { BufferWindowMemory } = require("langchain/memory");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { RunnableSequence } = require("@langchain/core/runnables");
const { v4: uuidv4 } = require('uuid');

async function azureOpenAIChatWithHistory(prompt, llm, documentStore, chatHistoryStore, client, userId, sessionId) {
  const collection = client.db("test").collection("chat_history");

  if (!sessionId) {
    sessionId = uuidv4();
    await client.db("test").collection("chat_sessions").insertOne({
      _id: sessionId,
      userId: userId,
      createdAt: new Date(),
      lastUpdated: new Date(),
      topic: await generatedTopic(llm, prompt),
    });
  } else {
    await client.db("test").collection("chat_sessions").updateOne(
      { _id: sessionId },
      { $set: { lastUpdated: new Date() } }
    );
  }

  const memory = new BufferWindowMemory({
    k: 5,
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

  const retrievalChain = await createRetrievalChain({
    retriever: documentStore.asRetriever({ k: 5 }),
    combineDocsChain,
  });

  const history = await memory.loadMemoryVariables();

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
