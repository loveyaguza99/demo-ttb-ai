import express from "express";
import documentRoutes from "./src/modules/document/document.routes.js";
import chatRoutes from "./src/modules/chat/chat.routes.js";

const app = express();
app.use(express.json());

app.use("/docs", documentRoutes);
app.use("/chat", chatRoutes);

export default app;
