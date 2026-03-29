export const BASE_URL = '/api/v1';
const API_KEY = import.meta.env.VITE_EIGENAI_API_KEY;

export interface Scene {
  id: string;
  description: string;
  dialogue: string;
  action: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  actionImageUrl?: string;
  actionVideoUrl?: string;
  status: 'idle' | 'generating' | 'completed' | 'error';
  audioStatus?: 'idle' | 'generating' | 'completed' | 'error';
  videoStatus?: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  actionStatus?: 'idle' | 'generating' | 'completed' | 'error';
  actionVideoStatus?: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  taskId?: string;
  actionTaskId?: string;
}

const headers = {
  Authorization: `Bearer ${API_KEY}`,
};

export const generateScript = async (prompt: string): Promise<Scene[]> => {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: 'You are a cinematic movie script writer. Output a JSON array of exactly 3 or 4 scenes. Each scene must have exactly these keys: "id", "description" (visual prompt max 15 words), "dialogue" (spoken text or empty), and "action". Do not wrap the JSON in Markdown. Be concise to avoid token limits.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4096,
      stream: false
    })
  });

  if (!response.ok) throw new Error(`Script generation failed: ${response.status}`);
  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content).map((s: any) => ({ ...s, status: 'idle', videoStatus: 'idle' }));
  } catch (err) {
    try {
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]).map((s: any) => ({ ...s, status: 'idle', videoStatus: 'idle' }));
      }
    } catch (e) {}
    console.error('Failed to parse script JSON!', content);
    throw new Error('Failed to parse script from LLM');
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  const form = new FormData();
  form.append('model', 'eigen-image');
  form.append('prompt', prompt);
  form.append('binary_response', 'true');

  const response = await fetch(`${BASE_URL}/generate`, {
    method: 'POST',
    headers,
    body: form
  });

  if (!response.ok) throw new Error(`Image generation failed: ${response.status}`);
  
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (data.turbo_image_base64) return `data:image/png;base64,${data.turbo_image_base64}`;
    if (data.image_url) return data.image_url;
    if (data.image_path) return data.image_path;
    if (data.images && data.images.length > 0 && data.images[0].url) return data.images[0].url;
    throw new Error(`Unexpected JSON response in generateImage: ${JSON.stringify(data)}`);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const editImage = async (prompt: string, sourceImageUrl: string): Promise<string> => {
  const form = new FormData();
  form.append('model', 'eigen-image');
  form.append('prompt', prompt);
  form.append('mode', 'image-editing');
  form.append('num_inference_steps', '15');
  form.append('binary_response', 'true');

  const res = await fetch(sourceImageUrl);
  const imageBlob = await res.blob();
  form.append('images', imageBlob, 'image.png');

  const response = await fetch(`${BASE_URL}/generate`, {
    method: 'POST',
    headers,
    body: form
  });

  if (!response.ok) throw new Error(`Image editing failed: ${response.status}`);
  
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (data.turbo_image_base64) return `data:image/png;base64,${data.turbo_image_base64}`;
    if (data.edited_image_base64) return `data:image/png;base64,${data.edited_image_base64}`;
    if (data.image_url) return data.image_url;
    if (data.image_path) return data.image_path;
    if (data.images && data.images.length > 0 && data.images[0].url) return data.images[0].url;
    throw new Error(`Unexpected JSON response in editImage: ${JSON.stringify(data)}`);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const generateAudio = async (text: string, voiceId = 'Linda'): Promise<string> => {
  if (!text || text.trim() === '') return '';
  
  const form = new FormData();
  form.append('model', 'higgs2p5');
  form.append('text', text);
  form.append('voice', voiceId);

  const response = await fetch(`${BASE_URL}/generate`, {
    method: 'POST',
    headers,
    body: form
  });

  if (!response.ok) throw new Error(`Audio generation failed: ${response.status}`);
  
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const uploadVoiceReference = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append('model', 'higgs2p5');
  form.append('voice_reference_file', file);

  const response = await fetch(`${BASE_URL}/generate/upload`, {
    method: 'POST',
    headers,
    body: form
  });

  if (!response.ok) throw new Error(`Voice upload failed: ${response.status}`);
  const data = await response.json();
  return data.voice_id;
};

export const submitVideoJob = async (prompt: string, imageUrl: string): Promise<string> => {
  const form = new FormData();
  form.append('model', 'wan2p2-i2v-14b-turbo');
  form.append('prompt', prompt);
  form.append('infer_steps', '5');
  form.append('seed', '42');

  if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    form.append('image', blob, 'image.jpg');
  } else {
    form.append('image_url', imageUrl);
  }

  const response = await fetch(`${BASE_URL}/generate`, {
    method: 'POST',
    headers,
    body: form
  });

  if (!response.ok) throw new Error(`Video submission failed: ${response.status}`);
  const data = await response.json();
  return data.task_id;
};

export const pollVideoStatus = async (taskId: string): Promise<{ status: string }> => {
  const response = await fetch(`${BASE_URL}/generate/status?jobId=${taskId}&model=wan2p2-i2v-14b-turbo`, {
    headers
  });
  if (!response.ok) throw new Error('Polling failed');
  return response.json();
};

export const getVideoResult = async (taskId: string): Promise<string> => {
  const response = await fetch(`${BASE_URL}/generate/result?jobId=${taskId}&model=wan2p2-i2v-14b-turbo`, {
    headers
  });
  if (!response.ok) throw new Error('Failed to get video result');
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
