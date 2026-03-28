---
name: eigenai-video
description: A description of eigenai video generation API documentation.
---

# Eigen AI Video Generation API Documentation

This skill covers the Eigen AI Model APIs related to generating video content asynchronously (e.g., Image-to-Video).

## 1. Base URL

- **Production Base URL:** `https://api-web.eigenai.com`

## 2. Generate Video Workflow

Creating a video is an asynchronous process involving three steps: Submitting the job, polling for its status, and downloading the finalized result.

**Authentication**: All requests require the header `Authorization: Bearer YOUR_API_KEY`.

### Step 1 — Submit Job

Submit an image-to-video generation job and retrieve a task ID.

**Endpoint**: `POST https://api-web.eigenai.com/api/v1/generate`

**Parameters (multipart/form-data)**:
- `model` (string): e.g., `wan2p2-i2v-14b-turbo`
- `prompt` (string): Text describing the intended video.
- `image` (file): Source image file.
- `image_url` (string): URL to source image.
- `infer_steps` (integer)
- `seed` (integer)

**Response**:
Returns a `task_id` used for polling.
```json
{
  "task_id": "XXXX-XXXX-XXXX-XXXX-XXXX",
  "task_status": "pending"
}
```

### Step 2 — Poll Status

Check on the job status until it returns `completed` or `failed`.

**Endpoint**: `GET https://api-web.eigenai.com/api/v1/generate/status?jobId={task_id}&model={model}`

**Response**:
`status` can be `pending`, `processing`, `completed`, or `failed`.
```json
{
  "task_id": "XXXX-XXXX-XXXX-XXXX-XXXX",
  "status": "completed",
  "start_time": "2024-01-01T00:00:00.000Z",
  "end_time": "2024-01-01T00:01:00.000Z",
  "error": null
}
```

### Step 3 — Download Result

Once the status is `completed`, retrieve the finalized video.

**Endpoint**: `GET https://api-web.eigenai.com/api/v1/generate/result?jobId={task_id}&model={model}`

---

### Full Workflow Example (cURL)

```bash
# Step 1: Submit job
curl -X POST https://api-web.eigenai.com/api/v1/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "model=wan2p2-i2v-14b-turbo" \
  -F "prompt=A person waving hello" \
  -F "image=@/path/to/image.jpg" \
  -F "infer_steps=5" \
  -F "seed=42"

# Step 2: Poll status (replace TASK_ID)
curl "https://api-web.eigenai.com/api/v1/generate/status?jobId=TASK_ID&model=wan2p2-i2v-14b-turbo" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Step 3: Download result
curl "https://api-web.eigenai.com/api/v1/generate/result?jobId=TASK_ID&model=wan2p2-i2v-14b-turbo" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -o output.mp4
```
