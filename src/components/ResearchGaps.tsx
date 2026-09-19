import React from 'react';
import { ResearchGapItem } from '../types';
import { Compass, Lightbulb, AlertCircle, ArrowUpRight, CheckCircle } from 'lucide-react';

interface ResearchGapsProps {
  gaps: ResearchGapItem[];
  topic: string;
}

export const ResearchGaps: React.FC<ResearchGapsProps> = ({ gaps, topic }) => {
  if (gaps.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
        <Compass className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h3 className="font-semibold text-slate-700">No Research Gaps Synthesized</h3>
        <p className="text-xs text-slate-500 mt-1">Research gap analysis requires documented literature limitations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Compass className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">
            Identified Research Gaps & Open Scientific Horizons
          </h2>
        </div>
        <p className="text-xs text-slate-600">
          Rigorous distinction between limitations directly reported by authors versus systemic research gaps inferred by AI cross-analysis on {topic}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gaps.map((gap, idx) => {
          const isLiterature = gap.category === 'literature_limitation';

          return (
            <div
              key={gap.id || idx}
              id={`gap-card-${idx}`}
              className={`rounded-xl border p-5 flex flex-col justify-between transition ${
                isLiterature
                  ? 'bg-amber-50/40 border-amber-200 text-slate-900'
                  : 'bg-indigo-50/40 border-indigo-200 text-slate-900'
              }`}
            >
              <div>
                {/* Epistemic Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                      isLiterature
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-indigo-100 text-indigo-900 border-indigo-300'
                    }`}
                  >
                    {isLiterature ? (
                      <>
                        <AlertCircle className="w-3 h-3 text-amber-700" />
                        Researchers Identified Limitation
                      </>
                    ) : (
                      <>
                        <Lightbulb className="w-3 h-3 text-indigo-700" />
                        AI Inferred Research Gap
                      </>
                    )}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">#GAP-0{idx + 1}</span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mb-2 leading-snug">
                  {gap.gapTitle}
                </h3>

                <p className="text-xs text-slate-700 leading-relaxed mb-4">
                  {gap.description}
                </p>

                {/* Suggested Future Work */}
                {gap.suggestedFutureWork && (
                  <div className="bg-white/80 rounded-lg p-3 border border-slate-200/80 mb-3 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-900 mb-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                      <span>Recommended Experimental Agenda:</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {gap.suggestedFutureWork}
                    </p>
                  </div>
                )}
              </div>

              {/* Supporting Citations */}
              <div className="pt-2.5 border-t border-slate-200/60 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700 block mb-1">Cited in Literature:</span>
                <ul className="space-y-0.5">
                  {gap.supportingSources.map((s, i) => (
                    <li key={i} className="truncate">
                      &bull; {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
