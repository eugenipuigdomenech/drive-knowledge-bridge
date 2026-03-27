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

    return res.status(200).json({
      success: true,
      chatbot,
      query,
      results: [
        {
          title: `Mock result for ${chatbot}`,
          snippet: `Resultat de prova per la consulta: ${query}`,
          source: "mock",
        },
      ],
    });
  } catch (error) {
    console.error("search-knowledge error:", error);
    return res.status(500).json({
      error: "Error searching knowledge",
      details: error.message,
    });
  }
}