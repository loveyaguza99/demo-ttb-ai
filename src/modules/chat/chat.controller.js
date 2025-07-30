const { initializedVectorStore, initializedChatHistoryVectorStore, initializedMongodb } = require("../utils/vector-store");
const { azureOpenAIChat } = require("../utils/openai-chat-rag");
// const { azureOpenAIChatWithHistory } = require("../utils/openai-chat-rag-withhistory");
const { azureOpenAIChatWithHistory } = require("../utils/openai-chat-rag-withhistory-history-aware-retriever");
const { llm, embedding } = require("../utils/llm-and-embedding-model");
const { MongoDBChatMessageHistory } = require("@langchain/mongodb");

const handleChat = async (req, res) => {
  try {
    const { prompt } = req.body;
    const documentStore = await initializedVectorStore(embedding);
    const results = await azureOpenAIChat(prompt, llm, documentStore);

    res.json({ result: results });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
};

const handleChatWithHistory = async (req, res) => {
  try {
    const { prompt, userId, sessionId } = req.body;
    const documentStore = await initializedVectorStore(embedding);
    const chatHistoryStore = await initializedChatHistoryVectorStore(embedding);
    const client = await initializedMongodb();

    const results = await azureOpenAIChatWithHistory(prompt, llm, documentStore, chatHistoryStore, client, userId, sessionId);

    res.json({ result: results });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
};

const handleGetChatSessionByUserId = async (req, res) => {
  try {
    const client = await initializedMongodb();

    const collection = client.db("test").collection("chat_sessions");

    const { userId } = req.body;

    const sessions = await collection
      .find({ userId: userId })
      .sort({ lastUpdated: -1 })
      .toArray();

    res.json({ result: sessions });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
};

const handleGetHistory = async (req, res) => {
  try {

    const client = await initializedMongodb();

    const collection = client.db("test").collection("chat_history");

    const { sessionId } = req.body;

    const memory = new MongoDBChatMessageHistory({
      collection,
      sessionId: sessionId,
    });

    const history = await memory.getMessages();
    // console.log("🚀 ~ handleGetHistory ~ history:", history)

    res.json({ result: history });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
};

module.exports = {
  handleChat,
  handleChatWithHistory,
  handleGetChatSessionByUserId,
  handleGetHistory
};
