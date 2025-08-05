const fs = require("fs/promises");
const path = require("path");

const { uploadSingleFile, uploadMultipleFiles, parseAndChunkFile } = require("../utils/document.js");
const { convertPdfToImages, extractPdf } = require("../utils/document-pdf.js");
const { initializedVectorStore, saveToVectorStore } = require("../utils/vector-store.js");
const { llm, embedding } = require("../utils/llm-and-embedding-model");

const uploadedBy = 'Ko';

const handleUpload = async (req, res) => {
  try {
    await uploadMultipleFiles('files')(req, res);

    // for (const file of req.files) {
    //   const filePath = file.path;
    //   const originalName = file.originalname;

    //   const chunkedDocs = await parseAndChunkFile(filePath, originalName, uploadedBy);
    //   await fs.unlink(filePath); // ลบไฟล์หลังใช้

    //   await saveToVectorStore(chunkedDocs, embedding);
    // }
    await Promise.all(
      req.files.map(async (file) => {
        const filePath = file.path;
        const originalName = file.originalname;

        const chunkedDocs = await parseAndChunkFile(filePath, originalName, uploadedBy);
        await fs.unlink(filePath);

        await saveToVectorStore(chunkedDocs, embedding);
      })
    );

    res.json({ result: "Success" });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
};


// const handleUpload = async (req, res) => {
//   try {
//     await uploadSingleFile('file')(req, res);
//     const filePath = req.file.path;
//     const originalName = req.file.originalname;

//     const chunkedDocs = await parseAndChunkFile(filePath, originalName, uploadedBy);
//     await fs.unlink(filePath);

//     await saveToVectorStore(chunkedDocs, embedding);

//     res.json({ chunks: chunkedDocs });
//   } catch (err) {
//     console.error("❌ Upload error:", err);
//     res.status(500).json({ error: "Upload failed" });
//   }
// };

const handleUploadOcr = async (req, res) => {
  try {
    await uploadSingleFile('file')(req, res);
    const filePath = req.file.path;
    const originalName = req.file.originalname;

    const outputDir = './docs/output';
    await convertPdfToImages(filePath, outputDir);

    const prefix = path.basename(filePath, path.extname(filePath));
    await extractPdf(filePath, prefix, outputDir);

    const chunkedDocs = await parseAndChunkFile('docs/output/output_full.txt', 'output_full.txt', uploadedBy);
    await fs.unlink(filePath);

    await saveToVectorStore(chunkedDocs, embedding);

    res.json({ chunks: chunkedDocs });
  } catch (err) {
    console.error("❌ Upload OCR error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
};

const handleSimilaritySearch = async (req, res) => {
  try {
    const { query } = req.body;
    const store = await initializedVectorStore(embedding);

    const filter = { preFilter: { uploadedBy: "Ko" } }

    const resultDocuments = await store.similaritySearch(query, 10, filter);

    const results = resultDocuments.map(doc => ({
      pageContent: doc.pageContent,
      metadata: doc.metadata,
    }));

    res.json({ result: results });
  } catch (err) {
    console.error("❌ Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
};

module.exports = {
  handleUpload,
  handleUploadOcr,
  handleSimilaritySearch
};
