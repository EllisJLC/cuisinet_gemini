
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroceryResponse, GroceryItem, StoreComparison } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function fetchGroceryData(
  city: string,
  country: string,
  groceryList: string
): Promise<GroceryResponse> {
  const model = "gemini-3-flash-preview";
  const isGeneralSearch = !groceryList.trim();
  
  const prompt = isGeneralSearch 
    ? `Analyze the major grocery retailers in ${city}, ${country}. 
       1. Identify the top 6 most affordable staple foods right now with exact estimated prices.
       2. Compare the major grocery stores themselves, their budget levels, and provide 2-3 specific price examples of common items at each store to justify their rating.`
    : `Compare prices for these specific items in ${city}, ${country}:
       ${groceryList}
       
       1. For EACH item in the list, retrieve the current price at EVERY major grocery retailer in ${city}.
       2. If a specific retailer does not carry the item, explicitly state "Not carried".
       3. Compare the major grocery stores in ${city} generally and provide 2-3 specific price examples for common staples (bread, milk, eggs) at those stores for context.`;

  const systemInstruction = `
    You are a professional local grocery price analyst with access to live Google Search data. 
    Retrieve current prices and store reputations at major retailers in the specified area.
    
    CRITICAL: Format your response as a list of sections separated by "---".
    Start with a brief "Intro" paragraph.

    Then, for each major store analyzed (e.g. Walmart, Tesco, etc.), use this structure:
    ### STORE: [Store Name]
    BUDGET: [Low/Mid/High]
    BEST_FOR: [e.g., Organic Produce, Bulk Items]
    EXAMPLES: [Item 1]: [Price 1], [Item 2]: [Price 2]
    NOTE: [One sentence about their current deals]
    ---

    Then for each grocery item (the ones the user requested or top staples), use this structure:
    ### ITEM: [Item Name]
    STORE: [Best Store Name]
    PRICE: [Best Price]
    COMPARISON: [Store A]: [Price or "Not carried"], [Store B]: [Price or "Not carried"], [Store C]: [Price or "Not carried"]
    TIP: [One short tip about this item's availability or quality]
    ---

    Ensure the COMPARISON line lists as many major local stores as possible for a complete picture.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const fullText = response.text || "";
    const sections = fullText.split('---').filter(s => s.trim());
    const introPart = fullText.split('### STORE:')[0]?.split('### ITEM:')[0]?.trim();
    const intro = introPart || "Live market analysis for your location:";
    
    const items: GroceryItem[] = [];
    const stores: StoreComparison[] = [];

    sections.forEach(block => {
      const trimmed = block.trim();
      
      if (trimmed.includes('### STORE:')) {
        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
        const name = lines[0].replace('### STORE:', '').trim();
        const budgetRating = (lines.find(l => l.startsWith('BUDGET:'))?.replace('BUDGET:', '').trim() || 'Mid') as any;
        const bestFor = lines.find(l => l.startsWith('BEST_FOR:'))?.replace('BEST_FOR:', '').trim() || 'General Groceries';
        const examplesStr = lines.find(l => l.startsWith('EXAMPLES:'))?.replace('EXAMPLES:', '').trim() || "";
        const note = lines.find(l => l.startsWith('NOTE:'))?.replace('NOTE:', '').trim() || "";
        
        const examplePrices = examplesStr.split(',').map(ex => {
          const p = ex.split(':');
          return { item: p[0]?.trim() || "Item", price: p[1]?.trim() || "N/A" };
        }).filter(e => e.price !== "N/A");

        stores.push({ name, budgetRating, bestFor, note, examplePrices });
      }
      
      if (trimmed.includes('### ITEM:')) {
        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
        const nameLine = lines.find(l => l.includes('### ITEM:')) || "";
        const name = nameLine.replace('### ITEM:', '').trim();
        const bestStore = lines.find(l => l.startsWith('STORE:'))?.replace('STORE:', '').trim() || "Local Grocer";
        const bestPrice = lines.find(l => l.startsWith('PRICE:'))?.replace('PRICE:', '').trim() || "Check store";
        const comparisonStr = lines.find(l => l.startsWith('COMPARISON:'))?.replace('COMPARISON:', '').trim() || "";
        const description = lines.find(l => l.startsWith('TIP:'))?.replace('TIP:', '').trim() || "";

        const comparison = comparisonStr.split(',').map(c => {
          const parts = c.split(':');
          return { store: parts[0]?.trim() || "Other", price: parts[1]?.trim() || "N/A" };
        }).filter(c => c.store && c.price !== "N/A");

        if (name) items.push({ name, bestPrice, bestStore, comparison, description });
      }
    });

    const sources: { title: string; uri: string }[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          sources.push({ title: chunk.web.title || "Source", uri: chunk.web.uri });
        }
      });
    }

    return { intro, items, stores, sources: Array.from(new Set(sources.map(s => s.uri))).map(uri => sources.find(s => s.uri === uri)!) };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Unable to fetch live prices. Please check your connection.");
  }
}
