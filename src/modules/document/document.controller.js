// src/controllers/document.controller.ts
import fs from "fs";
import path from "path";
import { parseAndChunkFile } from "../services/document.service.js";

export const handleUpload = async (req, res) => {
  try {
    const filePath = req.file.path;
    const originalName = req.file.originalname;

    console.log("📄 Uploaded file:", originalName);

    // Step 1: แปลงเอกสารและ chunk
    const chunkedDocs = await parseAndChunkFile(filePath, originalName);

    // Step 2: (Optional) ส่ง chunk ไป queue สำหรับ embedding → Azure AI Search
    // await embedQueue.add("embed-doc", { chunkedDocs });

    res.json({ status: "ok", chunks: chunkedDocs });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
};
