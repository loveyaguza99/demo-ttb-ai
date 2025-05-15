// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// <code>

// pull in the required packages.
const sdk = require("microsoft-cognitiveservices-speech-sdk");

// replace with your own subscription key,
// service region (e.g., "westus"), and
// the name of the file you save the synthesized audio.
var subscriptionKey = "8oX4YqhNHNpuEaQT6bvI5AaSl6iDEWGZwuM6r4tT35VusQiRLtD7JQQJ99BDACqBBLyXJ3w3AAAYACOGugEU";
var serviceRegion = "southeastasia"; // e.g., "westus"
var filename = "YourAudioFile.wav";

// we are done with the setup

// now create the audio-config pointing to our stream and
// the speech config specifying the language.
var audioConfig = sdk.AudioConfig.fromAudioFileOutput(filename);
var speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);

speechConfig.speechSynthesisVoiceName = "th-TH-NiwatNeural";  // ตัวอย่างเสียงภาษาไทยหญิง

// create the speech synthesizer.
var synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

// var rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });

async function textToSpeech(text) {
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
// </code>

module.exports = {
  textToSpeech
}
