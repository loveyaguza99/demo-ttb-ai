const WebSocket = require('ws');
const { azureOpenAIChat } = require('../utils/openai-chat');
const { speechToText, textToSpeech } = require('../utils/speech');
// const fs = require('fs');
// const path = require('path');

function initChatSocket(wss) {
  wss.on('connection', (ws) => {
    console.log('Client connected');
    let bestScript = '';
    let audioChunks = [];
    let messageType = null;
    let history = [];

    ws.on('message', async (rawMessage, isBinary) => {
      let data;
      if (isBinary) {
        const tryString = rawMessage.toString('utf-8');

        try {
          data = JSON.parse(tryString);
          // messageType = "json";
          console.log('✅ Received JSON (binary string):', data);
        } catch (e) {
          data = rawMessage;
          messageType = 'binary';
          audioChunks.push(data);
          console.log('🎧 Received true binary data');
        }
      } else {
        const text = rawMessage.toString();
        try {
          data = JSON.parse(text);
          if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            // messageType = 'json';
            console.log('✅ Received JSON:', data);
          } else {
            data = text;
            messageType = 'text';
            console.log('📝 Received plain text:', data);
          }
        } catch {
          data = text;
          messageType = 'text';
          console.log('📝 Received plain text:', data);
        }
      }

      console.log('Message type:', messageType);

      // รับข้อมูลจาก best script จาก client
      if (data.type === 'register') {
        bestScript = data.content;
        console.log('Best Script:', bestScript);
      }

      // จบการสนทนา คำนวณผล score
      if (data.type === 'endconversation') {
        const userContents = history
          .filter((item) => item.role === 'user')
          .map((item) => item.content);
        console.log('User Dialogue:', userContents);
        console.log('End Conversation');
        // const result = await splitSection(userContents, bestScript);
        // console.log(result);
        // ws.send(JSON.stringify(result));
        ws.close();
      }

      if (
        ((messageType === 'binary' && data.type === 'stoptalking') ||
          messageType === 'text') &&
        data.type !== 'register'
      ) {
        try {
          let message;
          if (messageType === 'binary') {
            // รับข้อมูล audio wav
            const wavBuffer = Buffer.concat(audioChunks);
            audioChunks = [];
            try {
              const text = await speechToText(wavBuffer);
              message = text;

              // ==== บันทึกไฟล์ wav ลงเครื่อง (ถ้าต้องการ) ====
              // const outputDir = path.join(__dirname, 'recordings');
              // if (!fs.existsSync(outputDir)) {
              //   fs.mkdirSync(outputDir);
              // }
              // const filename = `audio_${Date.now()}.wav`;
              // const filepath = path.join(outputDir, filename);
              // fs.writeFileSync(filepath, wavBuffer);
              // console.log('✅ Saved wav file to:', filepath);
              // ==== จบส่วนบันทึกไฟล์ ====
            } catch (err) {
              console.error('Text-to-speech error:', err);
              return;
            }
          } else if (messageType === 'text') {
            // รับข้อมูล text
            message = data.toString();
          }

          console.log('Message:', message);
          // เช็คว่า text ว่างหรือ undefined ให้ return ออกไปเลย
          if (!message || message.trim() === '') {
            return;
          }
          ws.send(JSON.stringify({ content: message }));

          // chat completion
          const aiResponse = await azureOpenAIChat(bestScript, message, history);
          history.push({ role: 'user', content: message });
          history.push({ role: aiResponse.role, content: aiResponse.content });

          ws.send(JSON.stringify(aiResponse));

          // textToSpeech
          try {
            const TextToSpeech = await textToSpeech(aiResponse.content);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(TextToSpeech);
            }
          } catch (ttsError) {
            console.error('Text-to-speech error:', ttsError);
          }
        } catch (err) {
          console.error('Error processing:', err);
          // ws.send("Error processing your request.");
        }
      }
    });

    ws.on('close', () => {
      audioChunks = [];
      messageType = null;
      history = [];
    });
  });
}

module.exports = initChatSocket;
