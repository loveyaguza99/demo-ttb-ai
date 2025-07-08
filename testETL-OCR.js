import Tesseract from "tesseract.js";
import { Document } from "langchain/document";

export async function loadImageAsDocument(path, lang = "tha+eng") {
  const { data: { text } } = await Tesseract.recognize(path, lang);

  return [
    new Document({
      pageContent: text,
      metadata: { source: path }
    })
  ];
}

const docs = await loadImageAsDocument("./docs/test2.jpg");
console.log(docs[0].pageContent); // ข้อความ OCR ที่ได้