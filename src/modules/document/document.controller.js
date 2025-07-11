// src/controllers/document.controller.ts
import fs from "fs/promises";
import path from "path";
import { uploadSingleFile, parseAndChunkFile } from "../utils/document.js";

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
