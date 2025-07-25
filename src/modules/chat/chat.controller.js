const { initializedVectorStore, initializedChatHistoryVectorStore } = require("../utils/vector-store");
const { azureOpenAIChat } = require("../utils/openai-chat-rag");
const { azureOpenAIChatWithHistory } = require("../utils/openai-chat-rag-withhistory");
const { llm, embedding } = require("../utils/llm-and-embedding-model");

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

    const userId = "test03"
    const sessionId = "test03"
    const results = await azureOpenAIChatWithHistory(prompt, llm, documentStore, chatHistoryStore, userId, sessionId);

    res.json({ result: results });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
};

const handleGetHistory = async (req, res) => {
  try {
    const { prompt } = req.body;
    const documentStore = await initializedVectorStore(embedding);
    // const chatHistoryStore = await initializedChatHistoryVectorStore();
    
    const userId = "test03"
    const sessionId = "test03"
    // const chatHistory = await memory(userId, sessionId);
    const results = await azureOpenAIChatWithHistory(prompt, llm, documentStore, chatHistoryStore, userId, sessionId);

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
