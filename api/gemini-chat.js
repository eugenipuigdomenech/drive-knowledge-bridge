import { GoogleGenerativeAI } from "@google/generative-ai";

// Inicialitzem Gemini amb la teva API Key (recorda posar-la a les variables d'entorn de Vercel)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Definim les eines (Tools) que Gemini pot decidir utilitzar
const tools = [
  {
    functionDeclarations: [
      {
        name: "askKnowledge",
        description: "Cerca informació rellevant a la base de dades (Drive) per respondre l'usuari.",
        parameters: {
          type: "object",
          properties: {
            chatbot: { type: "string", description: "L'àmbit del chatbot: tfe, mobilitat o practiques" },
            query: { type: "string", description: "La pregunta de l'usuari formulada per cercar" }
          },
          required: ["chatbot", "query"]
        }
      },
      {
        name: "logUnresolvedQuestion",
        description: "Registra la pregunta quan la consulta no es pot respondre o està fora d'àmbit.",
        parameters: {
          type: "object",
          properties: {
            chatbot: { type: "string" },
            question: { type: "string", description: "La pregunta exacta de l'usuari" },
            user_language: { type: "string" },
            context_hint: { type: "string", description: "Resum molt breu (2-4 paraules)" },
            source: { type: "string", description: "Sempre ha de ser 'gemini_api'" },
            status: { type: "string", description: "Sempre ha de ser 'unresolved'" }
          },
          required: ["chatbot", "question", "user_language", "context_hint", "source", "status"]
        }
      }
    ]
  }
];

export default async function handler(req, res) {
  // Només acceptem peticions POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Mètode no permès" });
  }

  try {
    const { chatbot, message } = req.body;

    if (!chatbot || !message) {
      return res.status(400).json({ error: "Falten paràmetres (chatbot i message són obligatoris)" });
    }

    // Obtenim la URL base dinàmicament per fer les trucades als teus propis endpoints
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const baseUrl = `${protocol}://${req.headers.host}`;

    // 2. Configurem el model amb les teves instruccions base
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // Recomanat per tasques ràpides i function calling
      systemInstruction: `Ets el Chatbot ${chatbot.toUpperCase()} de l'ESEIAAT. 
      Respon en l'idioma de l'usuari (preferentment català). 
      Utilitza ÚNICAMENT la informació obtinguda de l'eina askKnowledge. 
      Si la informació no és suficient o la pregunta no està relacionada, crida SEMPRE a logUnresolvedQuestion.`,
      tools: tools,
    });

    // 3. Iniciem la sessió i enviem el missatge
    const chatSession = model.startChat();
    let result = await chatSession.sendMessage(message);

    // 4. Comprovem si Gemini ha decidit cridar alguna funció
    const call = result.response.functionCalls()?.[0];

    if (call) {
      let functionResponseData = {};

      console.log(`[Gemini] Demanant crida a la funció: ${call.name}`);

      // Executem l'endpoint corresponent segons el que demani la IA
      if (call.name === "askKnowledge") {
        const fetchRes = await fetch(`${baseUrl}/api/ask-knowledge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(call.args),
        });
        functionResponseData = await fetchRes.json();
      } 
      else if (call.name === "logUnresolvedQuestion") {
        const fetchRes = await fetch(`${baseUrl}/api/log-unresolved`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...call.args, source: "gemini_api" }), // Forcem el source
        });
        functionResponseData = await fetchRes.json();
      }

      // 5. Retornem les dades dels teus endpoints a Gemini perquè formuli la resposta final
      result = await chatSession.sendMessage([{
        functionResponse: {
          name: call.name,
          response: functionResponseData
        }
      }]);
    }

    // 6. Retornem la resposta redactada al frontend
    return res.status(200).json({
      success: true,
      reply: result.response.text()
    });

  } catch (error) {
    console.error("Error a l'Orquestrador Gemini:", error);
    return res.status(500).json({ 
      error: "S'ha produït un error al processar la petició", 
      details: error.message 
    });
  }
}