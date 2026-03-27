import { searchInChatbotDocuments, getChatbotDocuments } from "../lib/store.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { chatbot, query } = req.body;

    if (!chatbot) {
      return res.status(400).json({ error: "Missing chatbot" });
    }

    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }

    const chatbotData = getChatbotDocuments(chatbot);

    if (!chatbotData.documents || chatbotData.documents.length === 0) {
      return res.status(200).json({
        success: true,
        chatbot,
        query,
        results: [],
        message: "No indexed documents found for this chatbot. Run sync-drive first.",
      });
    }

    const results = searchInChatbotDocuments(chatbot, query);

    return res.status(200).json({
      success: true,
      chatbot,
      query,
      indexedDocuments: chatbotData.documents.length,
      updatedAt: chatbotData.updatedAt,
      results,
    });
  } catch (error) {
    console.error("search-knowledge error:", error);
    return res.status(500).json({
      error: "Error searching knowledge",
      details: error.message,
    });
  }
}