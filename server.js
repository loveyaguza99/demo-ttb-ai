const dotenv = require('dotenv');
dotenv.config();

const http = require('http');
const { WebSocketServer } = require('ws');

const app = require('./app.js');
const initChatSocket = require('./src/modules/chat/chat.websocket.js');

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/chat/ws" });
initChatSocket(wss);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});
