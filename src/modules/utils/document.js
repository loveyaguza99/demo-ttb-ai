import multer from 'multer';

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { RecursiveCharacterTextSplitter  } from "langchain/text_splitter";
// import { OpenAIWhisperAudio } from "@langchain/community/document_loaders/fs/openai_whisper_audio";

export function uploadSingleFile(fieldName) {
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

export async function parseAndChunkFile(filePath, originalName) {
  const lowerName = originalName.toLowerCase();
  let loader

  if (lowerName.endsWith(".pdf")) loader = new PDFLoader(filePath);
  else if (lowerName.endsWith(".csv")) loader = new CSVLoader(filePath);
  else if (lowerName.endsWith(".json")) loader = new JSONLoader(filePath);
  else if (lowerName.endsWith(".docx")) loader = new DocxLoader(filePath);
  else if (lowerName.endsWith(".txt")) loader = new TextLoader(filePath);
  else if (lowerName.endsWith(".pptx")) loader = new PPTXLoader(filePath);
  // else if (lowerName.endsWith(".wav")) loader = new OpenAIWhisperAudio(filePath, {
  //   transcriptionCreateParams: {
  //     language: "en",
  //   },
  // });
  else throw new Error("Unsupported file type");

  const docs = await loader.load();

  // ทำ Chunk
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ["\n\n", "\n", " ", ""],
  });
  let chunkedDocs = await splitter.splitDocuments(docs);

  const uploadedBy = 'Ko';
  const createdAt = new Date().toISOString();
  if (uploadedBy) {
    chunkedDocs = chunkedDocs.map(doc => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        uploadedBy, // เพิ่ม field นี้
        createdAt,
      }
    }));
  }

  return chunkedDocs
}