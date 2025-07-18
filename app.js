import express from "express";
import documentRoutes from "./src/modules/document/document.routes.js";
import chatRoutes from "./src/modules/chat/chat.routes.js";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/docs", documentRoutes);
app.use("/chat", chatRoutes);

export default app;
