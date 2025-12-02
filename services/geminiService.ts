import { GoogleGenAI, Type } from "@google/genai";
import { Song } from "../types";

// Helper to generate a unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Mock vibrant colors for AI generated playlists
const MOCK_COLORS = [
  '#FF0055', // Pink
  '#0033FF', // Blue
  '#00FF99', // Green
  '#FFAA00', // Orange
  '#9900FF', // Purple
  '#00CCFF', // Cyan
  '#FF3300'  // Red
];

const getRandomColor = () => MOCK_COLORS[Math.floor(Math.random() * MOCK_COLORS.length)];

export const generateSmartPlaylist = async (prompt: string): Promise<Song[]> => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY not found in environment variables.");
    // Return mock fallback if no key
    return [];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a playlist of 5 fictional or real songs based on this mood/request: "${prompt}". 
      Return the data strictly as a JSON array of objects. 
      For cover images, use "https://picsum.photos/id/[random_number_1-100]/400/400".
      Make the songs sound plausible.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              album: { type: Type.STRING },
              duration: { type: Type.STRING, description: "Format MM:SS" },
              cover: { type: Type.STRING }
            },
            required: ["title", "artist", "album", "duration", "cover"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const rawSongs = JSON.parse(text);
    
    // Map to our internal Song structure
    return rawSongs.map((s: any) => ({
      id: generateId(),
      title: s.title,
      artist: s.artist,
      album: s.album,
      cover: s.cover,
      duration: s.duration,
      accentColor: getRandomColor()
    }));

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};