const { initializedVectorStore, initializedChatHistoryVectorStore, memory } = require("../utils/vector-store");
const { azureOpenAIChat } = require("../utils/openai-chat-rag");
const { azureOpenAIChatWithHistory } = require("../utils/openai-chat-rag-withhistory");

const handleChat = async (req, res) => {
  try {
    const { prompt } = req.body;
    const documentStore = await initializedVectorStore();
    const results = await azureOpenAIChat(prompt, documentStore);

    res.json({ result: results });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
};

const handleChatWithHistory = async (req, res) => {
  try {
    const { prompt } = req.body;
    const documentStore = await initializedVectorStore();
    const chatHistoryStore = await initializedChatHistoryVectorStore();

    const userId = "test03"
    const sessionId = "test03"
    const results = await azureOpenAIChatWithHistory(prompt, documentStore, chatHistoryStore, userId, sessionId);

    res.json({ result: results });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
};

const handleGetHistory = async (req, res) => {
  try {
    const { prompt } = req.body;
    const documentStore = await initializedVectorStore();
    // const chatHistoryStore = await initializedChatHistoryVectorStore();
    
    const userId = "test03"
    const sessionId = "test03"
    const chatHistory = await memory(userId, sessionId);
    const results = await azureOpenAIChatWithHistory(prompt, documentStore, chatHistoryStore, userId, sessionId);

    res.json({ result: results });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
};

module.exports = {
  handleChat,
  handleChatWithHistory,
  handleGetHistory
};
