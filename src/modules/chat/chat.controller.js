import { initializedVectorStore, initializedChatHistoryVectorStore } from "../utils/vector-store.js";
import { azureOpenAIChat } from "../utils/openai-chat-rag.js";
import { azureOpenAIChatWithHistory } from "../utils/openai-chat-rag-withhistory.js";

export const handleChat = async (req, res) => {
  try {
    const { prompt } = req.body;
    const documentStore = await initializedVectorStore()
    // const chatHistoryStore = await initializedChatHistoryVectorStore()
    const results = await azureOpenAIChat(prompt, documentStore);

    res.json({ result: results });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
};

export const handleChatWithHistory = async (req, res) => {
  try {
    const { prompt } = req.body;
    const documentStore = await initializedVectorStore()
    const chatHistoryStore = await initializedChatHistoryVectorStore()
    const results = await azureOpenAIChatWithHistory(prompt, documentStore, chatHistoryStore);

    res.json({ result: results });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
};