import express from "express";

const router = express.Router();

router.post("/",  async (req, res) => {
  res.json({ status: "queued" });
});

export default router;
