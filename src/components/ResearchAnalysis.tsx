import React from 'react';
import { ResearchProject, KnowledgeEntity } from '../types';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface ResearchAnalysisProps {
  project: ResearchProject;
  onSelectEntity: (entity: KnowledgeEntity) => void;
  onOpenContradictions: () => void;
}

export const ResearchAnalysis: React.FC<ResearchAnalysisProps> = ({
  project,
  onSelectEntity,
  onOpenContradictions,
}) => {
  const { entities, contradictions = [], researchGaps = [] } = project;

  // 1. Most mentioned entities
  const sortedEntities = [...entities].sort((a, b) => b.mentionCount - a.mentionCount).slice(0, 6);
  const maxMentions = sortedEntities[0]?.mentionCount || 1;

  // 2. Research themes (categorized by entity types and frequencies)
  const typeMap: Record<string, number> = {};
  entities.forEach((e) => {
    typeMap[e.type] = (typeMap[e.type] || 0) + 1;
  });
  const themes = Object.entries(typeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="max-w-3xl mx-auto space-y-10 py-2">
      {/* 1. Most Mentioned Entities */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Most Mentioned Entities
        </h2>
        <div className="space-y-2">
          {sortedEntities.map((e) => {
            const widthPct = Math.max(12, Math.round((e.mentionCount / maxMentions) * 100));
            return (
              <div
                key={e.id}
                onClick={() => onSelectEntity(e)}
                className="group flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition text-xs"
              >
                <div className="flex items-center gap-2 flex-1 mr-4">
                  <span className="font-medium text-slate-800">{e.name}</span>
                  <span className="text-[10px] text-slate-400">({e.type})</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                    <div
                      className="bg-slate-800 h-full rounded-full"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="text-slate-500 font-mono text-[11px] w-12 text-right">
                    {e.mentionCount} {e.mentionCount === 1 ? 'mention' : 'mentions'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Research Themes */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Research Themes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {themes.map(([theme, count]) => (
            <div
              key={theme}
              className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-1 text-xs"
            >
              <div className="font-medium text-slate-800 text-sm">{theme}</div>
              <div className="text-slate-500">
                {count} {count === 1 ? 'core concept' : 'core concepts'} mapped in this domain
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Potential Disagreements */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Potential Disagreements
        </h2>
        {contradictions.length > 0 ? (
          <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{contradictions.length} divergent claim{contradictions.length > 1 ? 's' : ''} detected</span>
              </div>
              <button
                onClick={onOpenContradictions}
                className="text-xs text-amber-800 hover:text-amber-950 font-semibold underline"
              >
                Review details
              </button>
            </div>
            <p className="text-xs text-amber-800/80 leading-relaxed">
              Divergence in empirical measurements or findings identified between published papers.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
            No contradictory empirical findings detected across the analyzed sources.
          </p>
        )}
      </section>

      {/* 4. Research Gaps */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Research Gaps & Future Directions
        </h2>
        {researchGaps.length > 0 ? (
          <ul className="space-y-2.5">
            {researchGaps.map((gap, i) => (
              <li
                key={gap.id || i}
                className="text-xs text-slate-700 flex items-start gap-2.5 leading-relaxed p-3 rounded-lg border border-slate-100 bg-slate-50"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                <div>
                  <strong className="font-semibold text-slate-900 block mb-0.5">
                    {gap.gapTitle || `Identified Gap #${i + 1}`}
                  </strong>
                  <span>{gap.description}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
            Open research questions and limitations from author conclusions.
          </p>
        )}
      </section>
    </div>
  );
};
