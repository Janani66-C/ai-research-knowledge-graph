import React, { useState, useRef, useEffect } from 'react';
import { AskResearchResponse } from '../types';
import { ArrowUp, Loader2, ArrowLeft } from 'lucide-react';

interface ResearchChatProps {
  projectId: string;
  topic: string;
  onBack?: () => void;
  initialQuestion?: string;
  onClearInitialQuestion?: () => void;
}

interface MessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  data?: AskResearchResponse;
}

export const ResearchChat: React.FC<ResearchChatProps> = ({
  projectId,
  topic,
  onBack,
  initialQuestion,
  onClearInitialQuestion,
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleAsk = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || loading) return;

    const userMessage: MessageItem = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: q,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, question: q }),
      });

      if (!res.ok) {
        throw new Error('Could not retrieve answer from research corpus');
      }

      const data: AskResearchResponse = await res.json();
      const assistantMessage: MessageItem = {
        id: 'ai-' + Date.now(),
        sender: 'assistant',
        text: data.answer,
        data,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'assistant',
          text: 'Unable to analyze literature query right now. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // If initialQuestion is passed on mount
  useEffect(() => {
    if (initialQuestion && initialQuestion.trim()) {
      handleAsk(initialQuestion);
      if (onClearInitialQuestion) onClearInitialQuestion();
    }
  }, [initialQuestion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputQuery.trim()) {
      handleAsk(inputQuery);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-180px)] py-2">
      {/* Top Bar with Back Button */}
      {onBack && (
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between shrink-0">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to overview</span>
          </button>
          <span className="text-xs text-slate-400">
            AI Research Assistant
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        {messages.length === 0 && !loading && (
          <div className="text-center py-16 space-y-2 text-slate-400">
            <p className="text-sm text-slate-600 font-medium">
              Ask any question about this research
            </p>
            <p className="text-xs">
              Answers are grounded directly in the collected literature on {topic}.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-slate-900 text-white font-normal'
                  : 'bg-slate-50 border border-slate-200 text-slate-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>

              {/* Supporting Citations if present */}
              {m.data?.citedSources && m.data.citedSources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-xs text-slate-500 space-y-1">
                  <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                    Referenced Sources:
                  </div>
                  {m.data.citedSources.slice(0, 3).map((src, i) => (
                    <div key={i} className="line-clamp-1 italic">
                      • {src.sourceTitle}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Analyzing research corpus...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="pt-2 shrink-0">
        <div className="relative flex items-center bg-white border border-slate-200 focus-within:border-slate-400 rounded-full px-4 py-2 shadow-xs transition">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask something about this research..."
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none pr-3"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || loading}
            className="p-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-30 transition shrink-0"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
