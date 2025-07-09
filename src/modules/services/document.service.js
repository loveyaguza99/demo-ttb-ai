import fs from "fs";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { CharacterTextSplitter  } from "langchain/text_splitter";


export async function parseAndChunkFile(filePath, originalName) {
  let loader

  if (originalName.endsWith(".pdf")) loader = new PDFLoader(filePath);
  else if (originalName.endsWith(".csv")) loader = new CSVLoader(filePath);
  else if (originalName.endsWith(".json")) loader = new JSONLoader(filePath);
  else if (originalName.endsWith(".docx")) loader = new DocxLoader(filePath);
  else if (originalName.endsWith(".txt")) loader = new TextLoader(filePath);
  else if (originalName.endsWith(".pptx")) loader = new PPTXLoader(filePath);
  else throw new Error("Unsupported file type");

  const docs = await loader.load();

  // 🔹 ทำ Chunk
  const splitter = new CharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    // separators: [
    //   "\n\n",
    //   "\n",
    //   " ",
    //   ""
    // ]
  });
  const chunkedDocs = await splitter.splitDocuments(docs);
  return chunkedDocs
}