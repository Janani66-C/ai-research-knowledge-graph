import fs from 'fs';
import path from 'path';
import { ResearchProject } from '../src/types';

const STORAGE_FILE = path.join(process.cwd(), 'projects_storage.json');

// In-memory cache backed by file
const projectsMap = new Map<string, ResearchProject>();

// Load from file if exists
try {
  if (fs.existsSync(STORAGE_FILE)) {
    const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
    const list: ResearchProject[] = JSON.parse(raw);
    list.forEach((p) => projectsMap.set(p.id, p));
    console.log(`[Storage] Loaded ${projectsMap.size} projects from disk.`);
  }
} catch (err) {
  console.warn('[Storage] Could not load storage file, starting fresh:', (err as Error).message);
}

function persistToDisk() {
  try {
    const list = Array.from(projectsMap.values());
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Storage] Error saving to disk:', (err as Error).message);
  }
}

export function saveProject(project: ResearchProject): ResearchProject {
  project.updatedAt = new Date().toISOString();
  projectsMap.set(project.id, project);
  persistToDisk();
  return project;
}

export function getProject(id: string): ResearchProject | undefined {
  return projectsMap.get(id);
}

export function findCompletedProjectByTopic(topic: string): ResearchProject | undefined {
  const norm = topic.trim().toLowerCase();
  return Array.from(projectsMap.values()).find(
    (p) => p.status === 'complete' && p.topic.trim().toLowerCase() === norm
  );
}

export function findActiveProjectByTopic(topic: string): ResearchProject | undefined {
  const norm = topic.trim().toLowerCase();
  return Array.from(projectsMap.values()).find(
    (p) => p.status !== 'complete' && p.status !== 'error' && p.topic.trim().toLowerCase() === norm
  );
}

