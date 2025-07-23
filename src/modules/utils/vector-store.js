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
  const db = client.db("test");

  const collectionName = "documents"
  const collection = db.collection(collectionName);
  const count = await collection.countDocuments({});

  const indexName = "vectorSearchIndex";
  const indexes = await collection.indexes();
  console.log("🚀 ~ initializedVectorStore ~ indexes:", indexes)
  // const vectorIndex = indexes.find(idx => idx.name === indexName);
  // const currentNumLists = vectorIndex.cosmosSearchOptions?.numLists;
  // const newNumLists = recommendedNumLists(count)

  // if (newNumLists !== currentNumLists) {
  //   await collection.dropIndex(indexName);
  //   console.log("updated index");
  // }

  const store = new AzureCosmosDBMongoDBVectorStore(
    embeddings,
    {
      client,
      databaseName: "test",
      collectionName: collectionName,
      indexOptions: {
        // numLists: newNumLists,
        numLists: 20,
        dimensions: 1536,
        similarity: AzureCosmosDBMongoDBSimilarityType.COS,
      },
    }
  );
  await store.initialize();
  // await collection.createIndex({ uploadedBy: 1 });

  return store;
}

async function initializedChatHistoryVectorStore() {
  await client.connect();
  const db = client.db("test");
  const collectionName = "chat_history_embedded"
  const collection = db.collection(collectionName);
  const count = await collection.countDocuments({});

  const store = new AzureCosmosDBMongoDBVectorStore(
    embeddings,
    {
      client,
      databaseName: "test",
      collectionName: collectionName,
      indexOptions: {
        // numLists: recommendedNumLists(count),
        numLists: 20,
        dimensions: 1536,
        similarity: AzureCosmosDBMongoDBSimilarityType.COS,
      },
    }
  );
  // await store.initialize();
  // await collection.createIndex({ userId: 1 });
  // await collection.createIndex({ sessionId: 1 });

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
      // indexOptions: {
      //   numLists: 100,
      //   dimensions: 1536,
      //   similarity: AzureCosmosDBMongoDBSimilarityType.COS,
      // },
    }
  );
  return store;
}

function recommendedNumLists(nVectors) {
  return Math.max(10, Math.round(Math.sqrt(nVectors)));
}

module.exports = {
  initializedVectorStore,
  initializedChatHistoryVectorStore,
  saveToVectorStore,
};
