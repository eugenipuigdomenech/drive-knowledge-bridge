import {
  getFolderIdByChatbot,
  listFilesInFolder,
  readTextFile,
} from "../lib/drive.js";
import { chunkText, normalizeText } from "../lib/store.js";

function searchInDocuments(documents, query) {
  const q = normalizeText(query).toLowerCase();
  if (!q) return [];

  const queryWords = q.split(" ").filter(Boolean);
  const results = [];

  for (const doc of documents) {
    for (const chunk of doc.chunks || []) {
      const haystack = chunk.toLowerCase();
      let score = 0;

      for (const word of queryWords) {
        if (haystack.includes(word)) {
          score += 1;
        }
      }

      if (score > 0) {
        results.push({
          title: doc.name,
          snippet: chunk,
          source: doc.name,
          score,
        });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 5);
}

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

    const folderId = getFolderIdByChatbot(chatbot);

    if (!folderId) {
      return res.status(400).json({ error: "Unknown chatbot" });
    }

    const files = await listFilesInFolder(folderId);
    const txtFiles = files.filter((file) => file.mimeType === "text/plain");

    const documents = [];

    for (const file of txtFiles) {
      const text = await readTextFile(file.id);

      documents.push({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
        text,
        chunks: chunkText(text, 800),
      });
    }

    const results = searchInDocuments(documents, query);

    return res.status(200).json({
      success: true,
      chatbot,
      query,
      folderId,
      indexedDocuments: documents.length,
      totalFilesInFolder: files.length,
      txtFilesRead: txtFiles.length,
      results,
    });
  } catch (error) {
    console.error("ask-knowledge error:", error);
    return res.status(500).json({
      error: "Error asking knowledge",
      details: error.message,
    });
  }
}