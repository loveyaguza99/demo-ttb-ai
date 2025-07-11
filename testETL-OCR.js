import Tesseract from "tesseract.js";
// import { Document } from "langchain/document";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";

export async function loadImageAsDocument(path, lang = "tha+eng") {
  const { data: { text } } = await Tesseract.recognize(path, lang);

  return text
}

const docs = await loadImageAsDocument("./docs/test5.jpg");
console.log(docs); // ข้อความ OCR ที่ได้