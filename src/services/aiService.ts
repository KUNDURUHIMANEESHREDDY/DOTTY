import { AIProvider, AISettings, ActionType, DiffResult, ToneType, CustomRule } from '../types';
import { checkGrammarWithLanguageTool } from './languageTool';
import { generateWithOllama } from './ollama';
import { generateWithGemini, generateWithOpenAICompatible, generateWithClaude } from './aiProviders';
import {
  runLocalGrammarCheck,
  runLocalPromptEnhancement,
  runLocalToneShift,
  runLocalSummarize,
  runLocalExpand,
} from './offlineEngine';
import { SYSTEM_PROMPTS } from './promptEngineering';

export interface ProcessTextOptions {
  action: ActionType;
  text: string;
  tone?: ToneType;
  customPrompt?: string;
  targetLanguage?: string;
  settings: AISettings;
  customRules?: CustomRule[];
}

export async function processTextWithAI(options: ProcessTextOptions): Promise<DiffResult> {
  const { action, text, tone, customPrompt, targetLanguage, settings, customRules } = options;

  if (!text || !text.trim()) {
    return {
      originalText: text,
      enhancedText: text,
      action,
      provider: 'smart-fallback',
      explanation: 'No text provided to process.',
    };
  }

  // Determine provider based on action type
  const isGrammar = action === 'grammar';
  const provider: AIProvider = isGrammar ? settings.activeGrammarProvider : settings.activePromptProvider;

  // 1. PURE LOCAL OFFLINE ENGINE (Zero servers, zero network calls)
  if (provider === 'smart-fallback') {
    if (isGrammar) {
      const { correctedText, fixesCount, explanations } = runLocalGrammarCheck(text, customRules);
      return {
        originalText: text,
        enhancedText: correctedText,
        action: 'Fix Grammar & Spelling (Local Engine)',
        provider: 'smart-fallback',
        explanation: fixesCount > 0
          ? `Corrected ${fixesCount} item(s) locally: ${explanations.slice(0, 2).join(', ')}`
          : 'No spelling or grammar errors detected by local rule engine.',
      };
    }

    if (action === 'enhance-prompt') {
      const enhanced = runLocalPromptEnhancement(text);
      return {
        originalText: text,
        enhancedText: enhanced,
        action: 'Enhance Prompt (Local Engine)',
        provider: 'smart-fallback',
        explanation: 'Generated architectural prompt blueprint locally (Zero network calls).',
      };
    }

    if (action === 'tone' && tone) {
      const shifted = runLocalToneShift(text, tone, customRules);
      return {
        originalText: text,
        enhancedText: shifted,
        action: `Change Tone to ${tone === 'accessible' ? 'Plain English (Accessible)' : tone.toUpperCase()}`,
        provider: 'smart-fallback',
        explanation: `Adjusted vocabulary and tone to ${tone === 'accessible' ? 'Plain English' : tone} locally.`,
      };
    }

    if (action === 'summarize') {
      const summary = runLocalSummarize(text);
      return {
        originalText: text,
        enhancedText: summary,
        action: 'Summarize Key Takeaways',
        provider: 'smart-fallback',
        explanation: 'Extracted key sentences and generated executive summary locally.',
      };
    }

    if (action === 'expand') {
      const expanded = runLocalExpand(text, customRules);
      return {
        originalText: text,
        enhancedText: expanded,
        action: 'Expand & Elaborate',
        provider: 'smart-fallback',
        explanation: 'Expanded structure with strategic breakdown and next steps locally.',
      };
    }

    if (action === 'custom' && customPrompt) {
      const enhanced = `### **Task Instruction**\n${customPrompt}\n\n### **Input Context**\n${text.trim()}`;
      return {
        originalText: text,
        enhancedText: enhanced,
        action: 'Custom Command',
        provider: 'smart-fallback',
        explanation: 'Formatted custom prompt context locally.',
      };
    }
  }

  // 2. LOCAL OLLAMA LLM (100% Local Machine, No external cloud servers)
  if (provider === 'ollama') {
    let systemPrompt = SYSTEM_PROMPTS.GRAMMAR_FIX;
    if (action === 'enhance-prompt') systemPrompt = SYSTEM_PROMPTS.ENHANCE_PROMPT;
    else if (action === 'tone' && tone) systemPrompt = SYSTEM_PROMPTS.TONE_ADJUSTMENT(tone);
    else if (action === 'summarize') systemPrompt = SYSTEM_PROMPTS.SUMMARIZE;
    else if (action === 'expand') systemPrompt = SYSTEM_PROMPTS.EXPAND;
    else if (action === 'custom' && customPrompt) systemPrompt = customPrompt;

    try {
      const enhanced = await generateWithOllama(
        text,
        systemPrompt,
        settings.ollamaModel,
        settings.ollamaUrl
      );
      return {
        originalText: text,
        enhancedText: enhanced,
        action,
        provider: 'ollama',
        explanation: `Processed 100% locally on your machine via Ollama (${settings.ollamaModel})`,
      };
    } catch (err: any) {
      console.warn('Ollama local model failed, falling back to local heuristic engine:', err);
      return processTextWithAI({ ...options, settings: { ...settings, activePromptProvider: 'smart-fallback', activeGrammarProvider: 'smart-fallback' } });
    }
  }

  // 3. OPTIONAL CLOUD PROVIDERS (Only if user explicitly chose them in Settings)
  let systemPrompt = SYSTEM_PROMPTS.GRAMMAR_FIX;
  if (action === 'enhance-prompt') systemPrompt = SYSTEM_PROMPTS.ENHANCE_PROMPT;
  else if (action === 'tone' && tone) systemPrompt = SYSTEM_PROMPTS.TONE_ADJUSTMENT(tone);
  else if (action === 'summarize') systemPrompt = SYSTEM_PROMPTS.SUMMARIZE;
  else if (action === 'expand') systemPrompt = SYSTEM_PROMPTS.EXPAND;
  else if (action === 'custom' && customPrompt) systemPrompt = customPrompt;
  else if (action === 'translate' && targetLanguage) systemPrompt = `Translate to ${targetLanguage}. Return ONLY translation.`;

  try {
    if (provider === 'languagetool' && isGrammar) {
      const ltResult = await checkGrammarWithLanguageTool(text, settings.languageToolUrl);
      return {
        originalText: text,
        enhancedText: ltResult.correctedText,
        action: 'Grammar Correction',
        provider: 'languagetool',
        explanation: ltResult.issues.length > 0
          ? `Corrected ${ltResult.issues.length} grammar/spelling rule${ltResult.issues.length > 1 ? 's' : ''}.`
          : 'No grammar or spelling issues detected.',
      };
    }

    if (provider === 'gemini') {
      const enhanced = await generateWithGemini(text, systemPrompt, {
        apiKey: settings.geminiKey,
        model: settings.geminiModel,
      });
      return {
        originalText: text,
        enhancedText: enhanced,
        action,
        provider: 'gemini',
        explanation: `Processed with Google ${settings.geminiModel}`,
      };
    }

    if (provider === 'openai') {
      const enhanced = await generateWithOpenAICompatible(text, systemPrompt, {
        apiKey: settings.openaiKey,
        model: settings.openaiModel,
        baseUrl: settings.openaiBaseUrl,
      });
      return {
        originalText: text,
        enhancedText: enhanced,
        action,
        provider: 'openai',
        explanation: `Processed with OpenAI ${settings.openaiModel}`,
      };
    }

    if (provider === 'claude') {
      const enhanced = await generateWithClaude(text, systemPrompt, {
        apiKey: settings.claudeKey,
        model: settings.claudeModel,
      });
      return {
        originalText: text,
        enhancedText: enhanced,
        action,
        provider: 'claude',
        explanation: 'Processed with Anthropic Claude',
      };
    }

    if (provider === 'groq') {
      const enhanced = await generateWithOpenAICompatible(text, systemPrompt, {
        apiKey: settings.groqKey,
        model: settings.groqModel,
        baseUrl: 'https://api.groq.com/openai/v1',
      });
      return {
        originalText: text,
        enhancedText: enhanced,
        action,
        provider: 'groq',
        explanation: `Processed with Groq ${settings.groqModel}`,
      };
    }
  } catch (err: any) {
    console.warn(`Provider (${provider}) failed, using local offline engine:`, err);
    return processTextWithAI({ ...options, settings: { ...settings, activePromptProvider: 'smart-fallback', activeGrammarProvider: 'smart-fallback' } });
  }

  return {
    originalText: text,
    enhancedText: text,
    action,
    provider: 'smart-fallback',
  };
}
