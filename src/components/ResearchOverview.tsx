import React from 'react';
import { ResearchProject, KnowledgeEntity } from '../types';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface ResearchOverviewProps {
  project: ResearchProject;
  onNavigateTab: (tab: string) => void;
  onSelectEntity: (entity: KnowledgeEntity) => void;
  onOpenContradictions: () => void;
}

export const ResearchOverview: React.FC<ResearchOverviewProps> = ({
  project,
  onNavigateTab,
  onSelectEntity,
  onOpenContradictions,
}) => {
  const { sources, summaries, entities, relationships, contradictions } = project;

  // AI Summary synthesis
  const primarySummary =
    summaries[0]?.keyIdea ||
    `This research synthesis analyzes ${sources.length} academic and empirical publications on ${project.topic}, categorizing methodologies, foundational taxonomy, and validated outcomes.`;

  // Key findings
  const keyFindings = summaries
    .flatMap((s) => s.importantFindings || [])
    .slice(0, 5);

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-2">
      {/* Metrics Row & Potential Disagreement Warning */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>
            <strong className="text-slate-900 font-semibold">{sources.length}</strong> Sources
          </span>
          <span>•</span>
          <span>
            <strong className="text-slate-900 font-semibold">{entities.length}</strong> Entities
          </span>
          <span>•</span>
          <span>
            <strong className="text-slate-900 font-semibold">{relationships.length}</strong> Relationships
          </span>
        </div>

        {contradictions && contradictions.length > 0 && (
          <button
            onClick={onOpenContradictions}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>⚠ Potential disagreement detected</span>
          </button>
        )}
      </div>

      {/* 1. AI Summary */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          AI Summary
        </h2>
        <p className="text-base text-slate-800 leading-relaxed font-normal">
          {primarySummary}
        </p>
        {summaries[0]?.conclusion && (
          <p className="text-sm text-slate-600 leading-relaxed pt-1">
            {summaries[0].conclusion}
          </p>
        )}
      </section>

      {/* 2. Key Findings */}
      {keyFindings.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Key Findings
          </h2>
          <ul className="space-y-2.5">
            {keyFindings.map((finding, idx) => (
              <li key={idx} className="text-sm text-slate-700 flex items-start gap-2.5 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 3. Entities */}
      {entities.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Extracted Entities
            </h2>
            <button
              onClick={() => onNavigateTab('graph')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
            >
              <span>View in Graph</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {entities.slice(0, 15).map((e) => (
              <button
                key={e.id}
                onClick={() => onSelectEntity(e)}
                className="px-2.5 py-1 rounded-md text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-normal transition"
              >
                {e.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 4. Relationships */}
      {relationships.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Core Relationships
            </h2>
            <button
              onClick={() => onNavigateTab('graph')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
            >
              <span>Explore connections</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {relationships.slice(0, 4).map((r) => (
              <div
                key={r.id}
                className="text-xs p-2.5 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-between text-slate-600"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-slate-800">{r.sourceId}</span>
                  <span className="text-slate-400">→</span>
                  <span className="text-blue-600 italic">{r.relationship}</span>
                  <span className="text-slate-400">→</span>
                  <span className="font-medium text-slate-800">{r.targetId}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
