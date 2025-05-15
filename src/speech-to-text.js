const fs = require("fs");
const sdk = require("microsoft-cognitiveservices-speech-sdk");

// This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
var subscriptionKey = "8oX4YqhNHNpuEaQT6bvI5AaSl6iDEWGZwuM6r4tT35VusQiRLtD7JQQJ99BDACqBBLyXJ3w3AAAYACOGugEU";
var serviceRegion = "southeastasia"; // e.g., "westus"
var filename = "-101071.wav";
const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
speechConfig.speechRecognitionLanguage = "th-TH";

async function speechToText(buffer) {

      // Create push stream
      const pushStream = sdk.AudioInputStream.createPushStream();
    
      // Push audio data to the stream
      pushStream.write(buffer);
      pushStream.close();

  // const audioData = new Uint8Array(buffer); // ✅ แปลง Buffer เป็น Uint8Array
  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream); // ✅ ใช้ Uint8Array
  // let audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(buffer));
  const speechRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  return new Promise((resolve, reject) => {
    speechRecognizer.recognizeOnceAsync(
      function (result) {
        // console.log(result.privText);
        speechRecognizer.close();
        resolve(result.privText);
      },
      function (err) {
        console.trace("err - " + err);
        speechRecognizer.close();
        reject(err);
      }
    );
  });
}

module.exports = {
  speechToText
}