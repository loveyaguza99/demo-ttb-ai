import express from "express";
import { handleChat, handleChatWithHistory } from './chat.controller.js';

const router = express.Router();

router.post("/", handleChat);

router.post("/with-history", handleChatWithHistory);

export default router;
