import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY!;

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // @ts-ignore
    const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" }, { apiVersion: 'v1' });
    const result = await model.generateContent("test");
    console.log("Success with gemini-3.8-flash on v1!");
  } catch (error: any) {
    console.error("Error listing/testing models:", error.message);
  }
}

listModels();
