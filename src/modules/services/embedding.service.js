import dotenv from 'dotenv';
dotenv.config();
import { AzureOpenAI } from "openai";

const modelName = process.env.AZURE_OPENAI_EMBEDDINGS_MODEL;
const endpoint = process.env.AZURE_OPENAI_API_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deployment = process.env.AZURE_OPENAI_EMBEDDINGS_MODEL;
const apiVersion = process.env.AZURE_OPENAI_EMBEDDINGS_API_VERSION;
const options = { endpoint, apiKey, deployment, apiVersion };

const client = new AzureOpenAI(options);

export async function getEmbedding(input) {
  try {
    const result = await client.embeddings.create({
      input: [input],
      model: modelName,
    });
    const embedding = result.data[0].embedding;
    return embedding;
  } catch (error) {
    console.error("Error getting embedding:", error);
    return null;
  }
}