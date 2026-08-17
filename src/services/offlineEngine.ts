/**
 * DOTTY 100% LOCAL OFFLINE AI & NLP ENGINE
 * Zero external network requests. Runs completely inside the desktop app.
 */

import { ToneType, CustomRule } from '../types';

// ==========================================
// 1. EXTENSIVE LOCAL GRAMMAR & SPELLING ENGINE
// ==========================================

interface GrammarRule {
  pattern: RegExp;
  replacement: string | ((match: string, ...groups: string[]) => string);
  message: string;
  category: 'Spelling' | 'Grammar' | 'Punctuation' | 'Style' | 'Redundancy';
}

const LOCAL_GRAMMAR_RULES: GrammarRule[] = [
  // 1. Specific Multi-Word Subject-Verb & Tense Agreement (Run FIRST before single-word replacements)
  { pattern: /\b(he|she|it|that|this)\s+dont\s+know(s)?\b/gi, replacement: (_, p1) => `${p1} doesn't know`, message: 'Subject-verb agreement: use "doesn\'t know"', category: 'Grammar' },
  { pattern: /\b(he|she|it|that|this)\s+dont\b/gi, replacement: (_, p1) => `${p1} doesn't`, message: 'Subject-verb agreement: use "doesn\'t"', category: 'Grammar' },
  { pattern: /\b(he|she|it|that|this)\s+don't\s+knows\b/gi, replacement: (_, p1) => `${p1} doesn't know`, message: 'Subject-verb agreement: use "doesn\'t know"', category: 'Grammar' },
  { pattern: /\b(they|we|you)\s+doesn't\b/gi, replacement: (_, p1) => `${p1} don't`, message: 'Subject-verb agreement: use "don\'t"', category: 'Grammar' },
  { pattern: /\b(they|we|you)\s+was\b/gi, replacement: (_, p1) => `${p1} were`, message: 'Subject-verb agreement: use "were"', category: 'Grammar' },
  { pattern: /\b(he|she|it)\s+were\b/gi, replacement: (_, p1) => `${p1} was`, message: 'Subject-verb agreement: use "was"', category: 'Grammar' },
  { pattern: /\bdid\s+received\b/gi, replacement: 'did receive', message: 'Use base verb "receive" after "did"', category: 'Grammar' },
  { pattern: /\bdid\s+went\b/gi, replacement: 'did go', message: 'Use base verb "go" after "did"', category: 'Grammar' },
  { pattern: /\bdid\s+saw\b/gi, replacement: 'did see', message: 'Use base verb "see" after "did"', category: 'Grammar' },
  { pattern: /\bdid(n't|nt)\s+recieved\b/gi, replacement: "didn't receive", message: 'Use base verb "receive" after "didn\'t"', category: 'Grammar' },
  { pattern: /\bdid(n't|nt)\s+received\b/gi, replacement: "didn't receive", message: 'Use base verb "receive" after "didn\'t"', category: 'Grammar' },
  { pattern: /\bdid(n't|nt)\s+went\b/gi, replacement: "didn't go", message: 'Use base verb "go" after "didn\'t"', category: 'Grammar' },
  { pattern: /\bcould\s+of\b/gi, replacement: 'could have', message: 'Did you mean "could have"?', category: 'Grammar' },
  { pattern: /\bshould\s+of\b/gi, replacement: 'should have', message: 'Did you mean "should have"?', category: 'Grammar' },
  { pattern: /\bwould\s+of\b/gi, replacement: 'would have', message: 'Did you mean "would have"?', category: 'Grammar' },

  // 2. Confused Words & Homophones
  { pattern: /\bwhat\s+their\s+doing\b/gi, replacement: "what they're doing", message: 'Use "they\'re" (they are) instead of "their"', category: 'Grammar' },
  { pattern: /\btheir\s+is\b/gi, replacement: 'there is', message: 'Confused word: use "there is"', category: 'Grammar' },
  { pattern: /\btheir\s+are\b/gi, replacement: 'there are', message: 'Confused word: use "there are"', category: 'Grammar' },
  { pattern: /\btheir\s+was\b/gi, replacement: 'there was', message: 'Confused word: use "there was"', category: 'Grammar' },
  { pattern: /\btheir\s+were\b/gi, replacement: 'there were', message: 'Confused word: use "there were"', category: 'Grammar' },
  { pattern: /\byour\s+welcome\b/gi, replacement: "you're welcome", message: 'Use "you\'re welcome" (you are)', category: 'Grammar' },
  { pattern: /\byour\s+going\s+to\b/gi, replacement: "you're going to", message: 'Use "you\'re" instead of "your"', category: 'Grammar' },
  { pattern: /\bits\s+a\b/gi, replacement: "it's a", message: 'Use "it\'s a" (it is a)', category: 'Grammar' },
  { pattern: /\bits\s+been\b/gi, replacement: "it's been", message: 'Use "it\'s been"', category: 'Grammar' },
  { pattern: /\ba\s+lot\b/gi, replacement: 'a lot', message: 'Written as two words: "a lot"', category: 'Spelling' },
  { pattern: /\balot\b/gi, replacement: 'a lot', message: 'Misspelling: "alot" -> "a lot"', category: 'Spelling' },

  // 3. Common Contractions & Apostrophes
  { pattern: /\bdont\b/gi, replacement: "don't", message: 'Missing apostrophe in "don\'t"', category: 'Spelling' },
  { pattern: /\bcant\b/gi, replacement: "can't", message: 'Missing apostrophe in "can\'t"', category: 'Spelling' },
  { pattern: /\bwont\b/gi, replacement: "won't", message: 'Missing apostrophe in "won\'t"', category: 'Spelling' },
  { pattern: /\bisnt\b/gi, replacement: "isn't", message: 'Missing apostrophe in "isn\'t"', category: 'Spelling' },
  { pattern: /\barent\b/gi, replacement: "aren't", message: 'Missing apostrophe in "aren\'t"', category: 'Spelling' },
  { pattern: /\bwasnt\b/gi, replacement: "wasn't", message: 'Missing apostrophe in "wasn\'t"', category: 'Spelling' },
  { pattern: /\bwerent\b/gi, replacement: "weren't", message: 'Missing apostrophe in "weren\'t"', category: 'Spelling' },
  { pattern: /\bhasnt\b/gi, replacement: "hasn't", message: 'Missing apostrophe in "hasn\'t"', category: 'Spelling' },
  { pattern: /\bhavent\b/gi, replacement: "haven't", message: 'Missing apostrophe in "haven\'t"', category: 'Spelling' },
  { pattern: /\bhadnt\b/gi, replacement: "hadn't", message: 'Missing apostrophe in "hadn\'t"', category: 'Spelling' },
  { pattern: /\bdoesnt\b/gi, replacement: "doesn't", message: 'Missing apostrophe in "doesn\'t"', category: 'Spelling' },
  { pattern: /\bdidnt\b/gi, replacement: "didn't", message: 'Missing apostrophe in "didn\'t"', category: 'Spelling' },
  { pattern: /\bcouldnt\b/gi, replacement: "couldn't", message: 'Missing apostrophe in "couldn\'t"', category: 'Spelling' },
  { pattern: /\bshouldnt\b/gi, replacement: "shouldn't", message: 'Missing apostrophe in "shouldn\'t"', category: 'Spelling' },
  { pattern: /\bwouldnt\b/gi, replacement: "wouldn't", message: 'Missing apostrophe in "wouldn\'t"', category: 'Spelling' },
  { pattern: /\bi'm\b/gi, replacement: "I'm", message: 'Capitalize "I\'m"', category: 'Grammar' },
  { pattern: /\bi've\b/gi, replacement: "I've", message: 'Capitalize "I\'ve"', category: 'Grammar' },
  { pattern: /\bi'll\b/gi, replacement: "I'll", message: 'Capitalize "I\'ll"', category: 'Grammar' },
  { pattern: /\bi'd\b/gi, replacement: "I'd", message: 'Capitalize "I\'d"', category: 'Grammar' },

  // 4. Common Misspellings Dictionary
  { pattern: /\bteh\b/gi, replacement: 'the', message: 'Typo: "teh" -> "the"', category: 'Spelling' },
  { pattern: /\brecieved\b/gi, replacement: 'received', message: 'Typo: "recieved" -> "received"', category: 'Spelling' },
  { pattern: /\brecieve\b/gi, replacement: 'receive', message: 'Typo: "recieve" -> "receive"', category: 'Spelling' },
  { pattern: /\bseperate\b/gi, replacement: 'separate', message: 'Typo: "seperate" -> "separate"', category: 'Spelling' },
  { pattern: /\bseperated\b/gi, replacement: 'separated', message: 'Typo: "seperated" -> "separated"', category: 'Spelling' },
  { pattern: /\buntill\b/gi, replacement: 'until', message: 'Typo: "untill" -> "until"', category: 'Spelling' },
  { pattern: /\bdefinately\b/gi, replacement: 'definitely', message: 'Typo: "definately" -> "definitely"', category: 'Spelling' },
  { pattern: /\boccured\b/gi, replacement: 'occurred', message: 'Typo: "occured" -> "occurred"', category: 'Spelling' },
  { pattern: /\baccomodate\b/gi, replacement: 'accommodate', message: 'Typo: "accomodate" -> "accommodate"', category: 'Spelling' },
  { pattern: /\btommorow\b/gi, replacement: 'tomorrow', message: 'Typo: "tommorow" -> "tomorrow"', category: 'Spelling' },
  { pattern: /\bgovment\b/gi, replacement: 'government', message: 'Typo: "govment" -> "government"', category: 'Spelling' },
  { pattern: /\benviroment\b/gi, replacement: 'environment', message: 'Typo: "enviroment" -> "environment"', category: 'Spelling' },
  { pattern: /\bneccessary\b/gi, replacement: 'necessary', message: 'Typo: "neccessary" -> "necessary"', category: 'Spelling' },
  { pattern: /\bcalender\b/gi, replacement: 'calendar', message: 'Typo: "calender" -> "calendar"', category: 'Spelling' },
  { pattern: /\bprivelege\b/gi, replacement: 'privilege', message: 'Typo: "privelege" -> "privilege"', category: 'Spelling' },
  { pattern: /\bmaintainance\b/gi, replacement: 'maintenance', message: 'Typo: "maintainance" -> "maintenance"', category: 'Spelling' },

  // 5. Formatting, Punctuation & Capitalization
  {
    pattern: /(^|[.!?]\s+)([a-z])/g,
    replacement: (_, p1, p2) => p1 + p2.toUpperCase(),
    message: 'Capitalize the first letter of a sentence',
    category: 'Grammar',
  },
  {
    pattern: /\bi\b/g,
    replacement: 'I',
    message: 'Pronoun "I" should always be capitalized',
    category: 'Grammar',
  },
  { pattern: /\b(\w+)\s+\1\b/gi, replacement: '$1', message: 'Duplicated word removed', category: 'Redundancy' },
  { pattern: /\s{2,}/g, replacement: ' ', message: 'Multiple spaces collapsed', category: 'Punctuation' },
  { pattern: /(\w+)\s+([,\.!\?;:])/g, replacement: '$1$2', message: 'Remove space before punctuation', category: 'Punctuation' },
  { pattern: /([,\.!\?;:])([A-Za-z])/g, replacement: '$1 $2', message: 'Add space after punctuation', category: 'Punctuation' },
];

export function runLocalGrammarCheck(
  text: string,
  customRules?: CustomRule[]
): { correctedText: string; fixesCount: number; explanations: string[] } {
  if (!text) return { correctedText: '', fixesCount: 0, explanations: [] };

  let current = text;
  let fixesCount = 0;
  const explanations: string[] = [];

  // 1. Built-in rules
  for (const rule of LOCAL_GRAMMAR_RULES) {
    const before = current;
    if (typeof rule.replacement === 'string') {
      current = current.replace(rule.pattern, rule.replacement);
    } else {
      current = current.replace(rule.pattern, rule.replacement as any);
    }

    if (before !== current) {
      fixesCount++;
      if (!explanations.includes(rule.message)) {
        explanations.push(rule.message);
      }
    }
  }

  // 2. Custom User Rules
  if (customRules && customRules.length > 0) {
    for (const rule of customRules) {
      if (!rule.enabled || !rule.pattern) continue;
      try {
        const regex = new RegExp(rule.pattern, 'gi');
        const before = current;
        current = current.replace(regex, rule.replacement);
        if (before !== current) {
          fixesCount++;
          explanations.push(`Custom rule: "${rule.pattern}" -> "${rule.replacement}"`);
        }
      } catch (err) {
        console.warn('Invalid custom rule regex:', rule.pattern, err);
      }
    }
  }

  // Ensure trailing punctuation if it looks like a complete sentence
  if (current.length > 5 && !/[.!?]$/.test(current.trim())) {
    current = current.trim() + '.';
    fixesCount++;
  }

  return {
    correctedText: current,
    fixesCount,
    explanations,
  };
}

// ==========================================
// 2. OFFLINE PROMPT ENGINEERING BLUEPRINT ENGINE
// ==========================================

export function runLocalPromptEnhancement(rawText: string): string {
  const trimmed = rawText.trim();
  if (!trimmed) return rawText;

  // Detect domain context
  const isCoding = /\b(code|python|javascript|typescript|react|function|api|sql|html|css|rust|script|bug|fix|algorithm|class)\b/i.test(trimmed);
  const isWriting = /\b(email|blog|article|letter|essay|post|memo|summary|speech|story)\b/i.test(trimmed);

  if (isCoding) {
    return `### **Role & Persona**
Act as a Senior Principal Software Architect and Senior Engineer.

### **Core Objective**
Design and implement the following technical requirement:
> "${trimmed}"

### **Technical Requirements & Quality Standards**
- **Robustness**: Include error handling, boundary validation, and type safety.
- **Code Quality**: Write clean, modular, production-ready code with explanatory comments.
- **Performance**: Optimize time/space complexity and prevent memory leaks.
- **Modern Practices**: Use idiomatic patterns and current ecosystem standards.

### **Step-by-Step Execution Plan**
1. **Architecture Overview**: Briefly explain the technical strategy.
2. **Implementation**: Provide complete, copy-pasteable code blocks (no placeholders).
3. **Usage Example**: Show concrete invocation and expected output.
4. **Edge Cases**: Highlight potential pitfalls and how they are handled.

### **Output Format**
- Clean Markdown with properly tagged syntax-highlighted code blocks.`;
  }

  if (isWriting) {
    return `### **Role & Tone**
Act as an Executive Communications Strategist and Senior Editor.

### **Core Assignment**
Create a polished, compelling draft for:
> "${trimmed}"

### **Key Objectives & Guidelines**
- **Audience**: Professional, modern, and engaging.
- **Clarity**: Eliminate passive voice, fluff, and ambiguous phrasing.
- **Structure**: Use clear headings, bullet points, and actionable takeaways.

### **Deliverables**
1. **Headline / Subject Line**: 3 strong alternative options.
2. **Core Body**: The complete, finalized text ready to send or publish.
3. **Call-to-Action (CTA)**: Clear, unambiguous next steps.`;
  }

  // Universal Prompt Blueprint
  return `### **Role & Expertise**
Act as a world-class domain expert and strategic consultant.

### **Mission Objective**
Execute the following task with highest precision:
> "${trimmed}"

### **Context & Guidelines**
- Provide a comprehensive, accurate, and deeply actionable response.
- Back recommendations with clear reasoning and structured best practices.
- Ensure all key nuances and common edge cases are addressed.

### **Structured Deliverable**
1. **Core Solution**: Direct, immediate answer/solution to the primary request.
2. **Key Breakdown**: Step-by-Step guidance or structured component analysis.
3. **Best Practices & Next Steps**: Practical tips for maximum effectiveness.

### **Output Constraints**
- Format with crisp Markdown headings, bulleted lists, and bold highlights.
- Maintain an authoritative, direct, and structured tone.`;
}

// ==========================================
// 3. OFFLINE TONE SHIFTING ENGINE (INCL. ACCESSIBLE / PLAIN ENGLISH)
// ==========================================

export function runLocalToneShift(text: string, tone: ToneType, customRules?: CustomRule[]): string {
  const cleaned = runLocalGrammarCheck(text, customRules).correctedText;

  switch (tone) {
    case 'accessible':
      return cleaned
        .replace(/\butilize\b/gi, 'use')
        .replace(/\butilized\b/gi, 'used')
        .replace(/\butilization\b/gi, 'use')
        .replace(/\bleverage\b/gi, 'use')
        .replace(/\bcommence\b/gi, 'start')
        .replace(/\bcommenced\b/gi, 'started')
        .replace(/\bterminate\b/gi, 'end')
        .replace(/\bterminated\b/gi, 'ended')
        .replace(/\bin order to\b/gi, 'to')
        .replace(/\bsubsequent to\b/gi, 'after')
        .replace(/\bprior to\b/gi, 'before')
        .replace(/\bfacilitate\b/gi, 'help')
        .replace(/\bimplement\b/gi, 'set up')
        .replace(/\bimplemented\b/gi, 'set up')
        .replace(/\bdemonstrate\b/gi, 'show')
        .replace(/\bdemonstrates\b/gi, 'shows')
        .replace(/\bdemonstrated\b/gi, 'showed')
        .replace(/\bmethodology\b/gi, 'method')
        .replace(/\boptimal\b/gi, 'best')
        .replace(/\btransmit\b/gi, 'send')
        .replace(/\bdisseminate\b/gi, 'spread')
        .replace(/\bascertain\b/gi, 'find out')
        .replace(/\bconsequently\b/gi, 'so')
        .replace(/\bnevertheless\b/gi, 'however')
        .replace(/\bin the event that\b/gi, 'if')
        .replace(/\bwith regard to\b/gi, 'about')
        .replace(/\bfor the purpose of\b/gi, 'for');

    case 'professional':
      return cleaned
        .replace(/\b(gonna|wanna|gotta)\b/gi, (m) => m.toLowerCase() === 'gonna' ? 'going to' : m.toLowerCase() === 'wanna' ? 'want to' : 'have to')
        .replace(/\b(hey|hi)\b/gi, 'Dear recipient,')
        .replace(/\b(thanks|thx)\b/gi, 'Thank you for your consideration')
        .replace(/\b(asap)\b/gi, 'at your earliest convenience')
        .replace(/\b(can you)\b/gi, 'Could you please')
        .replace(/\b(I think)\b/gi, 'It is recommended that')
        .replace(/\b(bad)\b/gi, 'suboptimal')
        .replace(/\b(fix)\b/gi, 'resolve');

    case 'casual':
      return cleaned
        .replace(/\b(Dear recipient,|Greetings,)\b/gi, 'Hey!')
        .replace(/\b(at your earliest convenience)\b/gi, 'when you get a chance')
        .replace(/\b(Thank you for your consideration)\b/gi, 'Thanks a ton!')
        .replace(/\b(suboptimal)\b/gi, 'a bit rough')
        .replace(/\b(It is recommended that)\b/gi, 'I think we should')
        .replace(/\b(Could you please)\b/gi, 'Could you');

    case 'concise': {
      const lines = cleaned.split('\n').filter(Boolean);
      return lines
        .map((line) =>
          line
            .replace(/\b(in order to)\b/gi, 'to')
            .replace(/\b(due to the fact that)\b/gi, 'because')
            .replace(/\b(at this point in time)\b/gi, 'now')
            .replace(/\b(for the purpose of)\b/gi, 'for')
            .replace(/\b(it is important to note that)\b/gi, '')
            .replace(/\b(please feel free to)\b/gi, 'please')
            .replace(/\s{2,}/g, ' ')
            .trim()
        )
        .join('\n');
    }

    case 'academic':
      return cleaned
        .replace(/\b(a lot of)\b/gi, 'a substantial quantity of')
        .replace(/\b(showed)\b/gi, 'demonstrated')
        .replace(/\b(got)\b/gi, 'obtained')
        .replace(/\b(good)\b/gi, 'efficacious')
        .replace(/\b(make sure)\b/gi, 'ensure')
        .replace(/\b(look into)\b/gi, 'investigate');

    case 'persuasive':
      return cleaned
        .replace(/\b(can help)\b/gi, 'delivers immediate value')
        .replace(/\b(good)\b/gi, 'transformative')
        .replace(/\b(maybe we should)\b/gi, 'The optimal path is to')
        .replace(/\b(try to)\b/gi, 'guarantee');

    default:
      return cleaned;
  }
}

// ==========================================
// 4. OFFLINE SUMMARIZER (EXTRACTIVE NLP)
// ==========================================

export function runLocalSummarize(text: string): string {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  if (sentences.length <= 2) {
    return `### **Executive Summary**\n- ${text.trim()}`;
  }

  // Word frequency scoring
  const wordFreq: Record<string, number> = {};
  const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'it', 'of', 'or', 'with', 'as', 'by', 'that', 'this']);

  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  for (const w of words) {
    if (!stopWords.has(w)) {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    }
  }

  // Score sentences based on word prominence
  const scored = sentences.map((sentence) => {
    const sWords = sentence.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const score = sWords.reduce((acc, w) => acc + (wordFreq[w] || 0), 0);
    return { sentence, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const topSentences = scored.slice(0, Math.min(4, Math.ceil(sentences.length * 0.5)));

  return `### 📋 **Executive Summary & Key Takeaways**

${topSentences.map((s) => `- ${s.sentence}`).join('\n')}

---
*Generated locally via Dotty Offline NLP Engine (${sentences.length} sentences analyzed)*`;
}

// ==========================================
// 5. OFFLINE EXPANDER & ELABORATOR
// ==========================================

export function runLocalExpand(text: string, customRules?: CustomRule[]): string {
  const cleaned = runLocalGrammarCheck(text, customRules).correctedText;

  return `### 🔍 **Comprehensive Overview**
${cleaned}

### 💡 **Strategic Breakdown & Key Factors**
1. **Core Impact**: Delivers clear baseline functionality and establishes structured operational flow.
2. **Implementation Nuances**: Requires consideration of edge cases, responsive scaling, and resilient failovers.
3. **Verification & Metrics**: Monitor output consistency, throughput latency, and user feedback loops.

### 🎯 **Recommended Next Steps**
- Outline specific milestones and measurable deliverables.
- Validate assumptions with empirical test cases.`;
}
