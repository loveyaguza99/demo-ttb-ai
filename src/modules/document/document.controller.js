// src/controllers/document.controller.ts
import fs from "fs/promises";
import path from "path";
import { uploadSingleFile, parseAndChunkFile } from "../utils/document.js";
import { convertPdfToImages, extractPdf } from "../utils/document-pdf.js";

export const handleUpload = async (req, res) => {
  try {
    await uploadSingleFile('file')(req, res);
    const filePath = req.file.path;
    const originalName = req.file.originalname;

    const chunkedDocs = await parseAndChunkFile(filePath, originalName);
    await fs.unlink(filePath);

    res.json({ status: "ok", chunks: chunkedDocs });
  } catch (err) {
    await fs.unlink(req.file.path);
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
};

export const handleUploadOcr = async (req, res) => {
  try {
    await uploadSingleFile('file')(req, res);
    const filePath = req.file.path;
    console.log("🚀 ~ handleUploadOcr ~ filePath:", filePath)
    const originalName = req.file.originalname;


    const outputDir = './docs/output';
    fs.mkdirSync(outputDir, { recursive: true });
    
    await convertPdfToImages(filePath, outputDir);
    const prefix = path.basename(filePath, path.extname(filePath));
    console.log("🚀 ~ handleUploadOcr ~ prefix:", prefix)
    await extractPdf(filePath, prefix, outputDir);
    const chunkedDocs = await parseAndChunkFile('docs/output/output_full.txt', 'output_full.txt');

    await fs.unlink(filePath);

    res.json({ status: "ok", chunks: chunkedDocs });
  } catch (err) {
    await fs.unlink(req.file.path);
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
};