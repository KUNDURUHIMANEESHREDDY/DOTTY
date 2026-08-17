import React from 'react';
import { X, Sparkles, Code, Mail, BookOpen, Lightbulb, FileText, ArrowUpRight } from 'lucide-react';

interface QuickTemplatesModalProps {
  isOpen: boolean;
  onSelectTemplate: (templateContent: string) => void;
  onClose: () => void;
}

const TEMPLATES = [
  {
    category: 'Coding & Architecture',
    icon: <Code className="w-4 h-4 text-sky-400" />,
    title: 'Code Refactoring & Optimization',
    prompt: `Analyze the following code for performance bottlenecks, readability, and modern idioms.
Provide:
1. Refactored code with explanatory comments.
2. Summary of key optimizations.
3. Edge case considerations.

Code:
\`\`\`typescript
// Paste your code here
\`\`\``,
  },
  {
    category: 'Coding & Architecture',
    icon: <Code className="w-4 h-4 text-sky-400" />,
    title: 'Technical Design / RFC Outline',
    prompt: `# RFC: [Feature / Architecture Name]

## 1. Problem Statement & Motivation
[Describe the core issue and why it needs solving]

## 2. Proposed Architecture & Data Flow
[Detailed technical solution and component diagram]

## 3. API Design & Interfaces
\`\`\`typescript
// Type signatures and contracts
\`\`\`

## 4. Alternative Approaches Considered
- Approach A (pros/cons)
- Approach B (pros/cons)

## 5. Security & Performance Implications`,
  },
  {
    category: 'Professional Writing',
    icon: <Mail className="w-4 h-4 text-emerald-400" />,
    title: 'Executive Update / Memo',
    prompt: `**To:** Leadership Team
**From:** [Your Name / Team]
**Date:** ${new Date().toISOString().split('T')[0]}
**Subject:** Monthly Progress & Strategic Milestone Update

### 🚀 Key Highlights
- Delivered primary milestone ahead of schedule with 99.9% uptime.
- Reduced latency by 35% through query optimization.

### 📊 Metric Overview
- Metric A: +24% YoY
- Metric B: -12% error rate

### ⚠️ Blockers & Risks
- Dependency on external third-party API resolution.

### 🎯 Next Steps
1. Initiate Phase 2 user testing.
2. Complete security audit.`,
  },
  {
    category: 'Prompt Engineering',
    icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    title: 'Master LLM System Prompt Framework',
    prompt: `You are an elite expert specializing in [Domain / Specialty].

### **Objective**
Your goal is to [Specific Objective] with maximum precision.

### **Context & Input Specifications**
- Input: [Data / Questions / Scenario]
- Target Audience: [Target Users / Engineers]

### **Constraints & Directives**
- Be concise, direct, and authoritative.
- Never make up information; state unknowns clearly.
- Follow modern industry best practices.

### **Output Format**
- Respond with clear Markdown sections and code snippets.`,
  },
  {
    category: 'Content & Strategy',
    icon: <FileText className="w-4 h-4 text-amber-400" />,
    title: 'Engaging Technical Blog Post Outline',
    prompt: `# [Compelling Title: How We Solved X with Y]

## Introduction & The Hook
- What was the challenge?
- Why do conventional solutions fail?

## The Architecture
- How does the solution work under the hood?
- Diagram / Code snippet.

## Real-world Benchmarks & Lessons Learned
- Quantitative comparison.
- What surprised us during implementation.

## Conclusion & Resources
- Link to GitHub repository.`,
  },
];

export const QuickTemplatesModal: React.FC<QuickTemplatesModalProps> = ({
  isOpen,
  onSelectTemplate,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-100 animate-pop-in">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/70 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Prompt & Writing Templates</h2>
              <p className="text-xs text-slate-400">Instant jumpstart templates for coding, prompt engineering, and writing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Cards */}
        <div className="p-6 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEMPLATES.map((tpl, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-slate-800">{tpl.icon}</div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {tpl.category}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-200 group-hover:text-sky-300 transition-colors">
                  {tpl.title}
                </h3>
                <p className="text-xs text-slate-400 font-mono line-clamp-3 mt-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                  {tpl.prompt}
                </p>
              </div>

              <button
                onClick={() => {
                  onSelectTemplate(tpl.prompt);
                  onClose();
                }}
                className="mt-4 w-full py-1.5 px-3 bg-slate-800 hover:bg-sky-500 hover:text-white text-slate-200 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-700 hover:border-transparent"
              >
                <span>Use Template</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
