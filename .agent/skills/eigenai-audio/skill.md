---
name: eigenai-audio
description: A description of eigenai audio api documentation.
---

# Eigen AI Audio API Documentation

This skill covers the Eigen AI Model APIs related to audio generation, streaming, transcription, and voice cloning.

## 1. Base URLs

- **Production Base URL:** `https://api-web.eigenai.com`
- **WebSocket Base URL:** `wss://api-web.eigenai.com`

## 2. Generate Audio API

**Endpoint**: `POST https://api-web.eigenai.com/api/v1/generate`  
**Authentication**: Header `Authorization: Bearer YOUR_API_KEY`

### Audio Transcription (ASR)
Transcribes audio into text.

**Parameters (multipart/form-data):**
- `model` (string): e.g., `whisper_v3_turbo`
- `file` (file): Path to audio file.
- `language` (string): e.g., `en`
- `response_format` (string): `json` or `text`

**Example (cURL):**
```bash
curl -X POST https://api-web.eigenai.com/api/v1/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "model=whisper_v3_turbo" \
  -F "file=@/path/to/audio.mp3" \
  -F "language=en" \
  -F "response_format=json"
```

### Text-to-Speech (TTS)
Synthesizes speech from text.

**Supported Models:**
- `higgs2p5`: Base TTS model. Supported voices include `Linda`, `Jack`.
- `chatterbox`: ChatterBox Voice Twin model. Language ID e.g., `en`, `zh`, `es`, `ja`.
- `qwen3-tts`: Supported voices include `Vivian`, `Serena`, `Uncle_Fu`, `Dylan`, `Eric`, etc.

**Parameters (multipart/form-data):**
- `model` (string): `higgs2p5`, `chatterbox`, or `qwen3-tts`
- `text` (string): The text to synthesize.
- `voice` (string): Voice ID/name.
- `stream` (boolean): `true` or `false`

**Example (cURL):**
```bash
curl -X POST https://api-web.eigenai.com/api/v1/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "model=higgs2p5" \
  -F "text=Hello, this is a test of the text-to-speech system." \
  -F "voice=Linda" \
  --output speech.wav
```
**Example Python:**
```python
import requests

url = "https://api-web.eigenai.com/api/v1/generate"
headers = {"Authorization": "Bearer YOUR_API_KEY"}

with open("audio.mp3", "rb") as audio:
    response = requests.post(
        url,
        headers=headers,
        data={"model": "whisper_v3_turbo", "language": "en", "response_format": "json"},
        files={"file": ("audio.mp3", audio, "audio/mpeg")},
        timeout=120,
    )
response.raise_for_status()
print(response.json())
```

**Example Javascript:**
```javascript
import fs from "node:fs";

const form = new FormData();
form.append("model", "asr");
form.append("file", fs.createReadStream("audio.mp3"));
form.append("language", "en");
form.append("response_format", "json");

const response = await fetch("https://api-web.eigenai.com/api/v1/generate", {
  method: "POST",
  headers: { Authorization: "Bearer YOUR_API_KEY" },
  body: form,
});
if (!response.ok) throw new Error(`Request failed: ${response.status}`);
console.log(await response.json());
```

## 3. Stream Audio WebSocket

Stream real-time audio generation over a WebSocket connection.

**Endpoint**: `wss://api-web.eigenai.com/api/v1/generate/ws`

**Protocol Steps:**
1. **Authenticate**: Send JSON frame.
   ```json
   { "token": "YOUR_API_KEY", "model": "higgs2p5" }
   ```
2. **Send TTS request**: Send JSON frame.
   ```json
   { "text": "Hello, streaming audio world!", "voice": "Linda" }
   ```
3. **Receive frames**:
   - Audio: Binary frames — raw PCM audio chunks (16-bit, 24 kHz, mono).
   - End of Stream: JSON frame `{"type": "complete"}`.

## 4. Upload Voice Reference

Upload a voice reference audio file to get a `voice_id` for use in TTS requests (e.g., voice cloning).

**Endpoint**: `POST https://api-web.eigenai.com/api/v1/generate/upload`  
**Authentication**: Header `Authorization: Bearer YOUR_API_KEY`

**Parameters (multipart/form-data):**
- `model` (string): `higgs2p5`, `chatterbox`, or `qwen3-tts`
- `voice_reference_file` (file): Path to reference audio.

**Example Response:**
```json
{ "voice_id": "abc123def456..." }
```

**Example (cURL):**
```bash
curl -X POST https://api-web.eigenai.com/api/v1/generate/upload \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "model=higgs2p5" \
  -F "voice_reference_file=@/path/to/reference.wav"
```
