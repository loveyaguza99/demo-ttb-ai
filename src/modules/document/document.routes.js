import express from "express";
import { handleUpload, handleUploadOcr } from './document.controller.js';

const router = express.Router();

router.post("/upload", handleUpload);

router.post("/upload-ocr", handleUploadOcr);

export default router;
