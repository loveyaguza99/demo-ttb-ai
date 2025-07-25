const { AzureOpenAIEmbeddings } = require("@langchain/openai");
const { MongoClient } = require("mongodb");
const { MongoDBAtlasVectorSearch } = require("@langchain/mongodb");

const mongoOptions = {
  maxPoolSize: 20,
  minPoolSize: 2,
  waitQueueTimeoutMS: 10000,
};

const client = new MongoClient(process.env.MONGODB_ATLAS_CONNECTION_STRING, mongoOptions);

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

  const store = new MongoDBAtlasVectorSearch(
    embeddings,
    {
      collection,
      indexName: "vectorSearchIndex",
      textKey: "textContent",
      embeddingKey: "vectorContent",
    }
  );
  return store;
}

async function initializedChatHistoryVectorStore() {
  await client.connect();
  const db = client.db("test");
  const collectionName = "chat_history_embedded"
  const collection = db.collection(collectionName);
  // const count = await collection.countDocuments({});

  const store = new MongoDBAtlasVectorSearch(
    embeddings,
    {
      collection,
      indexName: "vectorSearchIndex",
      textKey: "textContent",
      embeddingKey: "vectorContent",
    }
  );
  return store;
}

async function saveToVectorStore(documents) {
  await client.connect();
  const db = client.db("test");
  const collectionName = "documents"
  const collection = db.collection(collectionName);
  const store = await MongoDBAtlasVectorSearch.fromDocuments(
    documents,
    embeddings,
    {
      collection,
      indexName: "vectorSearchIndex",
      textKey: "textContent",
      embeddingKey: "vectorContent",
    }
  );
  return store;
}

module.exports = {
  initializedVectorStore,
  initializedChatHistoryVectorStore,
  saveToVectorStore,
};
