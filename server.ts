import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { searchRealScientificSources } from './server/research_sources';
import {
  enhanceSources,
  generateDocumentSummaries,
  extractEntities,
  detectRelationships,
  detectContradictions,
  extractTimeline,
  extractResearchGaps,
  computeCorpusStatistics,
  answerCorpusQuestion,
  checkOllamaReachable,
} from './server/ai_pipeline';
import {
  saveProject,
  getProject,
  listProjects,
  deleteProject,
  exportProject,
  findCompletedProjectByTopic,
  findActiveProjectByTopic,
} from './server/storage';
import { ResearchProject } from './src/types';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // API Routes
  app.get('/api/health', async (req, res) => {
    const ollamaUrl = process.env.OLLAMA_BASE_URL;
    const model = process.env.OLLAMA_MODEL || 'llama3.2:3b';
    const ollamaConfigured = Boolean(ollamaUrl);
    const ollamaReachable = ollamaConfigured && ollamaUrl ? await checkOllamaReachable(ollamaUrl) : false;

    res.json({
      status: 'ok',
      ollamaConfigured,
      ollamaReachable,
      model,
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      time: new Date().toISOString(),
    });
  });

  // Background pipeline runner to process deep synthesis reliably
  async function runResearchPipeline(project: ResearchProject, cleanTopic: string) {
    console.log(`[Research] Starting topic: ${cleanTopic}`);
    try {
      // Step 1 & 2: Search sources & collect articles
      project.status = 'collecting';
      project.progressPercent = 25;
      project.progressMessage = 'Collecting and retrieving research articles...';
      saveProject(project);

      const realSources = await searchRealScientificSources(cleanTopic);
      console.log(`[Research] Sources found: ${realSources.length}`);
      let enhancedSources = realSources;
      try {
        enhancedSources = await enhanceSources(cleanTopic, realSources);
      } catch (e) {
        console.warn('[Pipeline Warning] Source enhancement notice:', (e as Error).message);
      }
      project.sources = enhancedSources.length > 0 ? enhancedSources : realSources;
      saveProject(project);

      // Step 3 & 4: Extraction & Deep Summarization
      project.status = 'summarizing';
      project.progressPercent = 45;
      project.progressMessage = 'Generating AI summaries with fact vs. claim distinctions...';
      saveProject(project);

      try {
        project.summaries = await generateDocumentSummaries(project.sources, cleanTopic);
      } catch (e) {
        console.warn('[Pipeline Warning] Document summaries notice:', (e as Error).message);
      }
      saveProject(project);

      // Step 5: Entity Extraction
      project.status = 'entities';
      project.progressPercent = 60;
      project.progressMessage = 'Extracting dynamic entities and taxonomy across corpus...';
      saveProject(project);

      try {
        project.entities = await extractEntities(project.sources, cleanTopic);
      } catch (e) {
        console.warn('[Pipeline Warning] Entity extraction notice:', (e as Error).message);
      }
      saveProject(project);

      // Step 6: Relationship Detection
      project.status = 'relationships';
      project.progressPercent = 75;
      project.progressMessage = 'Detecting grounded inter-entity relationships with citation evidence...';
      saveProject(project);

      try {
        project.relationships = await detectRelationships(project.entities, project.sources, cleanTopic);
      } catch (e) {
        console.warn('[Pipeline Warning] Relationship detection notice:', (e as Error).message);
      }
      saveProject(project);

      // Step 7: Contradictions & Disagreements
      project.status = 'contradictions';
      project.progressPercent = 85;
      project.progressMessage = 'Analyzing sources for potential scientific disagreements and claim conflicts...';
      saveProject(project);

      try {
        project.contradictions = await detectContradictions(project.sources, cleanTopic);
      } catch (e) {
        console.warn('[Pipeline Warning] Contradiction detection notice:', (e as Error).message);
      }
      saveProject(project);

      // Step 8: Timeline, Gaps, and Knowledge Graph completion
      project.status = 'graph';
      project.progressPercent = 95;
      project.progressMessage = 'Synthesizing research timeline, identifying literature gaps, and generating knowledge graph...';
      saveProject(project);

      // Run independent synthesis tasks concurrently
      const [timelineRes, gapsRes] = await Promise.allSettled([
        extractTimeline(project.sources, cleanTopic),
        extractResearchGaps(project.sources, project.summaries, cleanTopic),
      ]);

      if (timelineRes.status === 'fulfilled') {
        project.timeline = timelineRes.value;
      } else {
        console.warn('[Pipeline Warning] Timeline notice:', timelineRes.reason?.message);
      }

      if (gapsRes.status === 'fulfilled') {
        project.researchGaps = gapsRes.value;
      } else {
        console.warn('[Pipeline Warning] Research gaps notice:', gapsRes.reason?.message);
      }

      project.corpusStats = computeCorpusStatistics(
        project.sources,
        project.entities,
        project.relationships,
        project.contradictions
      );

      project.status = 'complete';
      project.progressPercent = 100;
      project.progressMessage = 'Research complete ✓';
      saveProject(project);
      console.log(`[Research] Completed successfully: ${cleanTopic}`);
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.error(`[Research] Failed: ${errMsg}`);
      project.status = 'error';
      project.progressMessage = `Error processing research: ${errMsg}`;
      saveProject(project);
    }
  }

  // 1. Full Research Pipeline Orchestration
  app.post('/api/research', async (req, res) => {
    const { topic } = req.body;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      res.status(400).json({ error: 'Valid research topic is required.' });
      return;
    }

    const cleanTopic = topic.trim();

    // Check if an identical completed project already exists to avoid redundant LLM queries
    if (!req.body.forceRefresh) {
      const existingCompleted = findCompletedProjectByTopic(cleanTopic);
      if (existingCompleted) {
        console.log(`[Cache Hit] Serving existing completed research for "${cleanTopic}"`);
        res.json(existingCompleted);
        return;
      }

      // Check if an in-flight research job is already actively processing for this topic
      const existingActive = findActiveProjectByTopic(cleanTopic);
      if (existingActive) {
        console.log(`[Active Hit] In-flight research already running for "${cleanTopic}" (${existingActive.id})`);
        res.json(existingActive);
        return;
      }
    }

    const projectId = `proj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Initial project state
    const project: ResearchProject = {
      id: projectId,
      topic: cleanTopic,
      searchQuery: cleanTopic,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'searching',
      progressPercent: 10,
      progressMessage: 'Searching scientific repositories (arXiv, CrossRef, academic literature)...',
      sources: [],
      summaries: [],
      entities: [],
      relationships: [],
      contradictions: [],
      timeline: [],
      researchGaps: [],
      corpusStats: {
        totalSources: 0,
        totalDocuments: 0,
        totalEntities: 0,
        totalRelationships: 0,
        totalContradictions: 0,
        researchDate: new Date().toISOString(),
        topEntities: [],
        entityTypeDistribution: [],
        relationshipDistribution: [],
        themeClusters: [],
      },
    };

    saveProject(project);

    // Launch pipeline in background and immediately respond with project object for client polling
    runResearchPipeline(project, cleanTopic).catch((err) => {
      console.error('[Background Pipeline Fatal Error]:', err);
    });

    res.json(project);
  });

  // 2. Get Project by ID
  app.get('/api/research/:id', (req, res) => {
    const project = getProject(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Research project not found.' });
      return;
    }
    res.json(project);
  });

  // 3. List All Projects
  app.get('/api/projects', (req, res) => {
    const list = listProjects();
    res.json(list);
  });

  // 4. Update / Save Project Details
  app.post('/api/projects', (req, res) => {
    const { id, topic } = req.body;
    const project = getProject(id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    if (topic) project.topic = topic.trim();
    saveProject(project);
    res.json(project);
  });

  // 5. Delete Project
  app.delete('/api/projects/:id', (req, res) => {
    const deleted = deleteProject(req.params.id);
    res.json({ success: deleted });
  });

  // 6. Ask Natural Language Questions about the Collected Research Corpus
  app.post('/api/ask', async (req, res) => {
    const { projectId, question } = req.body;
    if (!projectId || !question || typeof question !== 'string') {
      res.status(400).json({ error: 'Project ID and question are required.' });
      return;
    }

    const project = getProject(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    try {
      const response = await answerCorpusQuestion(
        question.trim(),
        project.sources,
        project.entities,
        project.summaries,
        project.contradictions,
        project.topic
      );
      res.json(response);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // 7. Source Comparison
  app.post('/api/compare', (req, res) => {
    const { projectId, sourceIds } = req.body;
    const project = getProject(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const selectedSources = project.sources.filter((s) => (sourceIds || []).includes(s.id));
    const comparison = selectedSources.map((s) => {
      const summary = project.summaries.find((sum) => sum.docId === s.id);
      return {
        id: s.id,
        title: s.title,
        sourceName: s.sourceName,
        publicationDate: s.publicationDate,
        documentType: s.documentType,
        mainTopic: summary?.keyIdea || s.abstract.substring(0, 150),
        methodology: summary?.methodApproach || 'Standard empirical investigation',
        findings: summary?.importantFindings || [],
        evidence: summary?.keyEvidence || [],
        limitations: summary?.limitations || [],
        conclusions: summary?.conclusion || 'Documented research conclusion',
      };
    });

    res.json({ comparison });
  });

  // 8. Export Project
  app.post('/api/export', (req, res) => {
    const { projectId, format } = req.body;
    const project = getProject(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const targetFormat = ['json', 'markdown', 'csv', 'html'].includes(format) ? format : 'markdown';
    const exported = exportProject(project, targetFormat);

    res.setHeader('Content-Type', exported.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
    res.send(exported.content);
  });

  // Catch-all for undefined /api/* endpoints to ensure valid JSON error instead of HTML SPA response
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Express JSON error handler for API routes
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api/')) {
      console.error('[API Error Handler]:', err);
      res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
      return;
    }
    next(err);
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Research Engine server running on http://0.0.0.0:${PORT}`);
  });
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process Unhandled Rejection]:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Process Uncaught Exception]:', err);
});

startServer().catch((err) => {
  console.error('[Server Startup Error]:', err);
  process.exit(1);
});
