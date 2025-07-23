const { initializedVectorStore, initializedChatHistoryVectorStore } = require("../utils/vector-store");
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

    const userId = "test01"
    const sessionId = "test01"
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
};
