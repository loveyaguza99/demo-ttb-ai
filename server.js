require("dotenv").config();
const WebSocket = require("ws");
const { speechToText } = require("./src/speech-to-text");
const { azureOpenAIChat } = require("./src/openai-chat");
const { textToSpeech } = require("./src/text-to-speech-streamoutput");
const { splitSection } = require("./src/split-section");
const { Readable } = require("stream");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const { PassThrough } = require("stream");
const {
  testScript1,
  testScript2,
  testScript3,
  testScript4,
} = require("./bestScript");

const fs = require("fs");
const path = require("path");

const bestScript = testScript4;
const wss = new WebSocket.Server({ port: 3001 });
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
// เก็บ clients ตาม userId หรือ clientId
const privateRooms = new Map(); // เช่น { 'user123': ws }

wss.on("connection", (ws) => {
  console.log("Client connected");
  let clientId = null;
  let audioChunks = [];
  let messageType = null;
  let history = [];

  ws.on("message", async (rawMessage, isBinary) => {
    let data;
    if (isBinary) {
      const tryString = rawMessage.toString("utf-8");

      try {
        data = JSON.parse(tryString);
        // messageType = "json";
        console.log("✅ Received JSON (binary string):", data);
      } catch (e) {
        data = rawMessage;
        messageType = "binary";
        audioChunks.push(data);
        console.log("🎧 Received true binary data");
      }
    } else {
      const text = rawMessage.toString();
      try {
        data = JSON.parse(text);
        // messageType = 'json';
        console.log("✅ Received JSON:", data);
      } catch {
        data = text;
        messageType = "text";
        console.log("📝 Received plain text:", data);
      }
    }

    console.log("Message type:", messageType);

    //แยก instance ของ clientId
    if (data.type === "register") {
      clientId = data.clientId;
      privateRooms.set(clientId, ws);
      // ws.send(
      //   JSON.stringify({ type: "system", message: `Registered as ${clientId}` })
      // );
    }

    if (data.type === "endconversation") {
      // console.log(history);
      const userContents = history
        .filter((item) => item.role === "user")
        .map((item) => item.content);
      console.log("🚀 ~ ws.on ~ userContents:", userContents);
      console.log("end conversation");
      const result = await splitSection(userContents, bestScript);
      console.log(result);
      ws.send(JSON.stringify(result));
      // privateRooms.delete(clientId);
      ws.close();
    }
    // else {
    //   if (Buffer.isBuffer(data)) {
    //     audioChunks.push(data);
    //     messageType = 'binary';
    //     console.log('Received binary message:');
    //   } else {
    //     messageType = 'text';
    //     console.log('Received non-binary message:');
    //   }
    // }

    // const target = privateRooms.get(clientId);

    if (
      ((messageType === "binary" && data.type === "stoptalking") ||
        messageType === "text") &&
      data.type !== "register"
    ) {
      try {
        let message;
        if (messageType === "binary") {
          // รับข้อมูล audio
          const audioBuffer = await Buffer.concat(audioChunks);
          audioChunks = [];
          console.log("audioBuffer.length", audioBuffer.length);
          try {
            const wavBuffer = await convertWebmToWavBuffer(audioBuffer); // แปลง WebM เป็น WAV
            console.log("✅ Converted to WAV Buffer");
            // speechToText
            const text = await speechToText(wavBuffer);
            message = text;
          } catch (err) {
            console.error("Text-to-speech error:");
            return;
          }

          // // ==== บันทึกไฟล์ wav ลงเครื่อง server ====
          // const outputDir = path.join(__dirname, "recordings");
          // if (!fs.existsSync(outputDir)) {
          //   fs.mkdirSync(outputDir);
          // }
          // const filename = `audio_${Date.now()}.wav`;
          // const filepath = path.join(outputDir, filename);
          // fs.writeFileSync(filepath, wavBuffer);
          // console.log("✅ Saved wav file to:", filepath);
          // // ==== จบส่วนบันทึกไฟล์ ====
        } else if (messageType === "text") {
          // รับข้อมูล text
          message = data.toString();
        }

        console.log("🚀 ~ ws.on ~ message:", message);
        // เช็คว่า text ว่างหรือ undefined ให้ return ออกไปเลย
        if (!message || message.trim() === "") {
          return;
        }
        ws.send(message);

        // chat completion
        const aiResponse = await azureOpenAIChat(bestScript, message, history);
        history.push({ role: "user", content: message });
        history.push({ role: aiResponse.role, content: aiResponse.content });

        ws.send(JSON.stringify(aiResponse));

        // textToSpeech
        try {
          const TextToSpeech = await textToSpeech(aiResponse.content);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(TextToSpeech);
          }
        } catch (ttsError) {
          console.error("Text-to-speech error:", ttsError);
        }
      } catch (err) {
        console.error("Error processing:", err);
        ws.send("Error processing your request.");
      }
    }

    // const target = privateRooms.get(clientId);
    // if (target && target.readyState === WebSocket.OPEN) {
    //   const textMessage = data.toString();
    //   target.send(textMessage);
    // } else {
    //   ws.send(JSON.stringify({ type: 'error', message: 'Target not connected' }));
    // }
  });

  ws.on("close", () => {
    if (clientId) {
      privateRooms.delete(clientId);
    }
    clientId = null;
    audioChunks = [];
    messageType = null;
    history = [];
  });
});

async function convertWebmToWavBuffer(webmBuffer) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    ffmpeg()
      .input(Readable.from(webmBuffer))
      .inputFormat("webm")
      .audioCodec("pcm_s16le")
      .audioFrequency(16000)
      .audioChannels(1)
      .format("wav")
      .on("error", (err) => {
        console.error("FFmpeg error:", err.message);
        reject(err);
      })
      .on("end", () => {
        const wavBuffer = Buffer.concat(chunks);
        resolve(wavBuffer);
      })
      .pipe()
      .on("data", (chunk) => chunks.push(chunk));
  });
}
