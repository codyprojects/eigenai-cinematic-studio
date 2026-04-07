# Cinematic Studio Project

This project leverages the **Eigen AI Services** to build advanced video, audio, image and text functionalities in a Cinematic Studio. **All model calling is routed exclusively through Eigen AI.**

## Supported Models

This project strictly uses the following models through Eigen AI:
- **Audio Transcription (ASR)**: Higgs Audio ASR v3
- **Text-to-Speech (TTS)**: Higgs Audio TTS v2.5
- **Text Model**: `gpt-oss-120b`
- **Image Model**: `eigen-image`
- **Video Model**: `wan2p2-i2v-14b-turbo`

## Key Features

- **Audio Transcription (ASR)**: Transcribes speech into text via the Higgs Audio ASR v3 model.
- **Text-to-Speech (TTS)**: Synthesizes high-quality speech from text using the Higgs Audio TTS v2.5 model.
- **Stream Audio**: Stream real-time synthesized speech over a WebSocket connection.
- **Voice Clone / Upload Voice Reference**: Allows uploading custom voice reference audio files to generate a unique `voice_id` for customized TTS generation.

## Agent Skills Details

The specific capabilities and exact payload formats for interacting with the Eigen AI models are described completely within the attached skill documentations:
- [Eigen AI Audio Documentation (`.agent/eigenai-audio/skill.md`)](./.agent/eigenai-audio/skill.md)
- [Eigen AI Text Documentation (`.agent/eigenai-text/skill.md`)](./.agent/eigenai-text/skill.md)
- [Eigen AI Image Documentation (`.agent/eigenai-image/skill.md`)](./.agent/eigenai-image/skill.md)
- [Eigen AI Video Documentation (`.agent/eigenai-video/skill.md`)](./.agent/eigenai-video/skill.md)

## Requirements

1. **Eigen AI API Key**: Grab an API key from [Eigen AI Platform](https://platform.eigenai.com/). Ensure you pass this key as an `Authorization: Bearer YOUR_API_KEY` header for standard HTTP requests and as a JSON payload property on connection for WebSockets.
2. Store your API Key securely in a `.env` file (if testing in Python/Node).
3. Store your VITE_EIGENAI_API_KEY in the `.env` file in the `webapp` directory.

## Setup & Testing

1. Run `npm run dev` in the `webapp` directory to start the development server.
2. Open `http://localhost:5173/` in your browser.
3. 
