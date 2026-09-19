import React, { useState } from 'react';
import { ContradictionItem } from '../types';
import { AlertTriangle, Scale, ExternalLink, ChevronRight, CheckCircle2 } from 'lucide-react';

interface ContradictionDetectorProps {
  contradictions: ContradictionItem[];
}

export const ContradictionDetector: React.FC<ContradictionDetectorProps> = ({ contradictions }) => {
  const [selectedContradiction, setSelectedContradiction] = useState<ContradictionItem | null>(
    contradictions.length > 0 ? contradictions[0] : null
  );

  if (contradictions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs max-w-2xl mx-auto">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 text-lg">No Disagreements Detected</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          The collected empirical literature displays strong consensus across primary claims, experimental methods, and
          observed outcomes.
        </p>
      </div>
    );
  }

  // Safe accessor helper for claim shapes
  const getClaimDetails = (c: any, side: 'A' | 'B') => {
    const claimObj = side === 'A' ? c.claimA : c.claimB;
    const directStatement = typeof claimObj === 'string' ? claimObj : claimObj?.statement;
    const directEvidence = typeof (side === 'A' ? c.evidenceA : c.evidenceB) === 'string'
      ? (side === 'A' ? c.evidenceA : c.evidenceB)
      : claimObj?.evidenceSnippet;
    const directSourceTitle = (side === 'A' ? c.sourceATitle : c.sourceBTitle) || claimObj?.sourceTitle;

    return {
      statement: directStatement || 'Empirical finding documented in literature.',
      evidence: directEvidence || 'Direct excerpt from author testing results.',
      sourceTitle: directSourceTitle || `Supporting Academic Source ${side}`,
    };
  };

  const selectedA = selectedContradiction ? getClaimDetails(selectedContradiction, 'A') : null;
  const selectedB = selectedContradiction ? getClaimDetails(selectedContradiction, 'B') : null;
  const neutralAnalysis = selectedContradiction
    ? (selectedContradiction as any).neutralAnalysis || (selectedContradiction as any).analysis
    : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Prominent Notice with required verbatim text */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 md:p-6 shadow-xs flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-extrabold text-base text-amber-950">
              Potential Disagreement Detected
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
              {contradictions.length} Found
            </span>
          </div>
          <p className="text-xs md:text-sm text-amber-900/90 leading-relaxed">
            The engine identified divergent claims or opposing empirical results between sources in this research corpus.
            The system remains epistemically neutral and <strong>never automatically declares which source is correct</strong>.
            Review the side-by-side claims and extracted evidence below.
          </p>
        </div>
      </div>

      {/* Disagreements Grid: Selector list + Detailed Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left selector column */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Detected Disagreements ({contradictions.length})
          </div>
          {contradictions.map((c, idx) => {
            const isSelected = selectedContradiction?.id === c.id;
            return (
              <div
                key={c.id}
                id={`contradiction-item-${c.id}`}
                onClick={() => setSelectedContradiction(c)}
                className={`p-4 rounded-xl border cursor-pointer transition text-left ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500 text-amber-950 shadow-xs ring-1 ring-amber-400'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    Disagreement #{idx + 1}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                    {c.disagreementType}
                  </span>
                </div>
                <h4 className="font-bold text-xs leading-snug mb-2 line-clamp-2">
                  {c.topic}
                </h4>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Compare 2 sources</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right side-by-side comparative inspection card */}
        {selectedContradiction && selectedA && selectedB && (
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Scale className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  {selectedContradiction.disagreementType}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                {selectedContradiction.topic}
              </h2>
            </div>

            {/* Side-by-Side: Claim A & Claim B */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Claim A Card */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                      Perspective A
                    </span>
                  </div>

                  <div className="mb-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Claim A:
                    </span>
                    <p className="text-sm font-semibold text-slate-900 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                      {selectedA.statement}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Evidence A:
                    </span>
                    <blockquote className="text-xs italic text-slate-700 bg-white p-3 rounded-lg border-l-4 border-blue-500 border-t border-r border-b border-slate-200 leading-relaxed">
                      "{selectedA.evidence}"
                    </blockquote>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/80 text-xs">
                  <span className="font-semibold text-slate-500 block mb-0.5">Source A:</span>
                  <div className="font-medium text-slate-900 line-clamp-2">
                    {selectedA.sourceTitle}
                  </div>
                </div>
              </div>

              {/* Claim B Card */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                      Perspective B
                    </span>
                  </div>

                  <div className="mb-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Claim B:
                    </span>
                    <p className="text-sm font-semibold text-slate-900 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                      {selectedB.statement}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Evidence B:
                    </span>
                    <blockquote className="text-xs italic text-slate-700 bg-white p-3 rounded-lg border-l-4 border-purple-500 border-t border-r border-b border-slate-200 leading-relaxed">
                      "{selectedB.evidence}"
                    </blockquote>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/80 text-xs">
                  <span className="font-semibold text-slate-500 block mb-0.5">Source B:</span>
                  <div className="font-medium text-slate-900 line-clamp-2">
                    {selectedB.sourceTitle}
                  </div>
                </div>
              </div>
            </div>

            {/* Impartial Scientific Cross-Analysis */}
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 space-y-1 text-xs">
              <span className="font-bold text-blue-900 uppercase tracking-wider block">
                Neutral Epistemic Analysis
              </span>
              <p className="text-slate-700 leading-relaxed">
                {neutralAnalysis ||
                  'The divergence likely stems from distinct baseline parameters, differences in tested samples, or divergent evaluation metrics utilized by the respective research teams.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
