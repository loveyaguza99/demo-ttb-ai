from transformers import Wav2Vec2FeatureExtractor, AutoModelForAudioClassification
import torch
import torchaudio
import librosa

# โหลด feature extractor แทน tokenizer
model_name = "ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition"
extractor = Wav2Vec2FeatureExtractor.from_pretrained(model_name)
model = AutoModelForAudioClassification.from_pretrained(model_name)

# โหลดไฟล์เสียง (เช่นจาก librosa)
file_path = "../th-TH-AcharaNeural.wav"
waveform, sr = librosa.load(file_path, sr=16000)  # Wav2Vec2 ต้องใช้ 16kHz
inputs = extractor(waveform, sampling_rate=16000, return_tensors="pt")

# พยากรณ์
with torch.no_grad():
    logits = model(**inputs).logits

predicted_class_id = int(torch.argmax(logits))
predicted_label = model.config.id2label[predicted_class_id]

print("Predicted Emotion:", predicted_label)
