import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  savedProjectsCount: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, savedProjectsCount }) => {
  const [health, setHealth] = useState<{
    status: string;
    ollamaConfigured?: boolean;
    ollamaReachable?: boolean;
    model?: string;
    hasGeminiKey?: boolean;
  } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth({ status: 'offline' }));
  }, []);

  const engineLabel = health?.ollamaConfigured
    ? `Ollama (${health.model || 'llama3.2:3b'}) ${health.ollamaReachable ? '• Online' : '• Connecting...'}`
    : health?.hasGeminiKey
    ? 'Gemini 2.5 Flash'
    : 'Standard Synthesizer';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-lg max-w-sm w-full overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-600">
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span>AI Model Engine</span>
            <span className="font-medium text-slate-900">
              {engineLabel}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span>Saved Projects</span>
            <span className="font-medium text-slate-900">{savedProjectsCount}</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span>Literature Sources</span>
            <span className="font-medium text-slate-900">Open Academic APIs</span>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
