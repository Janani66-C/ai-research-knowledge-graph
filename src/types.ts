export type PipelineStep =
  | 'idle'
  | 'searching'
  | 'collecting'
  | 'extracting'
  | 'summarizing'
  | 'entities'
  | 'relationships'
  | 'contradictions'
  | 'graph'
  | 'complete'
  | 'error';

export type ResearchStatus = PipelineStep;

export interface ResearchSource {
  id: string;
  title: string;
  sourceName: string; // e.g., arXiv, PubMed, Nature, IEEE, CrossRef
  authors: string[];
  publicationDate: string;
  url: string;
  doi?: string;
  relevanceScore: number;
  documentType: string;
  abstract: string;
  fullTextSnippet: string;
  retrievedDate: string;
}

export interface DocumentSummary {
  docId: string;
  docTitle: string;
  sourceName: string;
  keyIdea: string;
  importantFindings: string[];
  methodApproach: string;
  keyEvidence: string[];
  limitations: string[];
  conclusion: string;
  factualDistinction: {
    factsStated: string[];
    authorClaims: string[];
    aiInterpretation: string[];
  };
}

export interface KnowledgeEntity {
  id: string;
  name: string;
  type: string; // Dynamically extracted (e.g. Technology, Algorithm, Concept, Biomarker, Organization)
  description: string;
  mentionCount: number;
  sources: string[]; // Document titles or IDs
  relatedEntityIds: string[];
}

export interface KnowledgeRelationship {
  id: string;
  sourceId: string;
  sourceName: string;
  targetId: string;
  targetName: string;
  relationship: string; // e.g. "uses", "enables", "prevents", "improves", "evaluates"
  evidence: string;
  sourceDocumentId: string;
  sourceDocumentTitle: string;
  confidence: number;
}

export interface ContradictionItem {
  id: string;
  topic: string;
  claimA: {
    statement: string;
    sourceDocId: string;
    sourceTitle: string;
    evidenceSnippet: string;
    publishedYear?: string;
  };
  claimB: {
    statement: string;
    sourceDocId: string;
    sourceTitle: string;
    evidenceSnippet: string;
    publishedYear?: string;
  };
  disagreementType: string;
  neutralAnalysis: string;
}

export interface TimelineEvent {
  id: string;
  year: string;
  development: string;
  importance: 'breakthrough' | 'method_introduced' | 'application' | 'recent_development' | 'standardization';
  sourceDocId: string;
  sourceTitle: string;
  isApproximate: boolean;
}

export interface ResearchGapItem {
  id: string;
  gapTitle: string;
  description: string;
  category: 'literature_limitation' | 'ai_inferred_gap';
  supportingSources: string[];
  suggestedFutureWork?: string;
}

export interface CorpusStatistics {
  totalSources: number;
  totalDocuments: number;
  totalEntities: number;
  totalRelationships: number;
  totalContradictions: number;
  researchDate: string;
  topEntities: { name: string; type: string; count: number }[];
  entityTypeDistribution: { type: string; count: number; color?: string }[];
  relationshipDistribution: { relation: string; count: number }[];
  themeClusters: { theme: string; frequency: number; keySources: string[] }[];
}

export interface ResearchProject {
  id: string;
  topic: string;
  searchQuery: string;
  createdAt: string;
  updatedAt: string;
  status: PipelineStep;
  progressPercent: number;
  progressMessage: string;
  sources: ResearchSource[];
  summaries: DocumentSummary[];
  entities: KnowledgeEntity[];
  relationships: KnowledgeRelationship[];
  contradictions: ContradictionItem[];
  timeline: TimelineEvent[];
  researchGaps: ResearchGapItem[];
  corpusStats: CorpusStatistics;
}

export interface AskResearchResponse {
  question: string;
  answer: string;
  keyDirectAnswer: string;
  citedSources: {
    docId: string;
    sourceTitle: string;
    snippet: string;
  }[];
  entitiesDiscussed: string[];
  confidenceNote: string;
}
