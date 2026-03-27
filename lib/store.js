import fs from "fs";
import path from "path";

const DATA_DIR = "/tmp";
const STORE_PATH = path.join(DATA_DIR, "knowledge-store.json");

function ensureStoreFile() {
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify({}, null, 2), "utf8");
  }
}

function readStoreFile() {
  ensureStoreFile();
  const raw = fs.readFileSync(STORE_PATH, "utf8");
  return JSON.parse(raw || "{}");
}

function writeStoreFile(data) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
}

export function normalizeText(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

export function chunkText(text, maxLength = 800) {
  const clean = normalizeText(text);
  if (!clean) return [];

  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    const end = Math.min(start + maxLength, clean.length);
    chunks.push(clean.slice(start, end));
    start = end;
  }

  return chunks;
}

export function saveChatbotDocuments(chatbot, documents) {
  const store = readStoreFile();

  store[chatbot] = {
    updatedAt: new Date().toISOString(),
    documents,
  };

  writeStoreFile(store);

  return store[chatbot];
}

export function getChatbotDocuments(chatbot) {
  const store = readStoreFile();
  return store[chatbot] || { updatedAt: null, documents: [] };
}

export function searchInChatbotDocuments(chatbot, query) {
  const { documents } = getChatbotDocuments(chatbot);
  const q = normalizeText(query).toLowerCase();

  if (!q) return [];

  const results = [];

  for (const doc of documents) {
    for (const chunk of doc.chunks || []) {
      const haystack = chunk.toLowerCase();
      let score = 0;
      const queryWords = q.split(" ").filter(Boolean);

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