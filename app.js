const express = require("express");
const cors = require("cors");

const documentRoutes = require("./src/modules/document/document.routes.js");
const chatRoutes = require("./src/modules/chat/chat.routes.js");

const app = express();
app.use(express.json());

const corsOptions = {
  origin: ['https://teamlink-ai-chat.azurewebsites.net/'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

app.use("/docs", documentRoutes);
app.use("/chat", chatRoutes);

app.use(express.static('./out')); // for test serving static files from the 'out' directory

module.exports = app;
