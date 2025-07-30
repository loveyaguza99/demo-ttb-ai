const express = require("express");
const { handleChat, handleChatWithHistory, handleGetHistory, handleGetChatSessionByUserId } = require("./chat.controller");

const router = express.Router();

router.post("/", handleChat);
router.post("/with-history", handleChatWithHistory);
router.post("/get-chat-session-user-id", handleGetChatSessionByUserId);
router.post("/get-history", handleGetHistory);

module.exports = router;
