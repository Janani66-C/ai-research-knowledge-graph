import React, { useState, useEffect } from 'react';
import { Plus, Settings, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface ProjectSummary {
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

interface SidebarProps {
  currentProjectId?: string;
  onNewResearch: () => void;
  onSelectProject: (id: string) => void;
  onOpenSettings: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  refreshTrigger?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentProjectId,
  onNewResearch,
  onSelectProject,
  onOpenSettings,
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  refreshTrigger = 0,
}) => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.warn('Sidebar project fetch error:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [refreshTrigger]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this research session?')) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (currentProjectId === id) {
          onNewResearch();
        }
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 text-slate-700 select-none">
      {/* Top: New Research Button */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between">
        <button
          id="sidebar-new-research-btn"
          onClick={() => {
            onNewResearch();
            if (isMobileOpen) onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Research</span>
        </button>
        {isMobileOpen && (
          <button
            onClick={onCloseMobile}
            className="ml-2 p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 md:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Middle: Recent Research List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400">
          Recent Research
        </div>

        {projects.length === 0 ? (
          <div className="px-2 py-4 text-xs text-slate-400 text-center">
            No research yet
          </div>
        ) : (
          projects.map((p) => {
            const isSelected = p.id === currentProjectId;
            return (
              <div
                key={p.id}
                id={`sidebar-project-${p.id}`}
                onClick={() => {
                  onSelectProject(p.id);
                  if (isMobileOpen) onCloseMobile();
                }}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition ${
                  isSelected
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="truncate pr-2">{p.topic}</span>
                <button
                  onClick={(e) => handleDelete(p.id, e)}
                  title="Delete"
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 rounded transition shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom: Settings */}
      <div className="p-2 border-t border-slate-100">
        <button
          id="sidebar-settings-btn"
          onClick={() => {
            onOpenSettings();
            if (isMobileOpen) onCloseMobile();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-full shrink-0 transition-all duration-200 ${
          isCollapsed ? 'w-0 overflow-hidden' : 'w-56'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-lg z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
