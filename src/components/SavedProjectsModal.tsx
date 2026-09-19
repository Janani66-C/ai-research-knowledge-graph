import React, { useEffect, useState } from 'react';
import { Folder, Trash2, Calendar, FileText, Share2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

interface ProjectSummary {
  id: string;
  topic: string;
  searchQuery: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  sourcesCount: number;
  entitiesCount: number;
  relationshipsCount: number;
  contradictionsCount: number;
}

interface SavedProjectsModalProps {
  currentProjectId?: string;
  onSelectProject: (id: string) => void;
  onClose: () => void;
}

export const SavedProjectsModal: React.FC<SavedProjectsModalProps> = ({
  currentProjectId,
  onSelectProject,
  onClose,
}) => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  return (
    <div
      id="saved-projects-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        id="saved-projects-card"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 text-slate-900 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900">Research Project Repository</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-mono text-sm p-1"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Select any previously synthesized research session to inspect its knowledge graph, sources, and literature analysis.
        </p>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {loading ? (
            <div className="text-center py-10 text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-xs">Loading saved projects...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No saved research projects found. Start a new research query to automatically record sessions.
            </div>
          ) : (
            projects.map((p) => {
              const isCurrent = p.id === currentProjectId;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProject(p.id);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isCurrent
                      ? 'bg-blue-50/70 border-blue-400 shadow-sm ring-1 ring-blue-300'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {p.topic}
                      </h4>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-slate-400" />
                        {p.sourcesCount} sources
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="w-3 h-3 text-slate-400" />
                        {p.entitiesCount} entities
                      </span>
                      {p.contradictionsCount > 0 && (
                        <span className="flex items-center gap-1 text-amber-700 font-medium">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          {p.contradictionsCount} disagreements
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleDelete(p.id, e)}
                      title="Delete project"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
