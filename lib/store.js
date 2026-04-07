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