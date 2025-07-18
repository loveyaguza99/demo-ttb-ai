import dotenv from 'dotenv';
dotenv.config();
import {
  AzureCosmosDBMongoDBVectorStore,
  AzureCosmosDBMongoDBSimilarityType,
} from "@langchain/azure-cosmosdb";
import { ChatOpenAI, AzureOpenAIEmbeddings } from "@langchain/openai";
import { MongoClient } from 'mongodb';
import { MultiVectorRetriever } from "langchain/retrievers/multi_vector";

const mongoOptions = {
  maxPoolSize: 20,      // จำนวน connection สูงสุดใน pool
  minPoolSize: 2,       // จำนวน connection ต่ำสุดใน pool
  waitQueueTimeoutMS: 10000, // เวลารอคิว (ms)
};

const client = new MongoClient(process.env.AZURE_COSMOSDB_MONGODB_CONNECTION_STRING, mongoOptions);

const embeddings = new AzureOpenAIEmbeddings({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_ENDPOINT,
  openAIApiVersion: process.env.AZURE_OPENAI_EMBEDDINGS_API_VERSION,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_EMBEDDINGS_MODEL,
});

export async function initializedVectorStore() {
  await client.connect();

  const store = new AzureCosmosDBMongoDBVectorStore(
    embeddings,
    {
      client,
      databaseName: "test",
      collectionName: "documents",
      indexOptions: {
        numLists: 100,
        dimensions: 1536,
        similarity: AzureCosmosDBMongoDBSimilarityType.COS,
      },
    }
  );
  await store.initialize();
  return store;
}

// export async function initializedChatHistoryVectorStore() {
//   await client.connect();

//   const store = new AzureCosmosDBMongoDBVectorStore(
//     embeddings,
//     {
//       client,
//       databaseName: "test",
//       collectionName: "chat_history",
//       indexOptions: {
//         numLists: 100,
//         dimensions: 1536,
//         similarity: AzureCosmosDBMongoDBSimilarityType.COS,
//       },
//     }
//   );
//   await store.initialize();
//   return store;
// }

// Create Azure Cosmos DB for MongoDB vCore vector store
export async function saveToVectorStore(documents) {
  // console.log("🚀 ~ saveToVectorStore ~ documents:", documents)
  const store = await AzureCosmosDBMongoDBVectorStore.fromDocuments(
    documents,
    embeddings,
    // new OpenAIEmbeddings(),
    {
      connectionString: process.env.AZURE_COSMOSDB_MONGODB_CONNECTION_STRING,
      databaseName: "test",
      collectionName: "documents",
      indexOptions: {
        numLists: 100,
        dimensions: 1536,
        similarity: AzureCosmosDBMongoDBSimilarityType.COS,
      },
    }
  );
  return store;
}

// Performs a similarity search
// const resultDocuments = await store.similaritySearch(
//   "What did the president say about Ketanji Brown Jackson?"
// );

// console.log("Similarity search results:");
// console.log(resultDocuments[0].pageContent);