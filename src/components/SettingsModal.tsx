import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Sliders, 
  Cpu, 
  Type, 
  Keyboard, 
  Check, 
  RefreshCw, 
  Key, 
  ShieldCheck,
  Plus,
  Trash2,
  BookOpen,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AppSettings, AIProvider, CustomRule } from '../types';
import { checkOllamaConnection } from '../services/ollama';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings: initialSettings,
  onSave,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'rules' | 'dot' | 'editor' | 'shortcuts'>('ai');
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [ollamaStatus, setOllamaStatus] = useState<{ testing: boolean; message?: string; success?: boolean; models?: string[] }>({
    testing: false,
  });

  // Custom rules draft inputs
  const [newRulePattern, setNewRulePattern] = useState('');
  const [newRuleReplacement, setNewRuleReplacement] = useState('');

  if (!isOpen) return null;

  const handleTestOllama = async () => {
    setOllamaStatus({ testing: true });
    const result = await checkOllamaConnection(settings.ai.ollamaUrl);
    if (result.connected) {
      setOllamaStatus({
        testing: false,
        success: true,
        models: result.models,
        message: `Connected! Found ${result.models.length} model(s): ${result.models.slice(0, 3).join(', ')}${result.models.length > 3 ? '...' : ''}`,
      });
      if (result.models.length > 0 && !result.models.includes(settings.ai.ollamaModel)) {
        setSettings((prev) => ({
          ...prev,
          ai: { ...prev.ai, ollamaModel: result.models[0] },
        }));
      }
    } else {
      setOllamaStatus({
        testing: false,
        success: false,
        message: result.error || 'Failed to connect. Is Ollama running on localhost:11434?',
      });
    }
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRulePattern.trim()) return;

    const newRule: CustomRule = {
      id: `rule-${Date.now()}`,
      pattern: newRulePattern.trim(),
      replacement: newRuleReplacement,
      enabled: true,
    };

    setSettings((prev) => ({
      ...prev,
      customRules: [...(prev.customRules || []), newRule],
    }));

    setNewRulePattern('');
    setNewRuleReplacement('');
  };

  const handleToggleRule = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      customRules: (prev.customRules || []).map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    }));
  };

  const handleDeleteRule = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      customRules: (prev.customRules || []).filter((r) => r.id !== id),
    }));
  };

  const handleSaveAndClose = () => {
    onSave(settings);
    onClose();
  };

  const COLOR_PRESETS = [
    { label: 'Sky Blue', value: '#38bdf8' },
    { label: 'Indigo / Purple', value: '#818cf8' },
    { label: 'Neon Emerald', value: '#34d399' },
    { label: 'Sunset Rose', value: '#fb7185' },
    { label: 'Electric Amber', value: '#fbbf24' },
    { label: 'Cyber Violet', value: '#c084fc' },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-slate-100 animate-pop-in">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-800/70 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Dotty Preferences</h2>
              <p className="text-xs text-slate-400">Configure 100% local AI backends, custom grammar rules, and dot styling</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === 'ai'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>AI & Engines</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === 'rules'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Custom Rules ({settings.customRules?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('dot')}
            className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === 'dot'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Caret Dot & Visuals</span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === 'editor'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === 'shortcuts'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Shortcuts</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* TAB 1: AI & Engines */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              {/* Privacy Banner */}
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-emerald-200">100% Privacy Guarantee:</span>
                  <span className="text-emerald-300/80 ml-1">
                    By default, all text analysis runs locally on your machine. Zero keystrokes or data leave your computer.
                  </span>
                </div>
              </div>

              {/* Active Providers Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Grammar Correction Engine
                  </label>
                  <select
                    value={settings.ai.activeGrammarProvider}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ai: { ...settings.ai, activeGrammarProvider: e.target.value as AIProvider },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="smart-fallback">🔒 Local Offline Engine (Default, Zero Network)</option>
                    <option value="ollama">🔒 Local Ollama LLM (Offline Machine Neural Model)</option>
                    <option value="languagetool">LanguageTool Public API</option>
                    <option value="gemini">Google Gemini (Cloud BYOK)</option>
                    <option value="openai">OpenAI GPT-4o (Cloud BYOK)</option>
                    <option value="claude">Anthropic Claude (Cloud BYOK)</option>
                    <option value="groq">Groq Llama 3 (Cloud BYOK)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Prompt Enhancement Engine
                  </label>
                  <select
                    value={settings.ai.activePromptProvider}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        ai: { ...settings.ai, activePromptProvider: e.target.value as AIProvider },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="smart-fallback">🔒 Local Prompt Blueprint Engine (Default, Zero Network)</option>
                    <option value="ollama">🔒 Local Ollama LLM (Offline Machine Neural Model)</option>
                    <option value="gemini">Google Gemini (Cloud BYOK)</option>
                    <option value="openai">OpenAI GPT-4o (Cloud BYOK)</option>
                    <option value="claude">Anthropic Claude (Cloud BYOK)</option>
                    <option value="groq">Groq Llama 3 (Cloud BYOK)</option>
                  </select>
                </div>
              </div>

              {/* Status Indicators List */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="text-xs font-semibold text-slate-300 mb-2">Engine Status & Readiness</div>
                
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-medium text-slate-200">Local Embedded NLP Engine</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">
                    Active & Ready (Offline)
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${ollamaStatus.success ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    <span className="font-medium text-slate-200">Local Ollama LLM</span>
                  </div>
                  <button
                    onClick={handleTestOllama}
                    disabled={ollamaStatus.testing}
                    className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20"
                  >
                    <RefreshCw className={`w-3 h-3 ${ollamaStatus.testing ? 'animate-spin' : ''}`} />
                    <span>{ollamaStatus.success ? 'Connected' : 'Check Local Connection'}</span>
                  </button>
                </div>
              </div>

              {/* Ollama Configuration */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-semibold text-slate-200">Local Ollama Configuration</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Server URL</label>
                    <input
                      type="text"
                      value={settings.ai.ollamaUrl}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          ai: { ...settings.ai, ollamaUrl: e.target.value },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Model Name</label>
                    <input
                      type="text"
                      value={settings.ai.ollamaModel}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          ai: { ...settings.ai, ollamaModel: e.target.value },
                        })
                      }
                      placeholder="llama3, mistral, gemma2, etc."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {ollamaStatus.message && (
                  <div
                    className={`text-[11px] p-2 rounded-lg ${
                      ollamaStatus.success
                        ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950/50 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {ollamaStatus.message}
                  </div>
                )}
              </div>

              {/* Cloud BYOK Keys */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-slate-200">Optional Cloud API Keys</span>
                </div>

                {/* Gemini */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Google Gemini Key</label>
                    <input
                      type="password"
                      value={settings.ai.geminiKey}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          ai: { ...settings.ai, geminiKey: e.target.value },
                        })
                      }
                      placeholder="AIzaSy..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">OpenAI Key</label>
                    <input
                      type="password"
                      value={settings.ai.openaiKey}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          ai: { ...settings.ai, openaiKey: e.target.value },
                        })
                      }
                      placeholder="sk-..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Custom Rules */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div className="text-xs text-slate-400">
                Define your own custom auto-corrections and word replacements. Dotty applies these locally alongside the built-in grammar rules.
              </div>

              {/* Add New Rule Form */}
              <form onSubmit={handleAddRule} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-200">Add New Rule</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Find Word / Regex</label>
                    <input
                      type="text"
                      value={newRulePattern}
                      onChange={(e) => setNewRulePattern(e.target.value)}
                      placeholder="e.g. \bteh\b or utilize"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Replace With</label>
                    <input
                      type="text"
                      value={newRuleReplacement}
                      onChange={(e) => setNewRuleReplacement(e.target.value)}
                      placeholder="e.g. the or use"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!newRulePattern.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Rule</span>
                </button>
              </form>

              {/* Rules List */}
              <div className="space-y-2">
                {(settings.customRules || []).length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/80">
                    No custom rules defined yet. Add your first rule above!
                  </div>
                ) : (
                  (settings.customRules || []).map((rule) => (
                    <div
                      key={rule.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0 font-mono">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={() => handleToggleRule(rule.id)}
                          className="w-4 h-4 rounded border-slate-700 text-sky-500 focus:ring-sky-500 bg-slate-800"
                        />
                        <span className="text-rose-300 truncate max-w-[140px]">{rule.pattern}</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-emerald-300 truncate max-w-[140px]">{rule.replacement || '""'}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Caret Dot & Visuals */}
          {activeTab === 'dot' && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Dot Accent Color</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          dot: { ...settings.dot, color: preset.value },
                        })
                      }
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium transition-all ${
                        settings.dot.color === preset.value
                          ? 'border-sky-400 bg-slate-800'
                          : 'border-slate-800 bg-slate-950 hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: preset.value }} />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Dot Diameter</span>
                    <span className="font-mono text-sky-400">{settings.dot.size}px</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="20"
                    value={settings.dot.size}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        dot: { ...settings.dot, size: parseInt(e.target.value) },
                      })
                    }
                    className="w-full accent-sky-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Glow Effect</span>
                    <span className="capitalize font-mono text-sky-400">{settings.dot.glowIntensity}</span>
                  </div>
                  <select
                    value={settings.dot.glowIntensity}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        dot: { ...settings.dot, glowIntensity: e.target.value as any },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="none">None</option>
                    <option value="subtle">Subtle Glow</option>
                    <option value="vibrant">Vibrant Neon</option>
                  </select>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-0.5">Live Dot Preview</div>
                  <div className="text-[11px] text-slate-500">How Dotty looks next to your cursor</div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-300 font-mono">Typing sample text...</span>
                  <div
                    className="rounded-full animate-pulse-subtle"
                    style={{
                      width: `${settings.dot.size}px`,
                      height: `${settings.dot.size}px`,
                      backgroundColor: settings.dot.color,
                      boxShadow: settings.dot.glowIntensity === 'vibrant'
                        ? `0 0 14px 2px ${settings.dot.color}`
                        : settings.dot.glowIntensity === 'subtle'
                        ? `0 0 6px 1px ${settings.dot.color}`
                        : 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Editor */}
          {activeTab === 'editor' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Editor Typography</label>
                  <select
                    value={settings.editor.fontFamily}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        editor: { ...settings.editor, fontFamily: e.target.value as any },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="sans">System Sans-Serif (Default Modern)</option>
                    <option value="mono">Monospace (Code & Developers)</option>
                    <option value="serif">Serif (Literary / Classic)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                    <span>Font Size</span>
                    <span className="font-mono text-sky-400">{settings.editor.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={settings.editor.fontSize}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        editor: { ...settings.editor, fontSize: parseInt(e.target.value) },
                      })
                    }
                    className="w-full accent-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Line Numbers</div>
                    <div className="text-[10px] text-slate-400">Display gutter line numbers on the left</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.editor.lineNumbers}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        editor: { ...settings.editor, lineNumbers: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded border-slate-700 text-sky-500 focus:ring-sky-500 bg-slate-800"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 5: Shortcuts */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 mb-2">
                Quickly trigger Dotty actions anywhere inside the editor:
              </div>

              {[
                { action: 'Open Dotty Menu', key: 'Ctrl + Shift + Space' },
                { action: 'Fix Grammar & Spelling', key: 'Ctrl + Shift + G  or  Ctrl + Alt + G' },
                { action: 'Enhance Prompt', key: 'Ctrl + Shift + P  or  Ctrl + Alt + E' },
                { action: 'Quick Save Document', key: 'Ctrl + S' },
                { action: 'Undo Last Action', key: 'Ctrl + Z' },
                { action: 'Redo Action', key: 'Ctrl + Y  or  Ctrl + Shift + Z' },
                { action: 'Focus App Window', key: 'Alt + Space (Global)' },
                { action: 'Close Popup / Modal', key: 'Escape' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                >
                  <span className="text-xs font-medium text-slate-200">{item.action}</span>
                  <kbd className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg font-mono text-sky-300 shadow-sm">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAndClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/25 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
