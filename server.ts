import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase limit to handle high-resolution drawings or images
app.use(express.json({ limit: "10mb" }));

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// 1. CHAT API: Converse with interior designer, contextually aware of room/placed items
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, roomDescription, placedItems } = req.body;

    const systemInstruction = `You are "Camera Room Designer AI", an elite, friendly, and professional virtual interior designer. 
Your goal is to help users design their living, working, or recreational spaces by suggesting furniture arrangement, colors, lighting, and decor.
The user is viewing their room via a live camera feed or a snapped photo, and they can tap on areas to place virtual items.
Here is the current state of the room design:
- Placed Items: ${JSON.stringify(placedItems || [])}
- Overall context: ${roomDescription || "A typical residential room"}

Provide suggestions that are practical, stylish, and aligned with design philosophies (e.g., Scandinavian, Industrial, Minimalist, Mid-Century Modern, Japandi). Keep descriptions vivid yet concise. Ensure you are supportive and encourage their creative vision. Do not use complex jargon. Keep your replies structured, clear, and focused on design value.`;

    // Format chat history
    const contents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// 2. SUGGEST ITEM API: Generates an item spec based on where they clicked and room category
app.post("/api/suggest-item", async (req, res) => {
  try {
    const { tapX, tapY, areaName, roomStyle, spaceType } = req.body;

    const prompt = `Suggest a piece of furniture, lighting, plant, or decorative item suitable for a ${roomStyle || "Minimalist Modern"} ${spaceType || "living room"}.
The user tapped in the room layout at coordinates (X: ${tapX}%, Y: ${tapY}%), which represents the: "${areaName || "general floor or wall space"}".

Based on this position and design rules, generate a realistic item suggestion in JSON format with the following fields:
- name: (string) A catchy but clean product name (e.g., "Sleek Arc Floor Lamp")
- category: (string) e.g., lighting, furniture, plant, decor
- description: (string) A short 2-sentence description of why it fits this spot and matches the style.
- color: (string) A complementary color (e.g., "Matte Black")
- material: (string) (e.g., "Powder-coated steel and brass")
- dimensions: (string) Estimated sizing (e.g., "78\" H x 15\" W")
- price: (number) A reasonable mock price in USD (e.g., 189)
- iconType: (string) A valid lucide-react icon name representing this item. Choose from: "lamp", "sofa", "flower", "footprints", "tv", "image", "table", "container", "armchair", "shrub", "fan", "sun", "hourglass".

Respond ONLY with valid JSON. Do not wrap in markdown block formatting.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Error in /api/suggest-item:", error);
    res.status(500).json({ error: error.message || "Failed to suggest item" });
  }
});

// 3. ANALYZE SKETCH API: Take base64 drawing from sketchpad and recommend matching item
app.post("/api/analyze-sketch", async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 data" });
    }

    // Clean data URI prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        mimeType: "image/png",
        data: cleanBase64,
      },
    };

    const textPart = {
      text: `Identify what furniture, decor, or household item is drawn in this sketch.
Suggest a real-world design equivalent that matches this sketch and output a JSON object with:
- name: A clean, commercial product name based on the sketch (e.g., "Scandi Oak Dining Chair")
- category: e.g., chair, table, lighting, decor, storage, plant
- description: A short 2-sentence description of the identified item and why it's a great match.
- color: A recommended color for this item.
- material: Recommended materials (e.g., "Solid oak wood, linen upholstery").
- price: A reasonable mock price in USD (integer).
- dimensions: Sizing.
- iconType: Choose a fitting lucide icon name like "sofa", "lamp", "flower", "table", "armchair", "container", "image".

Respond ONLY with valid JSON. Do not wrap in markdown block formatting.`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Error in /api/analyze-sketch:", error);
    res.status(500).json({ error: error.message || "Failed to analyze sketch" });
  }
});

// Vite & Static file serving setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

startServer();
