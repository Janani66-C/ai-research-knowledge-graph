import React, { useState } from 'react';
import { ResearchSource, DocumentSummary } from '../types';
import { Columns, Check, ExternalLink, SlidersHorizontal, BookOpen } from 'lucide-react';

interface SourceComparisonProps {
  sources: ResearchSource[];
  summaries: DocumentSummary[];
}

export const SourceComparison: React.FC<SourceComparisonProps> = ({ sources, summaries }) => {
  // Select up to 3 sources for side-by-side comparison
  const [selectedIds, setSelectedIds] = useState<string[]>(
    sources.slice(0, 2).map((s) => s.id)
  );

  const toggleSourceSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter((item) => item !== id));
      }
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds([...selectedIds, id]);
      } else {
        // Replace oldest
        setSelectedIds([...selectedIds.slice(1), id]);
      }
    }
  };

  const comparedSources = sources.filter((s) => selectedIds.includes(s.id));

  return (
    <div className="space-y-5">
      {/* Source Selector Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Select Papers to Compare (2 - 3 sources)</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {selectedIds.length} of 3 selected
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {sources.map((s) => {
            const isSelected = selectedIds.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggleSourceSelection(s.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                <span className="max-w-[200px] truncate">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-40">
                Criterion
              </th>
              {comparedSources.map((src) => (
                <th key={src.id} className="p-4 text-xs font-bold text-slate-900 border-l border-slate-200 min-w-[260px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-semibold">
                      {src.sourceName}
                    </span>
                    <span className="text-[11px] text-slate-500">{src.publicationDate}</span>
                  </div>
                  <div className="line-clamp-2 text-sm text-slate-900 font-bold mb-1.5">{src.title}</div>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <span>View Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {/* Main Topic & Objective */}
            <tr>
              <td className="p-4 font-bold text-slate-900 bg-slate-50/40">
                Main Research Objective
              </td>
              {comparedSources.map((src) => {
                const summary = summaries.find((s) => s.docId === src.id);
                return (
                  <td key={src.id} className="p-4 border-l border-slate-200 leading-relaxed align-top">
                    {summary?.keyIdea || src.abstract}
                  </td>
                );
              })}
            </tr>

            {/* Methodology & Approach */}
            <tr>
              <td className="p-4 font-bold text-slate-900 bg-slate-50/40">
                Methodology / Approach
              </td>
              {comparedSources.map((src) => {
                const summary = summaries.find((s) => s.docId === src.id);
                return (
                  <td key={src.id} className="p-4 border-l border-slate-200 leading-relaxed align-top">
                    {summary?.methodApproach || 'Empirical benchmark and dataset validation.'}
                  </td>
                );
              })}
            </tr>

            {/* Key Findings */}
            <tr>
              <td className="p-4 font-bold text-slate-900 bg-slate-50/40">
                Key Findings
              </td>
              {comparedSources.map((src) => {
                const summary = summaries.find((s) => s.docId === src.id);
                return (
                  <td key={src.id} className="p-4 border-l border-slate-200 align-top">
                    <ul className="space-y-1.5">
                      {(summary?.importantFindings || [src.abstract.substring(0, 150)]).map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-blue-500 font-bold">&bull;</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                );
              })}
            </tr>

            {/* Empirical Evidence */}
            <tr>
              <td className="p-4 font-bold text-slate-900 bg-slate-50/40">
                Empirical Evidence
              </td>
              {comparedSources.map((src) => {
                const summary = summaries.find((s) => s.docId === src.id);
                return (
                  <td key={src.id} className="p-4 border-l border-slate-200 align-top">
                    <ul className="space-y-1 font-mono text-[11px] text-slate-600">
                      {(summary?.keyEvidence || ['Verified across standard operational testbeds']).map((e, i) => (
                        <li key={i} className="bg-slate-50 p-1.5 rounded border border-slate-100">
                          {e}
                        </li>
                      ))}
                    </ul>
                  </td>
                );
              })}
            </tr>

            {/* Limitations */}
            <tr>
              <td className="p-4 font-bold text-amber-800 bg-slate-50/40">
                Limitations Reported
              </td>
              {comparedSources.map((src) => {
                const summary = summaries.find((s) => s.docId === src.id);
                return (
                  <td key={src.id} className="p-4 border-l border-slate-200 align-top">
                    <ul className="space-y-1 text-amber-900">
                      {(summary?.limitations || ['Specific parameter boundaries observed']).map((l, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">&bull;</span>
                          <span>{l}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                );
              })}
            </tr>

            {/* Conclusion */}
            <tr>
              <td className="p-4 font-bold text-slate-900 bg-slate-50/40">
                Conclusions
              </td>
              {comparedSources.map((src) => {
                const summary = summaries.find((s) => s.docId === src.id);
                return (
                  <td key={src.id} className="p-4 border-l border-slate-200 leading-relaxed align-top">
                    {summary?.conclusion || 'Research demonstrates measurable impact within the tested domain.'}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
