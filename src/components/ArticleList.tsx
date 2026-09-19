import React, { useState, useMemo } from 'react';
import { ResearchSource, DocumentSummary } from '../types';
import { ExternalLink, Check, Search, Columns, ArrowLeft, X } from 'lucide-react';

interface ArticleListProps {
  sources: ResearchSource[];
  summaries: DocumentSummary[];
}

export const ArticleList: React.FC<ArticleListProps> = ({ sources, summaries }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  // Summary map by title or id
  const summaryMap = useMemo(() => {
    const map = new Map<string, DocumentSummary>();
    summaries.forEach((s) => {
      if (s.docId) map.set(s.docId, s);
      if (s.docTitle) map.set(s.docTitle.toLowerCase(), s);
    });
    return map;
  }, [summaries]);

  const filteredSources = useMemo(() => {
    if (!searchTerm.trim()) return sources;
    const q = searchTerm.toLowerCase();
    return sources.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.sourceName.toLowerCase().includes(q) ||
        s.authors.some((a) => a.toLowerCase().includes(q))
    );
  }, [sources, searchTerm]);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const comparedSources = sources.filter((s) => selectedIds.includes(s.id));

  // If comparing, show side-by-side comparison view
  if (isComparing && comparedSources.length >= 2) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 py-2">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <button
            onClick={() => setIsComparing(false)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to all sources</span>
          </button>
          <span className="text-xs text-slate-500">
            Comparing {comparedSources.length} sources
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comparedSources.map((source) => {
            const summary =
              summaryMap.get(source.id) || summaryMap.get(source.title.toLowerCase());
            return (
              <div
                key={source.id}
                className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 text-xs"
              >
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 leading-snug">
                    {source.title}
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {source.sourceName} • {source.publicationDate}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                    Methodology
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    {summary?.methodApproach || source.abstract.slice(0, 150) + '...'}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                    Key Findings
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    {summary?.keyIdea || 'Empirical findings extracted from published source.'}
                  </p>
                </div>

                {summary?.conclusion && (
                  <div>
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                      Conclusion
                    </span>
                    <p className="text-slate-700 leading-relaxed">{summary.conclusion}</p>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <span>Read Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2">
      {/* Header with Search and Comparison Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter sources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-blue-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        {selectedIds.length >= 2 ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsComparing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Compare Selected ({selectedIds.length})</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400">
            Select 2 or 3 sources to compare
          </span>
        )}
      </div>

      {/* Clean List of Articles */}
      <div className="space-y-4">
        {filteredSources.map((source) => {
          const isSelected = selectedIds.includes(source.id);
          const summary =
            summaryMap.get(source.id) || summaryMap.get(source.title.toLowerCase());
          const shortSummary =
            summary?.keyIdea ||
            source.abstract.slice(0, 220) + (source.abstract.length > 220 ? '...' : '');

          return (
            <article
              key={source.id}
              className={`p-4 rounded-lg border transition ${
                isSelected
                  ? 'border-blue-400 bg-blue-50/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  {/* Article title */}
                  <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                    {source.title}
                  </h3>

                  {/* Source • Date */}
                  <div className="text-xs text-slate-400">
                    {source.sourceName} • {source.publicationDate}
                  </div>

                  {/* Short AI summary */}
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    {shortSummary}
                  </p>

                  {/* [Read Source] link */}
                  <div className="pt-2 flex items-center gap-4">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                    >
                      <span>Read Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Compare Checkbox */}
                <button
                  onClick={() => toggleSelect(source.id)}
                  className={`p-1.5 rounded border transition shrink-0 mt-1 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-300 hover:border-slate-400 text-transparent'
                  }`}
                  title={isSelected ? 'Remove from comparison' : 'Select to compare'}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
