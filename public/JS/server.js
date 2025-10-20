// server.js
import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const API_KEY = "AIzaSyDXKvkuh_LYrKgA7l5LE6BGm-PWpdBEmSY";

app.post("/api/customize-car", async (req, res) => {
  const { carModel, style, budget } = req.body;

  const prompt = `
    Suggest a premium customization for a ${carModel}.
    Style: ${style}, Budget: ${budget}.
    Include color, trim, rims, and optional accessories.
  `;

  try {
    const response = await fetch("https://api.generativeai.googleapis.com/v1beta2/models/gemini-1.5:generateText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        maxOutputTokens: 300,
      }),
    });

    const data = await response.json();
    res.json({ suggestions: data.output_text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get customization" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
