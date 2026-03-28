---
name: eigenai-text
description: A description of eigenai text chat completions API documentation.
---

# Eigen AI Text API (Chat Completions) Documentation

This skill covers the Eigen AI Model APIs related to text generation using the Chat Completions endpoint.

## 1. Base URL

- **Production Base URL:** `https://api-web.eigenai.com`
- **Chat Completions Endpoint:** `https://api-web.eigenai.com/api/v1/chat/completions`

## 2. Chat Completions API

Create a chat completion from a list of messages.

**Endpoint**: `POST https://api-web.eigenai.com/api/v1/chat/completions`  
**Authentication**: Header `Authorization: Bearer YOUR_API_KEY`  
**Content-Type**: `application/json`

### Parameters

**Common Parameters**:
- `model` (string): The name of the model to use (e.g., `gpt-oss-120b`).
- `messages` (array): A list of message objects describing the conversation so far.

**Generation Controls & Streaming Options** (Conditional):
- `temperature` (number): Sampling temperature.
- `max_tokens` (integer): Maximum number of tokens to generate.
- `top_p` (number): Nucleus sampling probability.
- `top_k` (integer): Number of highest probability vocabulary tokens to keep for top-k filtering.
- `min_p` (number): Minimum probability threshold.
- `repetition_penalty` (number): Repetition penalty.
- `stream` (boolean): Set to `true` to stream the response back.

**Vision Input**:
- `messages[].content` can be an array to allow for vision inputs, featuring objects with `type: "text"`, `type: "video_url"`, or `type: "image_url"`.

---

### Examples

#### Basic Text Request (cURL)

```bash
curl -X POST https://api-web.eigenai.com/api/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-oss-120b",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Explain quantum computing in simple terms."}
    ],
    "temperature": 0.7,
    "max_tokens": 2000,
    "stream": false
  }'
```

#### Vision Input (Text + Image) Request (cURL)

```bash
curl -X POST https://api-web.eigenai.com/api/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "YOUR_MODEL",
    "messages": [
      {
        "role": "user",
        "content": [
          {"type": "text", "text": "Describe the image."},
          {"type": "image_url", "image_url": {"url": "https://example.com/image.png"}}
        ]
      }
    ],
    "max_tokens": 500,
    "stream": false
  }'
```
