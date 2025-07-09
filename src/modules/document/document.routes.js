import express from "express";
import multer from "multer";
import { handleUpload } from './document.controller.js';

const router = express.Router();

// router.post("/upload", async (req, res) => {
//   res.json({ status: "queued" });
// });

const upload = multer({ dest: "uploads/" }); // จัดเก็บไฟล์ไว้ใน /uploads ชั่วคราว

router.post("/upload", upload.single("file"), handleUpload);

export default router;
