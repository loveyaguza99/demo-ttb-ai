const sdk = require("microsoft-cognitiveservices-speech-sdk");

const subscriptionKey = process.env.SPEECH_KEY || "8oX4YqhNHNpuEaQT6bvI5AaSl6iDEWGZwuM6r4tT35VusQiRLtD7JQQJ99BDACqBBLyXJ3w3AAAYACOGugEU"; // เปลี่ยนเป็นตัวแปร env จริงๆ
const serviceRegion = "southeastasia";
const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
speechConfig.speechRecognitionLanguage = "th-TH";
speechConfig.speechSynthesisVoiceName = "th-TH-NiwatNeural"; // เสียงผู้ชายไทย (เปลี่ยนได้ตามต้องการ)

async function speechToText(buffer) {
  // สร้าง push stream สำหรับ audio
  const pushStream = sdk.AudioInputStream.createPushStream();
  pushStream.write(buffer);
  pushStream.close();

  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
  const speechRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  return new Promise((resolve, reject) => {
    speechRecognizer.recognizeOnceAsync(
      result => {
        speechRecognizer.close();
        resolve(result.privText);
      },
      err => {
        speechRecognizer.close();
        reject(err);
      }
    );
  });
}

async function textToSpeech(text) {
  return new Promise((resolve, reject) => {
    // สร้าง audioConfig แบบ push stream เพื่อเก็บข้อมูลเสียง output
    const pushStream = sdk.AudioOutputStream.createPullStream();
    const audioConfig = sdk.AudioConfig.fromStreamOutput(pushStream);
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    const chunks = [];
    // เก็บ data chunk ใน pushStream (ในกรณีนี้ต้องดัก event)
    // แต่ sdk ไม่มี event ใน pullStream, เราอาจใช้ pushStream แทน
    // หรือปรับให้เก็บไฟล์ หรือแปลงเป็น Buffer ในทางอื่น
    // ที่นี่จะใช้วิธีง่ายๆ คือใช้ callback ของ speakTextAsync แล้ว resolve

    synthesizer.speakTextAsync(
      text,
      result => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          synthesizer.close();
          resolve(result.audioData); // audioData เป็น Uint8Array
        } else {
          synthesizer.close();
          reject(new Error("Speech synthesis canceled: " + result.errorDetails));
        }
      },
      err => {
        synthesizer.close();
        reject(err);
      }
    );
  });
}

module.exports = {
  speechToText,
  textToSpeech,
};
