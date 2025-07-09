import { createServer } from "http";
import { WebSocketServer } from "ws";
import app from "./app.js";
import initChatSocket from "./src/modules/chat/chat.websocket.js";

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/chat/ws" });
initChatSocket(wss);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
