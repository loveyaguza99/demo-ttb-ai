const { initializedVectorStore, initializedChatHistoryVectorStore } = require("../utils/vector-store");
const { azureOpenAIChat } = require("../utils/openai-chat-rag");
const { azureOpenAIChatWithHistory } = require("../utils/openai-chat-rag-withhistory");
const { llm, embedding } = require("../utils/llm-and-embedding-model");
const { MongoDBChatMessageHistory } = require("@langchain/mongodb");
const { MongoClient } = require("mongodb");

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
    const { prompt } = req.body;
    const documentStore = await initializedVectorStore(embedding);
    const chatHistoryStore = await initializedChatHistoryVectorStore(embedding);

    const userId = "test01"
    const sessionId = false
    const results = await azureOpenAIChatWithHistory(prompt, llm, documentStore, chatHistoryStore, userId, sessionId);

    res.json({ result: results });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
};

const handleGetChatSessionId = async (req, res) => {
  try {

    const client = new MongoClient(process.env.MONGODB_ATLAS_CONNECTION_STRING);

    await client.connect();
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

    const client = new MongoClient(process.env.MONGODB_ATLAS_CONNECTION_STRING, {
      driverInfo: { name: "langchainjs" },
    });

    await client.connect();
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
  handleGetChatSessionId,
  handleGetHistory
};
