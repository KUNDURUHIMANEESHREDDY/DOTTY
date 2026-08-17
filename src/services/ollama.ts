export interface OllamaModelInfo {
  name: string;
  size: number;
  modified_at: string;
}

export async function checkOllamaConnection(baseUrl: string = 'http://localhost:11434'): Promise<{ connected: boolean; models: string[]; error?: string }> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return { connected: false, models: [], error: `Ollama server returned status ${res.status}` };
    }

    const data = await res.json();
    const models = (data.models || []).map((m: any) => m.name);
    return { connected: true, models };
  } catch (err: any) {
    return { connected: false, models: [], error: err.message || 'Could not connect to Ollama on ' + baseUrl };
  }
}

export async function generateWithOllama(
  prompt: string,
  systemPrompt: string,
  model: string = 'llama3',
  baseUrl: string = 'http://localhost:11434'
): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/generate`;
  
  const payload = {
    model: model,
    prompt: prompt,
    system: systemPrompt,
    stream: false,
    options: {
      temperature: 0.3,
      top_p: 0.9,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama generation failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return (data.response || '').trim();
}
