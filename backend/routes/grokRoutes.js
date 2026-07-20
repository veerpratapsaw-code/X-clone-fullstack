import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

/**
 * @route   POST /api/grok/chat
 * @desc    Chat with Grok AI Assistant powered by Google Gemini
 * @access  Public (or protected if desired)
 */
router.post("/chat", async (req, res) => {
  try {
    const { prompt, history = [] } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ message: "Prompt string is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "GEMINI_API_KEY is not configured on the server." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use gemini-2.5-flash (or gemini-flash-latest)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: "You are Grok, an advanced AI assistant created by xAI built directly into X (Twitter). You are smart, witty, direct, insightful, and helpful with a dash of rebellious humor when appropriate. You help users craft viral tweets, understand breaking technology, write code, analyze data, and explore ideas. Keep responses well-formatted in Markdown, concise, and engaging."
    });

    console.log(`🤖 Grok AI processing prompt: "${prompt.substring(0, 50)}..."`);

    // Format chat history if provided, or generate direct content
    let replyText = "";
    try {
      const chat = model.startChat({
        history: history.map(item => ({
          role: item.role === "user" ? "user" : "model",
          parts: [{ text: item.parts?.[0]?.text || item.text || "" }]
        })).filter(item => item.parts[0].text.trim() !== "")
      });

      const result = await chat.sendMessage(prompt);
      replyText = result.response.text();
    } catch (chatError) {
      console.warn("Chat history mode threw an error, falling back to direct generateContent:", chatError.message);
      const result = await model.generateContent([
        "You are Grok, an advanced AI assistant created by xAI built directly into X (Twitter). You are smart, witty, direct, and helpful. Respond to this prompt:",
        prompt
      ]);
      replyText = result.response.text();
    }

    return res.status(200).json({
      reply: replyText,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Grok API Error:", error);
    res.status(500).json({ 
      message: "Grok AI failed to generate response", 
      error: error.message 
    });
  }
});

export default router;
