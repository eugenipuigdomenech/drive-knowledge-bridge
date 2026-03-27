export function getFolderIdByChatbot(chatbot) {
  const folders = {
    tfe: process.env.DRIVE_FOLDER_TFE,
    mobilitat: process.env.DRIVE_FOLDER_MOBILITAT,
    practiques: process.env.DRIVE_FOLDER_PRACTIQUES,
  };

  return folders[chatbot] || null;
}

export async function listFilesInFolder(folderId) {
  const drive = await getDriveClient();

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id, name, mimeType, modifiedTime)",
    pageSize: 100,
  });

  return res.data.files || [];
}