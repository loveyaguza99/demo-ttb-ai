import express from "express";
import { handleUpload } from './document.controller.js';

const router = express.Router();

router.post("/upload", handleUpload);

export default router;