export function listProjects(): Array<{
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
}> {
  return Array.from(projectsMap.values()).map((p) => ({
    id: p.id,
    topic: p.topic,
    searchQuery: p.searchQuery,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    status: p.status,
    sourcesCount: p.sources?.length || 0,
    entitiesCount: p.entities?.length || 0,
    relationshipsCount: p.relationships?.length || 0,
    contradictionsCount: p.contradictions?.length || 0,
  })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function deleteProject(id: string): boolean {
  const existed = projectsMap.delete(id);
  if (existed) persistToDisk();
  return existed;
}

// Export formatters
export function exportProject(project: ResearchProject, format: 'json' | 'markdown' | 'csv' | 'html'): {
  content: string;
  mimeType: string;
  filename: string;
} {
  const safeTopic = project.topic.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();

  if (format === 'json') {
    return {
      content: JSON.stringify(project, null, 2),
      mimeType: 'application/json',
      filename: `research_${safeTopic}.json`,
    };
  }

  if (format === 'csv') {
    // Entities CSV
    const rows = [
      ['Entity Name', 'Type', 'Mention Count', 'Sources Count', 'Description'],
      ...project.entities.map((e) => [
        `"${e.name.replace(/"/g, '""')}"`,
        `"${e.type.replace(/"/g, '""')}"`,
        e.mentionCount,
        e.sources.length,
        `"${e.description.replace(/"/g, '""')}"`,
      ]),
    ];
    return {
      content: rows.map((r) => r.join(',')).join('\n'),
      mimeType: 'text/csv',
      filename: `entities_${safeTopic}.csv`,
    };
  }

  if (format === 'markdown') {
    let md = `# AI Research Synthesis: ${project.topic}\n\n`;
    md += `**Generated on**: ${new Date(project.createdAt).toLocaleDateString()} | **Status**: ${project.status}\n\n`;
    md += `## 1. Executive Research Overview\n`;
    md += `- **Collected Sources**: ${project.sources.length}\n`;
    md += `- **Discovered Entities**: ${project.entities.length}\n`;
    md += `- **Mapped Relationships**: ${project.relationships.length}\n`;
    md += `- **Potential Contradictions**: ${project.contradictions.length}\n\n`;

    md += `## 2. Research Sources & Summaries\n\n`;
    project.sources.forEach((s, idx) => {
      const summary = project.summaries.find((sum) => sum.docId === s.id);
      md += `### [${idx + 1}] ${s.title}\n`;
      md += `* **Source**: ${s.sourceName} | **Date**: ${s.publicationDate} | **Type**: ${s.documentType}\n`;
      md += `* **Authors**: ${s.authors.join(', ')}\n`;
      md += `* **URL / DOI**: [Read Source](${s.url})\n\n`;
      if (summary) {
        md += `> **Key Idea**: ${summary.keyIdea}\n\n`;
        md += `**Method / Approach**: ${summary.methodApproach}\n\n`;
        md += `**Important Findings**:\n`;
        summary.importantFindings.forEach((f) => {
          md += `- ${f}\n`;
        });
        md += `\n**Limitations Identified**:\n`;
        summary.limitations.forEach((l) => {
          md += `- ${l}\n`;
        });
        md += `\n`;
      }
      md += `---\n\n`;
    });

    md += `## 3. Potential Contradictions & Scientific Disagreements\n\n`;
    if (project.contradictions.length === 0) {
      md += `*No major empirical contradictions detected across the collected papers.*\n\n`;
    } else {
      project.contradictions.forEach((c, idx) => {
        md += `### Disagreement #${idx + 1}: ${c.topic}\n`;
        md += `**Type**: ${c.disagreementType}\n\n`;
        md += `* **Claim A** (${c.claimA.sourceTitle}): "${c.claimA.statement}"\n`;
        md += `  * *Evidence*: "${c.claimA.evidenceSnippet}"\n`;
        md += `* **Claim B** (${c.claimB.sourceTitle}): "${c.claimB.statement}"\n`;
        md += `  * *Evidence*: "${c.claimB.evidenceSnippet}"\n\n`;
        md += `**Neutral Analysis**: ${c.neutralAnalysis}\n\n`;
      });
    }

    md += `## 4. Key Entities\n\n`;
    md += `| Entity | Type | Mentions | Key Description |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    project.entities.slice(0, 20).forEach((e) => {
      md += `| ${e.name} | ${e.type} | ${e.mentionCount} | ${e.description} |\n`;
    });
    md += `\n`;

    md += `## 5. Timeline of Developments\n\n`;
    project.timeline.forEach((t) => {
      md += `- **${t.year}**: ${t.development} *(Source: ${t.sourceTitle})*\n`;
    });
    md += `\n`;

    md += `## 6. Research Gaps\n\n`;
    project.researchGaps.forEach((g) => {
      md += `### ${g.gapTitle} [${g.category === 'literature_limitation' ? 'Literature Limitation' : 'AI Inferred Gap'}]\n`;
      md += `${g.description}\n`;
      if (g.suggestedFutureWork) {
        md += `* **Suggested Future Direction**: ${g.suggestedFutureWork}\n\n`;
      }
    });

    return {
      content: md,
      mimeType: 'text/markdown',
      filename: `research_${safeTopic}.md`,
    };
  }

  // HTML Report view
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Research Synthesis: ${project.topic}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    h2 { color: #1e3a8a; margin-top: 32px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; background: #e0f2fe; color: #0369a1; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 12px 0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f1f5f9; }
  </style>
</head>
<body>
  <h1>AI Research Synthesis: ${project.topic}</h1>
  <p><strong>Generated on:</strong> ${new Date(project.createdAt).toLocaleDateString()} | <strong>Sources:</strong> ${project.sources.length} | <strong>Entities:</strong> ${project.entities.length} | <strong>Relationships:</strong> ${project.relationships.length}</p>
  
  <h2>Research Sources (${project.sources.length})</h2>
  ${project.sources.map(s => `
    <div class="card">
      <h3>${s.title}</h3>
      <p><span class="badge">${s.sourceName}</span> &bull; <em>${s.authors.join(', ')}</em> &bull; ${s.publicationDate}</p>
      <p>${s.abstract}</p>
      <p><a href="${s.url}" target="_blank">Open Source Article &rarr;</a></p>
    </div>
  `).join('')}

  <h2>Detected Contradictions & Potential Disagreements (${project.contradictions.length})</h2>
  ${project.contradictions.map(c => `
    <div class="warning">
      <strong>⚠️ Potential Disagreement Detected:</strong> ${c.topic} (${c.disagreementType})
      <p><strong>Claim A:</strong> ${c.claimA.statement} <em>(${c.claimA.sourceTitle})</em></p>
      <p><strong>Claim B:</strong> ${c.claimB.statement} <em>(${c.claimB.sourceTitle})</em></p>
      <p><strong>Neutral Analysis:</strong> ${c.neutralAnalysis}</p>
    </div>
  `).join('')}

  <h2>Discovered Entities (${project.entities.length})</h2>
  <table>
    <tr><th>Entity</th><th>Type</th><th>Mentions</th><th>Description</th></tr>
    ${project.entities.map(e => `<tr><td><strong>${e.name}</strong></td><td>${e.type}</td><td>${e.mentionCount}</td><td>${e.description}</td></tr>`).join('')}
  </table>
</body>
</html>`;

  return {
    content: html,
    mimeType: 'text/html',
    filename: `research_report_${safeTopic}.html`,
  };
}
