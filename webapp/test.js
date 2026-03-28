const API_KEY = 'sk-08ad281f_3547a965815e85361bee7dc7ca42e97d8fe95962c80de7a6178c79f7e688f31f';
const BASE_URL = 'https://api-web.eigenai.com/api/v1';

async function test() {
  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: 'You are a cinematic movie script writer. The user will provide a prompt for a short video. Output a JSON array of scenes. Each scene must have exactly these keys: "id" (unique string), "description" (a highly descriptive visual prompt for an image generator max 30 words), "dialogue" (spoken text or empty), and "action" (a dynamic action). Do not wrap the JSON in Markdown.'
          },
          { role: 'user', content: 'A sci-fi short film about a rogue AI encountering a human child. Cyberpunk aesthetic.' }
        ],
        temperature: 0.7,
        stream: false
      })
    });
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Body:', text.substring(0, 1000));
  } catch(e) {
    console.error('Error:', e);
  }
}
test();
