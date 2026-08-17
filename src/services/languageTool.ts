import { GrammarIssue } from '../types';

export interface LanguageToolResult {
  correctedText: string;
  issues: GrammarIssue[];
  hasChanges: boolean;
}

export async function checkGrammarWithLanguageTool(
  text: string,
  apiUrl: string = 'https://api.languagetool.org/v2/check'
): Promise<LanguageToolResult> {
  if (!text || !text.trim()) {
    return { correctedText: text, issues: [], hasChanges: false };
  }

  const params = new URLSearchParams();
  params.append('text', text);
  params.append('language', 'auto');
  params.append('enabledOnly', 'false');

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`LanguageTool API responded with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const matches = data.matches || [];

    const issues: GrammarIssue[] = matches.map((m: any) => ({
      message: m.message,
      shortMessage: m.shortMessage || m.rule?.description,
      offset: m.offset,
      length: m.length,
      replacements: (m.replacements || []).map((r: any) => r.value),
      ruleId: m.rule?.id || 'UNKNOWN',
      ruleCategory: m.rule?.category?.name,
    }));

    // Apply replacements from right to left to avoid invalidating offsets
    let corrected = text;
    const sortedMatches = [...matches].sort((a, b) => b.offset - a.offset);

    for (const match of sortedMatches) {
      if (match.replacements && match.replacements.length > 0) {
        const bestReplacement = match.replacements[0].value;
        const start = match.offset;
        const end = match.offset + match.length;
        corrected = corrected.substring(0, start) + bestReplacement + corrected.substring(end);
      }
    }

    return {
      correctedText: corrected,
      issues,
      hasChanges: corrected !== text,
    };
  } catch (error: any) {
    console.warn('LanguageTool request failed, falling back to heuristic corrector:', error);
    throw error;
  }
}
