import { ToneType } from '../types';

export const SYSTEM_PROMPTS = {
  GRAMMAR_FIX: `You are an elite copy editor and grammar specialist.
Your task: Correct all grammar, spelling, punctuation, capitalization, subject-verb agreement, and phrasing errors in the provided text.
Strict Rules:
- Preserve the author's original meaning, intent, and tone.
- Do not add conversational commentary, disclaimers, or notes.
- Return ONLY the final corrected text.`,

  ENHANCE_PROMPT: `You are a world-class Prompt Engineer and AI Architect.
Your task: Transform the user's rough or basic prompt into an exceptional, high-precision prompt designed to get the best possible output from modern LLMs.

Structure the enhanced prompt clearly with:
1. **Role / Persona**: Clear definition of who the AI is.
2. **Core Task / Objective**: Exact goal to achieve.
3. **Context & Inputs**: Necessary background and input slots.
4. **Constraints & Guidelines**: Boundaries, tone, style, and rules.
5. **Output Format**: Exact structure (e.g., Markdown headings, JSON, step-by-step).

Strict Rules:
- Return ONLY the enhanced prompt itself.
- Do NOT wrap your answer in "Here is the enhanced prompt:".
- Deliver clean, ready-to-use markdown.`,

  TONE_ADJUSTMENT: (tone: ToneType) => `You are an expert writer and communication strategist.
Your task: Rewrite the provided text with a distinct "${tone.toUpperCase()}" tone.
Tone Guidelines:
- "professional": Polished, articulate, clear, corporate-appropriate, respectful.
- "casual": Conversational, friendly, natural, engaging, relaxed.
- "concise": Stripped of fluff, dense in meaning, bulleted if appropriate, direct.
- "academic": Scholarly, precise terminology, objective, structured.
- "persuasive": Compelling, benefit-oriented, confident, inspiring action.

Strict Rules:
- Maintain the essential facts and meaning.
- Return ONLY the rewritten text without preambles or meta-commentary.`,

  SUMMARIZE: `You are an expert executive summarizer.
Your task: Condense the provided text into a crisp, high-impact executive summary with key takeaways as bullet points.
Return ONLY the summary.`,

  EXPAND: `You are an insightful creative writer and content developer.
Your task: Expand the provided text by adding relevant details, vivid examples, clear explanations, and supporting arguments without unnecessary fluff.
Return ONLY the expanded text.`,
};

/**
 * Smart Fallback Engine:
 * In case offline and no local LLM or API keys are available, this heuristic engine
 * performs intelligent grammar fixes and creates well-structured prompts.
 */
export function heuristicFixGrammar(text: string): string {
  if (!text) return '';

  let result = text;

  // Capitalize sentence starts
  result = result.replace(/(^|[.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());

  // Common spelling and grammar fixes
  const commonFixes: [RegExp, string][] = [
    [/\bi\b/g, 'I'],
    [/\bi'm\b/gi, "I'm"],
    [/\bdont\b/gi, "don't"],
    [/\bcant\b/gi, "can't"],
    [/\bwont\b/gi, "won't"],
    [/\bisnt\b/gi, "isn't"],
    [/\barent\b/gi, "aren't"],
    [/\bwasnt\b/gi, "wasn't"],
    [/\bwerent\b/gi, "weren't"],
    [/\bhasnt\b/gi, "hasn't"],
    [/\bhavent\b/gi, "haven't"],
    [/\bhadnt\b/gi, "hadn't"],
    [/\bdoesnt\b/gi, "doesn't"],
    [/\bdidnt\b/gi, "didn't"],
    [/\bcouldnt\b/gi, "couldn't"],
    [/\bshouldnt\b/gi, "shouldn't"],
    [/\bwouldnt\b/gi, "wouldn't"],
    [/\bhe dont\b/gi, "he doesn't"],
    [/\bshe dont\b/gi, "she doesn't"],
    [/\bit dont\b/gi, "it doesn't"],
    [/\bteh\b/gi, "the"],
    [/\brecieve\b/gi, "receive"],
    [/\bseperate\b/gi, "separate"],
    [/\buntill\b/gi, "until"],
    [/\bdefinately\b/gi, "definitely"],
    [/\baccomodate\b/gi, "accommodate"],
    [/\boccured\b/gi, "occurred"],
    [/\btheir is\b/gi, "there is"],
    [/\btheir are\b/gi, "there are"],
    [/\byour welcome\b/gi, "you're welcome"],
    [/\bits a\b/gi, "it's a"],
    [/\balot\b/gi, "a lot"],
    [/\s{2,}/g, ' '], // Multiple spaces to single space
    [/(\w+)\s+([,\.!\?;:])/g, '$1$2'], // Fix space before punctuation
    [/([,\.!\?;:])([A-Za-z])/g, '$1 $2'], // Add space after punctuation
  ];

  for (const [regex, replacement] of commonFixes) {
    result = result.replace(regex, replacement);
  }

  // Ensure trailing punctuation if it looks like a complete sentence
  if (result.length > 5 && !/[.!?]$/.test(result.trim())) {
    result = result.trim() + '.';
  }

  return result;
}

export function heuristicEnhancePrompt(rawPrompt: string): string {
  const trimmed = rawPrompt.trim();
  if (!trimmed) return rawPrompt;

  return `### **Role & Objective**
Act as an expert specialist in this domain. Your task is to execute the following goal with precision:
> "${trimmed}"

### **Context & Requirements**
- Provide a comprehensive, clear, and actionable solution.
- Incorporate current best practices, robust reasoning, and clean formatting.
- If writing code or technical content, ensure code is complete, modular, and well-commented.

### **Instructions**
1. **Analyze the Request**: Break down the core problem and outline key steps.
2. **Execute Solution**: Deliver the core output directly without redundant preamble.
3. **Validate & Refine**: Highlight edge cases, performance tips, or next steps where applicable.

### **Output Format**
- Use clear Markdown headings and code blocks.
- Keep the tone authoritative, practical, and concise.`;
}
