const multer = require('multer');

const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const { CSVLoader } = require("@langchain/community/document_loaders/fs/csv");
const { JSONLoader } = require("langchain/document_loaders/fs/json");
const { DocxLoader } = require("@langchain/community/document_loaders/fs/docx");
const { TextLoader } = require("langchain/document_loaders/fs/text");
const { PPTXLoader } = require("@langchain/community/document_loaders/fs/pptx");
const { RecursiveCharacterTextSplitter, CharacterTextSplitter } = require("langchain/text_splitter");
const Tesseract = require('tesseract.js');

// const { OpenAIWhisperAudio } = require("@langchain/community/document_loaders/fs/openai_whisper_audio");

function uploadSingleFile(fieldName) {
  return function runMulter(req, res) {
    return new Promise((resolve, reject) => {
      const upload = multer({ dest: 'uploads/' });
      upload.single(fieldName)(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  };
}

function ImageLoader(filePath) {
  return {
    load: async () => {
      const {
        data: { text: ocrText }
      } = await Tesseract.recognize(filePath, 'tha+eng');
      return [{ pageContent: ocrText, metadata: { source: filePath } }];
    }
  };
}

async function parseAndChunkFile(filePath, originalName, uploadedBy) {
  const lowerName = originalName.toLowerCase();
  let loader;

  if (lowerName.endsWith(".pdf")) loader = new PDFLoader(filePath);
  else if (lowerName.endsWith(".csv")) loader = new CSVLoader(filePath);
  else if (lowerName.endsWith(".json")) loader = new JSONLoader(filePath);
  else if (lowerName.endsWith(".docx")) loader = new DocxLoader(filePath);
  else if (lowerName.endsWith(".txt")) loader = new TextLoader(filePath);
  else if (lowerName.endsWith(".pptx")) loader = new PPTXLoader(filePath);
  else if (
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg") ||
    lowerName.endsWith(".png") ||
    lowerName.endsWith(".webp")
  ) {
    loader = new ImageLoader(filePath);
  }
  // else if (lowerName.endsWith(".wav")) {
  //   loader = new OpenAIWhisperAudio(filePath, {
  //     transcriptionCreateParams: {
  //       language: "en",
  //     },
  //   });
  // }
  else throw new Error("Unsupported file type");

  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ["\n\n", "\n", " ", ""],
  });

  // const splitter = new CharacterTextSplitter({
  //   chunkSize: 400,
  //   chunkOverlap: 200,
  //   separators: "\n\n",
  // });

  let chunkedDocs = await splitter.splitDocuments(docs);

  // const uploadedBy = 'Ko';
  const createdAt = new Date().toISOString();
  if (uploadedBy) {
    chunkedDocs = chunkedDocs.map(doc => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        uploadedBy,
        createdAt,
      }
    }));
  }

  return chunkedDocs;
}

module.exports = {
  uploadSingleFile,
  parseAndChunkFile
};
