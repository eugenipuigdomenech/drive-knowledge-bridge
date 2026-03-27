import {
  getFolderIdByChatbot,
  listFilesInFolder,
  readTextFile,
} from "../lib/drive.js";
import { chunkText, saveChatbotDocuments } from "../lib/store.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { chatbot } = req.body;

    if (!chatbot) {
      return res.status(400).json({ error: "Missing chatbot" });
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

    const saved = saveChatbotDocuments(chatbot, documents);

    return res.status(200).json({
      success: true,
      chatbot,
      folderId,
      totalFilesInFolder: files.length,
      txtFilesRead: txtFiles.length,
      documentsStored: documents.length,
      updatedAt: saved.updatedAt,
      files: documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        mimeType: doc.mimeType,
        modifiedTime: doc.modifiedTime,
        chunks: doc.chunks.length,
      })),
    });
  } catch (error) {
    console.error("sync-drive error:", error);
    return res.status(500).json({
      error: "Error syncing drive",
      details: error.message,
    });
  }
}