
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Always initialize with the exact environment variable as per guidelines
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Converts a File object to a base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove data:application/pdf;base64, etc.
      resolve(base64String.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Extracts text from an image or PDF using Gemini's OCR capabilities.
 */
export const extractTextWithGemini = async (file: File): Promise<string> => {
  const ai = getAI();
  const base64Data = await fileToBase64(file);
  const mimeType = file.type;

  const prompt = `Extract all text from this document. 
  IMPORTANT: Do NOT use any Markdown formatting symbols. 
  - Do NOT use asterisks (*) or underscores (_) for bold or italic.
  - Do NOT use hashes (#) for headers. 
  - Just output the plain text exactly as it appears. 
  - Maintain the structure with line breaks and tabs only.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: prompt }
        ]
      },
      config: {
        temperature: 0.1,
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error("Failed to extract text from document. Please ensure the file is valid.");
  }
};

/**
 * Normalizes and formats raw text into a professional document structure without Markdown.
 */
export const normalizeText = async (rawText: string): Promise<string> => {
  const ai = getAI();
  
  const prompt = `
    The following text was extracted from a document. 
    1. Fix all typos and OCR errors.
    2. Normalize line breaks and spacing.
    3. Ensure formal tone and correct punctuation.
    4. Structure the content logically.
    
    STRICT FORMATTING RULES:
    - NEVER use asterisks (*) or hashes (#).
    - Use ALL CAPS for headers instead of Markdown.
    - Do not use any special symbols for emphasis.
    - Return ONLY the clean, plain text.
    
    TEXT TO NORMALIZE:
    ---
    ${rawText}
    ---
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.2,
      }
    });

    let result = response.text || rawText;
    
    // Safety sanitization: Strip any remaining Markdown-style symbols
    // Removes: # symbols at start of lines, and * or _ symbols used for wrapping text
    result = result
      .replace(/^#+\s*/gm, '') // Remove heading hashes
      .replace(/\*{1,3}/g, '') // Remove bold/italic stars
      .replace(/_{1,3}/g, '')  // Remove underscores
      .replace(/`{1,3}/g, ''); // Remove backticks

    return result;
  } catch (error) {
    console.error("Gemini Normalization Error:", error);
    return rawText; 
  }
};
