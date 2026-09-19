import React, { useState } from 'react';
import { ContradictionItem } from '../types';
import { X, AlertTriangle, Scale } from 'lucide-react';

interface ContradictionModalProps {
  contradictions: ContradictionItem[];
  onClose: () => void;
}

export const ContradictionModal: React.FC<ContradictionModalProps> = ({
  contradictions,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!contradictions || contradictions.length === 0) return null;

  const current = contradictions[selectedIndex] || contradictions[0];

  const getClaimDetails = (c: any, side: 'A' | 'B') => {
    const claimObj = side === 'A' ? c.claimA : c.claimB;
    const directStatement = typeof claimObj === 'string' ? claimObj : claimObj?.statement;
    const directEvidence =
      typeof (side === 'A' ? c.evidenceA : c.evidenceB) === 'string'
        ? side === 'A'
          ? c.evidenceA
          : c.evidenceB
        : claimObj?.evidenceSnippet;
    const directSourceTitle =
      (side === 'A' ? c.sourceATitle : c.sourceBTitle) || claimObj?.sourceTitle;

    return {
      statement: directStatement || 'Empirical claim from research corpus.',
      evidence: directEvidence || 'Direct excerpt from research text.',
      sourceTitle: directSourceTitle || `Source ${side}`,
    };
  };

  const sideA = getClaimDetails(current, 'A');
  const sideB = getClaimDetails(current, 'B');
  const neutralAnalysis = (current as any).neutralAnalysis || (current as any).analysis;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-amber-600 flex items-center gap-1.5 text-xs font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
              <AlertTriangle className="w-3.5 h-3.5" />
              Potential Disagreement Detected
            </span>
            {contradictions.length > 1 && (
              <span className="text-xs text-slate-400">
                ({selectedIndex + 1} of {contradictions.length})
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-selector if multiple contradictions */}
        {contradictions.length > 1 && (
          <div className="flex gap-2 px-5 py-2 border-b border-slate-100 overflow-x-auto shrink-0">
            {contradictions.map((c, i) => (
              <button
                key={c.id || i}
                onClick={() => setSelectedIndex(i)}
                className={`text-xs px-2.5 py-1 rounded-md transition ${
                  selectedIndex === i
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Disagreement #{i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-sm text-slate-700">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
              Topic / Focus
            </span>
            <h3 className="font-semibold text-slate-900 text-base">{current.topic}</h3>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
            The AI research engine identifies opposing empirical results or divergent claims between sources. The system remains epistemically neutral and does not declare either source correct.
          </p>

          {/* Side by side claims */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Perspective A */}
            <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 space-y-2.5">
              <div className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-fit">
                Perspective A
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Claim
                </span>
                <p className="text-xs font-medium text-slate-900 mt-0.5">{sideA.statement}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Evidence
                </span>
                <blockquote className="text-xs text-slate-600 italic mt-0.5 border-l-2 border-blue-400 pl-2">
                  "{sideA.evidence}"
                </blockquote>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                Source: {sideA.sourceTitle}
              </div>
            </div>

            {/* Perspective B */}
            <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 space-y-2.5">
              <div className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded w-fit">
                Perspective B
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Claim
                </span>
                <p className="text-xs font-medium text-slate-900 mt-0.5">{sideB.statement}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Evidence
                </span>
                <blockquote className="text-xs text-slate-600 italic mt-0.5 border-l-2 border-purple-400 pl-2">
                  "{sideB.evidence}"
                </blockquote>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                Source: {sideB.sourceTitle}
              </div>
            </div>
          </div>

          {/* Epistemic note */}
          {neutralAnalysis && (
            <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-700 block mb-1">
                Comparative Analysis:
              </span>
              <p className="text-slate-600 leading-relaxed">{neutralAnalysis}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
