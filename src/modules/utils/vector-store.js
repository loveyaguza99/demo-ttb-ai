const { MongoClient } = require("mongodb");
const { MongoDBAtlasVectorSearch } = require("@langchain/mongodb");

const mongoOptions = {
  maxPoolSize: 20,
  minPoolSize: 2,
  waitQueueTimeoutMS: 10000,
};

const client = new MongoClient(process.env.MONGODB_ATLAS_CONNECTION_STRING, mongoOptions);

async function initializedVectorStore(embeddings) {
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

async function initializedChatHistoryVectorStore(embeddings) {
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

async function saveToVectorStore(documents, embeddings) {
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

async function initializedMongodb() {
  await client.connect();
  return client;
}

module.exports = {
  initializedVectorStore,
  initializedChatHistoryVectorStore,
  saveToVectorStore,
  initializedMongodb
};
