import { getFolderIdByChatbot, listFilesInFolder } from "../lib/drive.js";

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

    return res.status(200).json({
      success: true,
      chatbot,
      folderId,
      count: files.length,
      files,
      note: "Aquest endpoint només llegeix el primer nivell de la carpeta",
    });
  } catch (error) {
    console.error("sync-drive error:", error);
    return res.status(500).json({
      error: "Error syncing drive",
      details: error.message,
    });
  }
}