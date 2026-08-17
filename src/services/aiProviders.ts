export interface CloudAIOptions {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

/**
 * Google Gemini API Integration
 */
export async function generateWithGemini(
  prompt: string,
  systemPrompt: string,
  options: CloudAIOptions
): Promise<string> {
  const apiKey = options.apiKey?.trim();
  if (!apiKey) throw new Error('Gemini API key is required. Please set it in Settings.');

  const model = options.model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nUser Input:\n${prompt}` }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidate) {
    throw new Error('Gemini did not return any text content.');
  }

  return candidate.trim();
}

/**
 * OpenAI & Compatible (Groq, Together, DeepSeek, Local AI)
 */
export async function generateWithOpenAICompatible(
  prompt: string,
  systemPrompt: string,
  options: CloudAIOptions
): Promise<string> {
  const apiKey = options.apiKey?.trim();
  if (!apiKey) throw new Error('API key is required. Please configure it in Settings.');

  const baseUrl = options.baseUrl || 'https://api.openai.com/v1';
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const model = options.model || 'gpt-4o-mini';

  const payload = {
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('No response returned from model.');
  }

  return text.trim();
}

/**
 * Anthropic Claude API Integration
 */
export async function generateWithClaude(
  prompt: string,
  systemPrompt: string,
  options: CloudAIOptions
): Promise<string> {
  const apiKey = options.apiKey?.trim();
  if (!apiKey) throw new Error('Anthropic API key is required. Please set it in Settings.');

  const url = 'https://api.anthropic.com/v1/messages';
  const model = options.model || 'claude-3-5-sonnet-20241022';

  const payload = {
    model: model,
    system: systemPrompt,
    messages: [
      { role: 'user', content: prompt },
    ],
    max_tokens: 2048,
    temperature: 0.2,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) {
    throw new Error('Claude did not return any text.');
  }

  return text.trim();
}
