import { AzureChatOpenAI } from "@langchain/openai";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export async function azureOpenAIChat(prompt, store) {

const model = new AzureChatOpenAI({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_ENDPOINT,
  deploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
  openAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
  temperature: 0,
  maxTokens: 500,
  // timeout: 2,
  maxRetries: 2,
  // other params...
});

const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "Answer the user's questions based on the below context:\n\n{context}",
  ],
  ["human", `${prompt}`],
]);

const combineDocsChain = await createStuffDocumentsChain({
  llm: model,
  prompt: questionAnsweringPrompt,
});

const chain = await createRetrievalChain({
  retriever: store.asRetriever(),
  combineDocsChain,
});
console.log("🚀 ~ azureOpenAIChat ~ chain:", chain)

const res = await chain.invoke({
  input: `${prompt}`,
});

console.log("🚀 ~ azureOpenAIChat ~ res:", res)
return res.answer;
}
// const inputText = "AzureOpenAI is an AI company that";
// const completion = await llm.invoke(inputText);
// console.log("🚀 ~ completion:", completion)
