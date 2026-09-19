import React, { useState, useMemo } from 'react';
import { KnowledgeEntity, KnowledgeRelationship } from '../types';
import { Layers, Search, Filter, Hash, BookOpen, ArrowRight, Share2 } from 'lucide-react';

interface EntityExplorerProps {
  entities: KnowledgeEntity[];
  relationships: KnowledgeRelationship[];
  onSelectEntity?: (entity: KnowledgeEntity) => void;
}

export const EntityExplorer: React.FC<EntityExplorerProps> = ({
  entities,
  relationships,
  onSelectEntity,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedEntity, setSelectedEntity] = useState<KnowledgeEntity | null>(
    entities.length > 0 ? entities[0] : null
  );

  const entityTypes = useMemo(() => {
    return Array.from(new Set(entities.map((e) => e.type)));
  }, [entities]);

  const filteredEntities = useMemo(() => {
    let list = [...entities];
    if (selectedType !== 'all') {
      list = list.filter((e) => e.type === selectedType);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.mentionCount - a.mentionCount);
  }, [entities, selectedType, searchTerm]);

  // Find relationships for selected entity
  const entityRelationships = useMemo(() => {
    if (!selectedEntity) return [];
    return relationships.filter(
      (r) => r.sourceId === selectedEntity.id || r.targetId === selectedEntity.id
    );
  }, [selectedEntity, relationships]);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="entity-search-input"
              type="text"
              placeholder="Search extracted entities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56 md:w-72"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              id="entity-type-filter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types ({entities.length})</option>
              {entityTypes.map((t) => (
                <option key={t} value={t}>
                  {t} ({entities.filter((e) => e.type === t).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredEntities.length} entities
        </span>
      </div>

      {/* Two Column Layout: List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Entity Cards Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[700px] overflow-y-auto pr-1">
          {filteredEntities.map((ent) => {
            const isSelected = selectedEntity?.id === ent.id;
            return (
              <div
                key={ent.id}
                id={`entity-card-${ent.id}`}
                onClick={() => {
                  setSelectedEntity(ent);
                  if (onSelectEntity) onSelectEntity(ent);
                }}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/60 border-blue-500 ring-1 ring-blue-400 shadow-sm'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {ent.type}
                    </span>
                    <span className="text-[11px] font-semibold text-blue-700 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-blue-500" />
                      {ent.mentionCount} mentions
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1.5 leading-snug">
                    {ent.name}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {ent.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{ent.sources.length} supporting papers</span>
                  <span className="text-blue-600 font-semibold group-hover:underline">Inspect &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Entity Inspector Panel */}
        {selectedEntity && (
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 mb-1.5">
                {selectedEntity.type}
              </span>
              <h3 className="font-bold text-lg text-slate-900 leading-tight">
                {selectedEntity.name}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {selectedEntity.description}
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Total Corpus Mentions</span>
                <span className="text-xl font-bold text-slate-900">{selectedEntity.mentionCount}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Inter-Entity Links</span>
                <span className="text-xl font-bold text-blue-600">{entityRelationships.length}</span>
              </div>
            </div>

            {/* Relationships */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-blue-600" />
                Interconnected Relationships ({entityRelationships.length})
              </h4>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {entityRelationships.map((r) => (
                  <div key={r.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-slate-900 mb-1">
                      <span className={r.sourceId === selectedEntity.id ? 'font-bold text-blue-600' : ''}>
                        {r.sourceName}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="text-xs font-mono font-semibold px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                        {r.relationship}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className={r.targetId === selectedEntity.id ? 'font-bold text-blue-600' : ''}>
                        {r.targetName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic line-clamp-2">
                      "{r.evidence}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sources where it appears */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                Source Papers
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {selectedEntity.sources.map((src, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span className="leading-snug">{src}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
