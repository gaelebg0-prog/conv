
import { GoogleGenAI } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Maximum characters to send for text translation to prevent token limit errors
const MAX_TRANSLATION_CHARS = 30000; 

export const analyzeFile = async (fileName: string, fileType: string, fileData?: string): Promise<string> => {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';

  let prompt = `Analyze this file: "${fileName}" (Type: ${fileType}). 
  1. Briefly explain what kind of file it is.
  2. Suggest the best 3 target formats for conversion and why.
  3. If it contains text or is an image with text, mention that it can be translated.
  Keep the total response under 50 words.`;

  try {
    const contents: any[] = [{ text: prompt }];

    if (fileData && fileType.startsWith('image/')) {
      contents.push({
        inlineData: {
          mimeType: fileType.includes('svg') ? 'image/png' : fileType, // Simplified for SVG analysis
          data: fileData.split(',')[1]
        }
      });
    }

    const response = await ai.models.generateContent({
      model,
      contents: { parts: contents },
      config: { temperature: 0.4 }
    });

    return response.text || "No analysis available.";
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    if (error?.message?.includes('token count')) {
      return "File is too complex for AI analysis.";
    }
    return "AI was unable to analyze this file.";
  }
};

export const translateFile = async (file: File, targetLanguage: string, fileData?: string): Promise<string> => {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  
  const isImage = file.type.startsWith('image/');
  let prompt = `Translate the ${isImage ? 'text found in this image' : 'content of this file'} into ${targetLanguage}. 
  Provide only the translated text. Maintain the original tone and structure as much as possible. 
  If it's a technical file (JSON/XML), translate only the values, not the keys.`;

  try {
    const contents: any[] = [{ text: prompt }];

    if (isImage && fileData) {
      contents.push({
        inlineData: {
          mimeType: file.type.includes('svg') ? 'image/png' : file.type,
          data: fileData.split(',')[1]
        }
      });
    } else {
      let text = await file.text();
      
      // Truncate text if it's way too long for a single translation call
      if (text.length > MAX_TRANSLATION_CHARS) {
        text = text.substring(0, MAX_TRANSLATION_CHARS) + "\n\n[... content truncated due to size limits ...]";
      }
      
      contents.push({ text: `Content to translate: \n\n ${text}` });
    }

    const response = await ai.models.generateContent({
      model,
      contents: { parts: contents },
      config: { temperature: 0.3 }
    });

    return response.text || "Translation failed.";
  } catch (error: any) {
    console.error("Gemini Translation Error:", error);
    if (error?.message?.includes('token count')) {
      return "Error: The file is too large or contains too much text for the AI to translate in one go. Please try with a smaller file.";
    }
    return "Error: Failed to process translation. Please try again with a simpler file.";
  }
};
