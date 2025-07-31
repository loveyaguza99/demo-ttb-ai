const express = require("express");
const Validator = require('./document.validator.js');
const controller = require("./document.controller.js");

const router = express.Router();

router.post("/upload", controller.handleUpload);
router.post("/upload-ocr", controller.handleUploadOcr);
router.post("/semantic-search", Validator.validateSimilaritySearch, controller.handleSimilaritySearch);

module.exports = router;
