// const fs = require("fs");
import sdk from "microsoft-cognitiveservices-speech-sdk";
// const sdk = require("microsoft-cognitiveservices-speech-sdk");

// This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
var subscriptionKey = "8oX4YqhNHNpuEaQT6bvI5AaSl6iDEWGZwuM6r4tT35VusQiRLtD7JQQJ99BDACqBBLyXJ3w3AAAYACOGugEU";
var serviceRegion = "southeastasia"; // e.g., "westus"
var filename = "-101071.wav";
const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
speechConfig.speechRecognitionLanguage = "th-TH";

export async function speechToText(buffer) {

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


// now create the audio-config pointing to our stream and
// the speech config specifying the language.
var audioConfig = sdk.AudioConfig.fromAudioFileOutput(filename);

speechConfig.speechSynthesisVoiceName = "th-TH-NiwatNeural";  // ตัวอย่างเสียงภาษาไทยหญิง

// create the speech synthesizer.
var synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

// var rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });

export async function textToSpeech(text) {
// rl.question("Type some text that you want to speak...\n> ", function (text) {
//   rl.close();
  // start the synthesizer and wait for a result.
  synthesizer.speakTextAsync(text,
      function (result) {
    if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
      console.log("synthesis finished.");
    } else {
      console.error("Speech synthesis canceled, " + result.errorDetails +
          "\nDid you update the subscription info?");
    }
    synthesizer.close();
    synthesizer = undefined;
  },
      function (err) {
    console.trace("err - " + err);
    synthesizer.close();
    synthesizer = undefined;
  });
  console.log("Now synthesizing to: " + filename);
}