import express from "express";
import { handleUpload, handleUploadOcr, handleSimilaritySearch } from './document.controller.js';

const router = express.Router();

router.post("/upload", handleUpload);

router.post("/upload-ocr", handleUploadOcr);

router.post("/similarity-search", handleSimilaritySearch);

export default router;
