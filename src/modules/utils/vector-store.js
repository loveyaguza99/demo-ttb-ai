const {
  AzureCosmosDBMongoDBVectorStore,
  AzureCosmosDBMongoDBSimilarityType,
} = require("@langchain/azure-cosmosdb");
const { ChatOpenAI, AzureOpenAIEmbeddings } = require("@langchain/openai");
const { MongoClient } = require("mongodb");
const { MultiVectorRetriever } = require("langchain/retrievers/multi_vector");

const mongoOptions = {
  maxPoolSize: 20,
  minPoolSize: 2,
  waitQueueTimeoutMS: 10000,
};

const client = new MongoClient(process.env.AZURE_COSMOSDB_MONGODB_CONNECTION_STRING, mongoOptions);

const embeddings = new AzureOpenAIEmbeddings({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_ENDPOINT,
  openAIApiVersion: process.env.AZURE_OPENAI_EMBEDDINGS_API_VERSION,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_EMBEDDINGS_MODEL,
});

async function initializedVectorStore() {
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

async function initializedChatHistoryVectorStore() {
  await client.connect();

  const store = new AzureCosmosDBMongoDBVectorStore(
    embeddings,
    {
      client,
      databaseName: "test",
      collectionName: "chat_history_embedded",
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

async function saveToVectorStore(documents) {
  const store = await AzureCosmosDBMongoDBVectorStore.fromDocuments(
    documents,
    embeddings,
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

module.exports = {
  initializedVectorStore,
  initializedChatHistoryVectorStore,
  saveToVectorStore,
};
