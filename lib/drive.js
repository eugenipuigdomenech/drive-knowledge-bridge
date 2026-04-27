import { google } from "googleapis";

export async function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return google.drive({ version: "v3", auth });
}

export function getFolderIdByChatbot(chatbot) {
  const folders = {
    tfe: process.env.DRIVE_FOLDER_TFE,
    mobilitat: process.env.DRIVE_FOLDER_MOBILITAT,
    practiques: process.env.DRIVE_FOLDER_PRACTIQUES,
    professorat: process.env.DRIVE_FOLDER_PROFESSORAT,
  };

  return folders[chatbot] || null;
}

export async function listFilesInFolder(folderId) {
  const drive = await getDriveClient();

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id, name, mimeType, modifiedTime, parents)",
    pageSize: 100,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    corpora: "allDrives",
  });

  return res.data.files || [];
}

export async function readTextFile(fileId) {
  const drive = await getDriveClient();

  const res = await drive.files.get(
    {
      fileId,
      alt: "media",
      supportsAllDrives: true,
    },
    {
      responseType: "text",
    }
  );

  return res.data || "";
}