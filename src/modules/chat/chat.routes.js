const express = require("express");
const Validator = require('./chat.validator');
const controller = require("./chat.controller");

const router = express.Router();

router.post("/", controller.handleChat);
router.post("/with-history", Validator.validateChat, controller.handleChatWithHistory);
router.post("/get-chat-session-user-id", Validator.validateGetChatSessionByUserId, controller.handleGetChatSessionByUserId);
router.post("/get-history", Validator.validateGetChatByUserId, controller.handleGetHistory);
router.post("/delete-history", Validator.validateRemoveChatHistory, controller.handleDeleteHistory);

module.exports = router;
