import React, { useState, useEffect, useRef } from 'react';
import { Sidebar, ProjectSummary } from './components/Sidebar';
import { InitialResearchView } from './components/InitialResearchView';
import { ProgressStepper } from './components/ProgressStepper';
import { ResearchOverview } from './components/ResearchOverview';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { ArticleList } from './components/ArticleList';
import { ResearchTimeline } from './components/ResearchTimeline';
import { ResearchAnalysis } from './components/ResearchAnalysis';
import { ResearchChat } from './components/ResearchChat';
import { SettingsModal } from './components/SettingsModal';
import { ContradictionModal } from './components/ContradictionModal';
import { EntityDetailModal } from './components/EntityDetailModal';
import { ResearchProject, ResearchStatus, KnowledgeEntity } from './types';
import { Menu, ArrowUp, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function App() {
  const [currentProject, setCurrentProject] = useState<ResearchProject | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sources' | 'graph' | 'timeline' | 'analysis' | 'ask'>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<ResearchStatus>('searching');
  const [progressPercent, setProgressPercent] = useState<number>(15);
  const [progressMessage, setProgressMessage] = useState<string>('Searching scientific literature...');
  const [researchingTopic, setResearchingTopic] = useState<string>('');
  const [researchError, setResearchError] = useState<string | null>(null);

  const [savedProjects, setSavedProjects] = useState<ProjectSummary[]>([]);
  const [sidebarRefresh, setSidebarRefresh] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showContradictionsModal, setShowContradictionsModal] = useState<boolean>(false);
  const [selectedEntityModal, setSelectedEntityModal] = useState<KnowledgeEntity | null>(null);

  // Bottom prompt input for quick Ask AI
  const [bottomInput, setBottomInput] = useState<string>('');
  const [initialChatQuestion, setInitialChatQuestion] = useState<string>('');

  const refreshProjectsList = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const list = await res.json();
        setSavedProjects(list);
        return list;
      }
    } catch (err) {
      console.warn('Projects list load error:', err);
    }
    return [];
  };

  useEffect(() => {
    refreshProjectsList();
  }, []);

  // Polling controller reference to allow clean cancellation
  const activePollRef = useRef<{ isCancelled: boolean; timerId: ReturnType<typeof setTimeout> | null }>({ isCancelled: false, timerId: null });

  const handleStartResearch = async (topic: string, forceRefresh = false) => {
    // Cancel any ongoing poll
    activePollRef.current.isCancelled = true;
    if (activePollRef.current.timerId) {
      clearTimeout(activePollRef.current.timerId);
    }
    const pollState: { isCancelled: boolean; timerId: ReturnType<typeof setTimeout> | null } = { isCancelled: false, timerId: null };
    activePollRef.current = pollState;

    setIsLoading(true);
    setResearchError(null);
    setResearchingTopic(topic);
    setProgressStatus('searching');
    setProgressPercent(15);
    setProgressMessage('Formulating academic queries across scientific literature...');

    try {
      // 1. Initial trigger request to start background research or retrieve completed cache
      const controller = new AbortController();
      const initialTimeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, forceRefresh }),
        signal: controller.signal,
      });

      clearTimeout(initialTimeoutId);

      const contentType = res.headers.get('content-type') || '';
      let initialProject: ResearchProject | null = null;

      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Server responded with status ${res.status}`);
        }
        initialProject = data;
      } else {
        const text = await res.text();
        const snippet = text.slice(0, 100).trim();
        throw new Error(
          `Research API returned an unexpected response (${res.status}): ${
            snippet.startsWith('<') ? 'Server returned HTML instead of JSON' : snippet
          }`
        );
      }

      if (!initialProject || !initialProject.id) {
        throw new Error('Invalid project initialization payload received.');
      }

      // If already complete (e.g. cache hit)
      if (initialProject.status === 'complete') {
        setCurrentProject(initialProject);
        setActiveTab('overview');
        setSidebarRefresh((prev) => prev + 1);
        refreshProjectsList();
        setIsLoading(false);
        return;
      }

      // Update state with initial progress
      setProgressStatus(initialProject.status);
      setProgressPercent(initialProject.progressPercent || 20);
      setProgressMessage(initialProject.progressMessage || 'Research initiated...');

      // 2. Poll for pipeline progression
      const projectId = initialProject.id;
      const startTime = Date.now();
      const MAX_POLL_TIME = 180000; // 3 minutes maximum timeout

      const pollForUpdates = async () => {
        if (pollState.isCancelled) return;

        if (Date.now() - startTime > MAX_POLL_TIME) {
          setResearchError('The research pipeline is taking longer than expected. You can retry with a refreshed attempt.');
          return;
        }

        try {
          const pollRes = await fetch(`/api/research/${projectId}`, {
            headers: { 'Cache-Control': 'no-cache' }
          });

          if (pollState.isCancelled) return;

          const pollContentType = pollRes.headers.get('content-type') || '';
          if (!pollContentType.includes('application/json')) {
            // Transient server reload/proxy blip; retry shortly
            pollState.timerId = setTimeout(pollForUpdates, 1500);
            return;
          }

          if (pollRes.ok) {
            const projectUpdate: ResearchProject = await pollRes.json();

            if (projectUpdate.progressPercent !== undefined) {
              setProgressPercent(projectUpdate.progressPercent);
            }
            if (projectUpdate.progressMessage) {
              setProgressMessage(projectUpdate.progressMessage);
            }
            if (projectUpdate.status) {
              setProgressStatus(projectUpdate.status);
            }

            if (projectUpdate.status === 'complete') {
              setCurrentProject(projectUpdate);
              setActiveTab('overview');
              setSidebarRefresh((prev) => prev + 1);
              refreshProjectsList();
              setIsLoading(false);
              return;
            } else if (projectUpdate.status === 'error') {
              setResearchError(projectUpdate.progressMessage || 'An error occurred during scientific synthesis.');
              return;
            }
          }
        } catch (pollErr) {
          console.warn('Transient polling blip, retrying...', pollErr);
        }

        if (!pollState.isCancelled) {
          pollState.timerId = setTimeout(pollForUpdates, 1200);
        }
      };

      // Start polling
      pollState.timerId = setTimeout(pollForUpdates, 1000);

    } catch (err: any) {
      console.error('Research error:', err);
      const isTimeout = err.name === 'AbortError';
      const msg = isTimeout
        ? 'The initial request timed out. Please check your network connection and retry.'
        : (err.message || 'Network error encountered during literature synthesis.');
      setResearchError(msg);
    }
  };

  const handleSelectSavedProject = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/research/${id}`);
      if (res.ok) {
        const project = await res.json();
        setCurrentProject(project);
        setActiveTab('overview');
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewResearch = () => {
    setCurrentProject(null);
    setActiveTab('overview');
  };

  const handleBottomAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bottomInput.trim()) return;
    setInitialChatQuestion(bottomInput.trim());
    setBottomInput('');
    setActiveTab('ask');
  };

  // If no active project and not loading, show the ultra-simple centered home screen
  if (!currentProject && !isLoading) {
    return (
      <InitialResearchView
        onStartResearch={handleStartResearch}
        isLoading={isLoading}
      />
    );
  }

  const tabs: { id: 'overview' | 'sources' | 'graph' | 'timeline' | 'analysis'; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'sources', label: 'Sources' },
    { id: 'graph', label: 'Graph' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'analysis', label: 'Analysis' },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-900 font-sans">
      {/* 1. Small Left Sidebar */}
      <Sidebar
        currentProjectId={currentProject?.id}
        onNewResearch={handleNewResearch}
        onSelectProject={handleSelectSavedProject}
        onOpenSettings={() => setShowSettingsModal(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        refreshTrigger={sidebarRefresh}
      />

      {/* 2. Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white">
        {/* Loading State */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <ProgressStepper
              status={progressStatus}
              progressPercent={progressPercent}
              message={progressMessage}
              topic={researchingTopic}
              error={researchError}
              onRetry={() => handleStartResearch(researchingTopic, true)}
              onCancel={() => {
                activePollRef.current.isCancelled = true;
                if (activePollRef.current.timerId) {
                  clearTimeout(activePollRef.current.timerId);
                }
                setIsLoading(false);
                setResearchError(null);
              }}
            />
          </div>
        ) : (
          currentProject && (
            <>
              {/* Top Area: Topic & Minimal Navigation Bar */}
              <header className="px-6 pt-5 pb-3 border-b border-slate-100 shrink-0 bg-white">
                <div className="max-w-4xl mx-auto space-y-3">
                  {/* Topic Name */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="md:hidden p-1 text-slate-500 hover:text-slate-800"
                        title="Menu"
                      >
                        <Menu className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="hidden md:inline-flex p-1 text-slate-400 hover:text-slate-700 transition"
                        title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                      >
                        {isSidebarCollapsed ? (
                          <PanelLeftOpen className="w-4 h-4" />
                        ) : (
                          <PanelLeftClose className="w-4 h-4" />
                        )}
                      </button>
                      <div>
                        <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                          Research Topic
                        </div>
                        <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                          {currentProject.topic}
                        </h1>
                      </div>
                    </div>
                  </div>

                  {/* Simple Minimal Navigation Bar */}
                  <nav className="flex items-center gap-6 pt-1 text-sm border-t border-slate-50 overflow-x-auto">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          id={`nav-${tab.id}`}
                          onClick={() => setActiveTab(tab.id)}
                          className={`py-1.5 font-medium transition border-b-2 -mb-[1px] whitespace-nowrap ${
                            isActive
                              ? 'text-slate-900 border-slate-900 font-semibold'
                              : 'text-slate-500 hover:text-slate-800 border-transparent'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </header>

              {/* Main Content Area (One screen = one purpose) */}
              <main className="flex-1 overflow-y-auto px-6 py-6">
                {activeTab === 'overview' && (
                  <ResearchOverview
                    project={currentProject}
                    onNavigateTab={(tab) => setActiveTab(tab as any)}
                    onSelectEntity={(e) => setSelectedEntityModal(e)}
                    onOpenContradictions={() => setShowContradictionsModal(true)}
                  />
                )}

                {activeTab === 'sources' && (
                  <ArticleList
                    sources={currentProject.sources}
                    summaries={currentProject.summaries}
                  />
                )}

                {activeTab === 'graph' && (
                  <div className="h-[calc(100vh-180px)]">
                    <KnowledgeGraph
                      entities={currentProject.entities}
                      relationships={currentProject.relationships}
                      topic={currentProject.topic}
                      sources={currentProject.sources}
                      onSelectEntity={(e) => setSelectedEntityModal(e)}
                    />
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <ResearchTimeline
                    events={currentProject.timeline}
                    topic={currentProject.topic}
                  />
                )}

                {activeTab === 'analysis' && (
                  <ResearchAnalysis
                    project={currentProject}
                    onSelectEntity={(e) => setSelectedEntityModal(e)}
                    onOpenContradictions={() => setShowContradictionsModal(true)}
                  />
                )}

                {activeTab === 'ask' && (
                  <ResearchChat
                    projectId={currentProject.id}
                    topic={currentProject.topic}
                    onBack={() => setActiveTab('overview')}
                    initialQuestion={initialChatQuestion}
                    onClearInitialQuestion={() => setInitialChatQuestion('')}
                  />
                )}
              </main>

              {/* ChatGPT-like bottom input bar (displayed on tabs other than 'ask') */}
              {activeTab !== 'ask' && (
                <div className="px-6 py-3 border-t border-slate-100 bg-white shrink-0">
                  <form
                    onSubmit={handleBottomAskSubmit}
                    className="max-w-2xl mx-auto relative flex items-center"
                  >
                    <input
                      type="text"
                      value={bottomInput}
                      onChange={(e) => setBottomInput(e.target.value)}
                      placeholder="Ask something about this research..."
                      className="w-full pl-4 pr-10 py-2 text-xs md:text-sm bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-400 focus:outline-none rounded-full shadow-2xs transition text-slate-800 placeholder-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={!bottomInput.trim()}
                      className="absolute right-1.5 p-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-20 transition"
                      title="Send"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}
            </>
          )
        )}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          savedProjectsCount={savedProjects.length}
        />
      )}

      {/* Contradictions Modal (Disagreement details) */}
      {showContradictionsModal && currentProject && (
        <ContradictionModal
          contradictions={currentProject.contradictions}
          onClose={() => setShowContradictionsModal(false)}
        />
      )}

      {/* Entity Details Modal */}
      {selectedEntityModal && currentProject && (
        <EntityDetailModal
          entity={selectedEntityModal}
          relationships={currentProject.relationships}
          sources={currentProject.sources}
          onClose={() => setSelectedEntityModal(null)}
          onSelectEntityByName={(name) => {
            const found = currentProject.entities.find((e) => e.name.toLowerCase() === name.toLowerCase());
            if (found) setSelectedEntityModal(found);
          }}
        />
      )}
    </div>
  );
}
