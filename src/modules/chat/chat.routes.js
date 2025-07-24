const express = require("express");
const { handleChat, handleChatWithHistory, handleGetHistory } = require("./chat.controller");

const router = express.Router();

router.post("/", handleChat);
router.post("/with-history", handleChatWithHistory);
router.get("/history", handleGetHistory);

module.exports = router;
