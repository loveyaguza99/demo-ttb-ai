import { initializedVectorStore } from "../utils/vector-store.js";
import { azureOpenAIChat } from "../utils/openai-chat-rag.js";

export const handleChat = async (req, res) => {
  try {
    const { prompt } = req.body;
    const store = await initializedVectorStore()
    const results = await azureOpenAIChat(prompt, store);

    res.json({ result: results });
  } catch (err) {
    console.error("❌ Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
};