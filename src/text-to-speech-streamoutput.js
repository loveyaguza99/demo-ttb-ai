require('dotenv').config();
const sdk = require('microsoft-cognitiveservices-speech-sdk');

const subscriptionKey = process.env.AZURE_SPEECH_API_KEY
const serviceRegion = process.env.AZURE_SPEECH_REGION;

function textToSpeech(text, voice = "th-TH-NiwatNeural") {
  const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
  speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
  speechConfig.speechSynthesisVoiceName = voice;

  // Audio output config to receive audio as a stream
  const audioConfig = sdk.AudioConfig.fromStreamOutput(sdk.AudioOutputStream.createPullStream());

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      result => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          // result.audioData is a buffer
          // console.log("Synthesis finished.");
          resolve(Buffer.from(result.audioData));
        } else {
          // console.error("Speech synthesis canceled, " + result.errorDetails);
          reject(new Error(result.errorDetails));
        }
        synthesizer.close();
      },
      error => {
        synthesizer.close();
        reject(error);
      }
    );
  });
}

module.exports = {
  textToSpeech
}