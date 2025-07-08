import fs from "fs";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// 🔹 โหลดไฟล์
// const loader = new CSVLoader("./docs/scores.csv");  // เปลี่ยนเป็น loader อื่นได้
const loader = new PDFLoader("./docs/test.pdf");  // เปลี่ยนเป็น loader อื่นได้
// const loader = new DocxLoader("./docs/test.docx");  // เปลี่ยนเป็น loader อื่นได้
const docs = await loader.load();  // docs = [{ pageContent: "...", metadata: {...} }]

// 🔹 ทำ Chunk
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: [
    "\n\n",
    "\n",
    " ",
    ""
  ]
});
const chunkedDocs = await splitter.splitDocuments(docs);
console.log("🚀 ~ chunkedDocs:", chunkedDocs)

// 🔹 พร้อมใช้ chunkedDocs ใน RAG / embedding ต่อได้เลย
console.log("✅ Chunked:", chunkedDocs.length);
