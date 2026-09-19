import React, { useState } from 'react';
import { Search, Sparkles, ArrowRight, BookOpen, Layers } from 'lucide-react';

interface SearchHeaderProps {
  onStartResearch: (topic: string) => void;
  isLoading: boolean;
  currentTopic?: string;
}

const QUICK_TOPICS = [
  'Artificial Intelligence in Agriculture',
  'Quantum Computing in Drug Discovery',
  'Cybersecurity in Healthcare',
  'Climate Change & Direct Air Carbon Capture',
  'Brain-Computer Interfaces in Neuro-Rehabilitation',
  'CRISPR Gene Editing for Rare Diseases',
  'Solid-State Batteries for Electric Vehicles',
  'Autonomous Robotics in Deep Sea Exploration',
];

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  onStartResearch,
  isLoading,
  currentTopic = '',
}) => {
  const [topicInput, setTopicInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topicInput.trim() && !isLoading) {
      onStartResearch(topicInput.trim());
    }
  };

  const handleChipClick = (t: string) => {
    setTopicInput(t);
    if (!isLoading) {
      onStartResearch(t);
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white border-b border-slate-800 py-8 px-4 sm:px-6 shadow-md">
      <div className="max-w-5xl mx-auto text-center space-y-4">
        {/* Badge & Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Dynamic Autonomous Synthesis Engine</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
          AI Research-to-Knowledge Graph Engine
        </h1>

        <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Input <span className="font-semibold text-white">any scientific or domain research topic</span>. The engine queries live academic repositories (arXiv, CrossRef), extracts domain ontologies, constructs an interactive knowledge graph, maps chronological milestones, and detects opposing scientific claims.
        </p>

        {/* Main Search Input Form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mt-6">
          <div className="relative flex items-center bg-slate-800/90 border border-slate-700 rounded-2xl shadow-xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition">
            <Search className="w-5 h-5 text-slate-400 ml-3.5 shrink-0" />
            <input
              id="main-research-input"
              type="text"
              placeholder="Enter any research topic (e.g. Quantum Computing, Climate Change, Oncology)..."
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              disabled={isLoading}
              className="w-full bg-transparent text-slate-100 placeholder-slate-400 text-sm sm:text-base px-3 py-2 focus:outline-none"
            />
            <button
              id="start-research-btn"
              type="submit"
              disabled={isLoading || !topicInput.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-sm shrink-0"
            >
              <span>{isLoading ? 'Researching...' : 'Build Knowledge Graph'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick Topic Demo Chips */}
        <div className="pt-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Try any research domain dynamically:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            {QUICK_TOPICS.map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(t)}
                disabled={isLoading}
                className="text-[11px] px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
