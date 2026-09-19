import React from 'react';
import { Network, Folder, Download, Sparkles, Database, FileText } from 'lucide-react';
import { ResearchProject } from '../types';

interface NavbarProps {
  currentProject: ResearchProject | null;
  onOpenProjects: () => void;
  onOpenExport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProject,
  onOpenProjects,
  onOpenExport,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block">
              OmniGraph
            </span>
            <span className="text-[10px] text-blue-400 font-mono block -mt-1">
              AI Research-to-Knowledge Graph
            </span>
          </div>
        </div>

        {/* Current Active Topic Badge (if active) */}
        {currentProject && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs max-w-md truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 text-[11px]">Active Synthesis:</span>
            <span className="font-bold text-slate-200 truncate">{currentProject.topic}</span>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            id="nav-projects-btn"
            onClick={onOpenProjects}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <Folder className="w-3.5 h-3.5 text-blue-400" />
            <span>Saved Projects</span>
          </button>

          {currentProject && currentProject.status === 'complete' && (
            <button
              id="nav-export-btn"
              onClick={onOpenExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Dossier</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
