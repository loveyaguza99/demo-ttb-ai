const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { CSVLoader } = require ("@langchain/community/document_loaders/fs/csv");
const { DirectoryLoader } = require('langchain/document_loaders/fs/directory');

require('dotenv').config();
const fs = require("fs");
const path = require("path");

(async () => {
  // STEP 1: Load documents (Extract)
  const loader = new DirectoryLoader('./docs', {
    // '.pdf': path => new PDFLoader(path),
    // '.txt': path => new TextLoader(path),
    '.csv': path => new CSVLoader(path)
  });

    const rawDocs = await loader.load()

  // STEP 2: Chunk (Transform)
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200
  });
  const docs = await splitter.splitDocuments(rawDocs);
  console.log("🚀 ~ docs:", docs)

              // ==== บันทึกไฟล์ wav ลงเครื่อง ====
            const outputDir = path.join(__dirname, "recordings");
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir);
            }
            const filename = `audio_${Date.now()}.txt`;
            const filepath = path.join(outputDir, filename);
            fs.writeFileSync(filepath, JSON.stringify(docs, null, 2));
            console.log("✅ Saved wav file to:", filepath);
            // ==== จบส่วนบันทึกไฟล์ ====F

  // // STEP 3: Embed
  // const embeddings = new AzureOpenAIEmbeddings({
  //   azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  //   azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_RESOURCE_NAME,
  //   azureOpenAIApiDeploymentName: "text-embedding-small",
  //   azureOpenAIApiVersion: "2024-02-15-preview"
  // });

  // // STEP 4: Store (Load)
  // const mongoClient = new MongoClient(process.env.MONGO_URI);
  // await mongoClient.connect();
  // const collection = mongoClient.db('langchain').collection('docs');

  // await MongoDBAtlasVectorSearch.fromDocuments(docs, embeddings, {
  //   collection,
  //   indexName: 'vector_index',
  //   textKey: 'content',
  //   embeddingKey: 'embedding'
  // });

  // console.log('✅ ETL complete using LangChain only');
  // await mongoClient.close();
})();
