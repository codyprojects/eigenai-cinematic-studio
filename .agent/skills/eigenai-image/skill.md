---
name: eigenai-image
description: A description of eigenai image generation API documentation.
---

# Eigen AI Image Generation API Documentation

This skill covers the Eigen AI Model APIs related to generating and editing images.

## 1. Base URL

- **Production Base URL:** `https://api-web.eigenai.com`
- **Generate Endpoint:** `https://api-web.eigenai.com/api/v1/generate`

## 2. Generate Image API

**Endpoint**: `POST https://api-web.eigenai.com/api/v1/generate`  
**Authentication**: Header `Authorization: Bearer YOUR_API_KEY`  

### Parameters

**Common Parameters**:
- `model` (string): The name of the model to use.
- `prompt` (string): Descriptive text prompt for the image.

**Conditional - Image Generation (Text Prompt)**:
- `seed` (integer): Random seed for generation.
- `mode` (string): Generation mode.
- `real_time` (boolean): Flag for real-time generation.
- `width` (integer): Output width.
- `height` (integer): Output height.
- `guidance_scale` (number): Scale for classifier-free guidance.

**Conditional - Image Editing (Upload or URL)**:
- `image_file` or `image` (file): Uploaded reference or source image.
- `image_path` (string): URL to source image.
- `num_inference_steps` (number): Number of iterations.
- `binary_response` (boolean): Whether to return the file as binary instead of a JSON URL.
- `output_format` (string)
- `downsizing_mp` (number)
- `lora_strength` (number)
- `rank` (number)
- `offloading` (boolean)
- `weight` (string)
- `true_cfg_scale` (number)
- `sample_steps` (number)
- `sample_guide_scale` (number)
- `negative_prompt` (string)
- `s3_output_path` (string)

---

### Examples

#### Image generation (JSON)

```bash
curl -X POST https://api-web.eigenai.com/api/v1/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "YOUR_MODEL",
    "prompt": "A fluffy orange tabby cat in a sunlit garden"
  }'
```

#### Image editing

```bash
curl -X POST https://api-web.eigenai.com/api/v1/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "model=eigen-image" \
  -F "mode=image-editing" \
  -F "prompt=change the sky to sunset" \
  -F "seed=42" \
  -F "images=@/path/to/image.jpg" \
  -o response.json && \
jq -r '.edited_image_base64' response.json | base64 -d > edited_image.png
```

```javascript
import fs from 'fs';

const response = await fetch('https://api-web.eigenai.com/api/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'eigen-image',
    prompt: 'A fluffy orange tabby cat sitting in a sunlit garden, surrounded by colorful flowers, soft bokeh background, golden hour lighting'
  })
});

const result = await response.json();

// Save the generated image
if (result.turbo_image_base64) {
  const buffer = Buffer.from(result.turbo_image_base64, 'base64');
  fs.writeFileSync('generated_image.png', buffer);
  console.log('Image saved to generated_image.png');
}
```

