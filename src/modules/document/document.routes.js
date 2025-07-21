const express = require("express");
const {
  handleUpload,
  handleUploadOcr,
  handleSimilaritySearch
} = require("./document.controller.js");

const router = express.Router();

router.post("/upload", handleUpload);
router.post("/upload-ocr", handleUploadOcr);
router.post("/similarity-search", handleSimilaritySearch);

module.exports = router;
