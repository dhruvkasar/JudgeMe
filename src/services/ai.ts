import { GoogleGenAI, Type, Schema } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    vibe_title: { type: Type.STRING, description: "A catchy, brutal title for their vibe (e.g., 'Basic Bro', 'Pretentious Indie Nerd')" },
    roast: { type: Type.STRING, description: "The brutal, savage roast based on the inputs." },
    vibe_score: { type: Type.INTEGER, description: "A score out of 10 for their vibe." },
    redemption: { type: Type.STRING, description: "A tiny sliver of redemption at the end." }
  },
  required: ["vibe_title", "roast", "vibe_score", "redemption"]
};

export async function generateRoast(
  songs: string[],
  movies: string[],
  foods: string[],
  intensity: string
) {
  const prompt = `Analyze this person's vibe based on their top 3 songs, movies, and foods, and ROAST THEM.
  
Intensity level: ${intensity.toUpperCase()} (Mild = playful teasing, Spicy = savage cut deep, Nuclear = absolutely destroy their ego and will to live).

Songs: ${songs.join(', ')}
Movies: ${movies.join(', ')}
Foods: ${foods.join(', ')}

Be creative, hilarious, and brutally honest. Do not hold back on Nuclear.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.9,
    }
  });

  if (response.text) {
    return JSON.parse(response.text);
  }
  throw new Error("Failed to generate roast.");
}
