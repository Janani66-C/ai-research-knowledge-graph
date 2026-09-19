import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface InitialResearchViewProps {
  onStartResearch: (topic: string) => void;
  isLoading: boolean;
}

export const InitialResearchView: React.FC<InitialResearchViewProps> = ({
  onStartResearch,
  isLoading,
}) => {
  const [topicInput, setTopicInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topicInput.trim() && !isLoading) {
      onStartResearch(topicInput.trim());
    }
  };

  return (
    <div className="flex-1 min-h-screen w-full flex flex-col items-center justify-center p-6 bg-white select-none">
      <div className="w-full max-w-xl mx-auto text-center space-y-6">
        {/* Title & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
            AI Research-to-Knowledge Graph Engine
          </h1>
          <p className="text-base text-slate-500 font-normal">
            Research any topic. Discover sources, insights and connections.
          </p>
        </div>

        {/* Large Simple Search Box */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative flex items-center bg-white border border-slate-300 hover:border-slate-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 rounded-full shadow-xs transition px-4 py-2.5">
            <input
              id="initial-research-input"
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="e.g. Artificial Intelligence in Agriculture"
              className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-sm md:text-base outline-none pr-3"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              disabled={!topicInput.trim() || isLoading}
              className="text-slate-400 hover:text-blue-600 disabled:opacity-40 disabled:hover:text-slate-400 transition p-1.5 shrink-0"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2.5 font-normal">
            Enter any research topic
          </p>
        </form>
      </div>
    </div>
  );
};
