import React from 'react';
import { KnowledgeEntity, KnowledgeRelationship, ResearchSource } from '../types';
import { X, ExternalLink, ArrowRight } from 'lucide-react';

interface EntityDetailModalProps {
  entity: KnowledgeEntity | null;
  relationships: KnowledgeRelationship[];
  sources: ResearchSource[];
  onClose: () => void;
  onSelectEntityByName?: (name: string) => void;
}

export const EntityDetailModal: React.FC<EntityDetailModalProps> = ({
  entity,
  relationships,
  sources,
  onClose,
  onSelectEntityByName,
}) => {
  if (!entity) return null;

  // Filter connected relationships
  const relatedRels = relationships.filter(
    (r) => r.sourceId === entity.id || r.targetId === entity.id
  );

  // Map supporting source documents
  const supportingSources = sources.filter((s) =>
    (entity.sources || []).some((srcName) =>
      s.title.toLowerCase().includes(srcName.toLowerCase()) ||
      srcName.toLowerCase().includes(s.title.toLowerCase())
    )
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <span className="inline-block text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded mb-1">
              {entity.type}
            </span>
            <h2 className="text-lg font-semibold text-slate-900">{entity.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-sm text-slate-700">
          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Description
            </h4>
            <p className="text-slate-600 leading-relaxed">{entity.description}</p>
          </div>

          {/* Related Entities */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Related Entities ({relatedRels.length})
            </h4>
            {relatedRels.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No direct connections recorded</p>
            ) : (
              <div className="space-y-1.5">
                {relatedRels.map((rel) => {
                  const isSource = rel.sourceId === entity.id;
                  const otherName = isSource ? rel.targetId : rel.sourceId;

                  return (
                    <div
                      key={rel.id}
                      onClick={() => onSelectEntityByName && onSelectEntityByName(otherName)}
                      className="flex items-center justify-between p-2 rounded bg-slate-50 hover:bg-slate-100 text-xs cursor-pointer transition"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">{rel.relationship}</span>
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                        <span className="font-medium text-slate-800">{otherName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Supporting Sources */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Supporting Sources
            </h4>
            {supportingSources.length > 0 ? (
              <div className="space-y-2">
                {supportingSources.map((s) => (
                  <div key={s.id} className="p-2.5 rounded bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="font-medium text-slate-800 line-clamp-1">{s.title}</div>
                    <div className="text-[11px] text-slate-400">
                      {s.sourceName} • {s.publicationDate}
                    </div>
                    {s.url && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline pt-0.5"
                      >
                        <span>Open paper</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : entity.sources && entity.sources.length > 0 ? (
              <ul className="list-disc list-inside text-xs text-slate-500 space-y-1">
                {entity.sources.map((src, i) => (
                  <li key={i} className="line-clamp-1">{src}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 italic">Identified in literature context</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
