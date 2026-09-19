import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { KnowledgeEntity, KnowledgeRelationship, ResearchSource } from '../types';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Filter,
  X,
  ExternalLink,
  ChevronDown,
  Layers,
  FileText,
  Network,
  Crosshair,
  Sparkles,
  ArrowRight,
  Plus
} from 'lucide-react';
import { useDebounce } from '../utils/useDebounce';

interface KnowledgeGraphProps {
  entities: KnowledgeEntity[];
  relationships: KnowledgeRelationship[];
  topic: string;
  sources?: ResearchSource[];
  onSelectEntity?: (entity: KnowledgeEntity) => void;
}

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: string;
  isMainTopic: boolean;
  tier: 'center' | 'primary' | 'secondary';
  mentionCount: number;
  sources: string[];
  description: string;
  relatedEntityIds: string[];
  connectionsCount: number;
  radius: number;
}

interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  id: string;
  source: string | NodeDatum;
  target: string | NodeDatum;
  relationship: string;
  evidence: string;
  sourceDocumentTitle: string;
  sourceDocumentId?: string;
  sourceName?: string;
  targetName?: string;
}

// Category palette tailored for visual clarity & contrast
const TYPE_COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  'Main Topic': { bg: '#0f172a', border: '#334155', text: '#ffffff' },
  Technology: { bg: '#2563eb', border: '#1d4ed8', text: '#ffffff' },
  Method: { bg: '#0d9488', border: '#0f766e', text: '#ffffff' },
  Methodology: { bg: '#0d9488', border: '#0f766e', text: '#ffffff' },
  Algorithm: { bg: '#7c3aed', border: '#6d28d9', text: '#ffffff' },
  Concept: { bg: '#ea580c', border: '#c2410c', text: '#ffffff' },
  Organization: { bg: '#4f46e5', border: '#4338ca', text: '#ffffff' },
  Person: { bg: '#db2777', border: '#be185d', text: '#ffffff' },
  Biomarker: { bg: '#e11d48', border: '#be123c', text: '#ffffff' },
  Material: { bg: '#059669', border: '#047857', text: '#ffffff' },
  Metric: { bg: '#d97706', border: '#b45309', text: '#ffffff' },
};

function getNodeColors(type: string, isMain: boolean) {
  if (isMain) {
    return { bg: '#0f172a', border: '#334155', text: '#ffffff' };
  }
  if (TYPE_COLOR_MAP[type]) {
    return TYPE_COLOR_MAP[type];
  }
  // Adaptive deterministic hashing for any unforeseen types from research results
  let hash = 0;
  for (let i = 0; i < type.length; i++) hash = type.charCodeAt(i) + ((hash << 5) - hash);
  const palette = [
    { bg: '#2563eb', border: '#1d4ed8', text: '#ffffff' },
    { bg: '#0d9488', border: '#0f766e', text: '#ffffff' },
    { bg: '#7c3aed', border: '#6d28d9', text: '#ffffff' },
    { bg: '#ea580c', border: '#c2410c', text: '#ffffff' },
    { bg: '#059669', border: '#047857', text: '#ffffff' },
    { bg: '#0891b2', border: '#0e7490', text: '#ffffff' },
    { bg: '#4f46e5', border: '#4338ca', text: '#ffffff' },
  ];
  return palette[Math.abs(hash) % palette.length];
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  entities,
  relationships,
  topic,
  sources = [],
  onSelectEntity,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  // View state: 'graph' or 'evidence'
  const [activeView, setActiveView] = useState<'graph' | 'evidence'>('graph');

  // Interactive controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [focusEntityId, setFocusEntityId] = useState<string | null>(null);

  // Progressive disclosure: how many secondary concepts to reveal
  const [revealedCount, setRevealedCount] = useState<number>(10);

  // Debounced search query for smooth filtering without layout thrashing
  const debouncedSearchQuery = useDebounce(searchQuery, 200);

  // Selected elements for Side Panel
  const [activeNode, setActiveNode] = useState<NodeDatum | null>(null);
  const [activeLink, setActiveLink] = useState<LinkDatum | null>(null);

  // Hover Tooltip state
  const [hoveredNode, setHoveredNode] = useState<{
    node: NodeDatum;
    x: number;
    y: number;
  } | null>(null);

  // Available unique types from dynamic entities
  const availableTypes = useMemo(() => {
    return Array.from(new Set(entities.map((e) => e.type || 'Concept'))).filter(Boolean);
  }, [entities]);

  // Initial type filter: by default, all types selected
  useEffect(() => {
    setSelectedTypes(new Set(availableTypes));
  }, [availableTypes]);

  // Derive Central Topic node + tiered entity hierarchy
  const { allNodes, allLinks, primaryCount, secondaryCount } = useMemo(() => {
    const centerNodeId = 'node-center-topic';

    // Count mentions / connections for entities
    const connCounts: Record<string, number> = {};
    relationships.forEach((r) => {
      connCounts[r.sourceId] = (connCounts[r.sourceId] || 0) + 1;
      connCounts[r.targetId] = (connCounts[r.targetId] || 0) + 1;
    });

    // Score entities by importance (mentions * 2 + connections)
    const scoredEntities = entities.map((e) => ({
      ...e,
      score: (e.mentionCount || 1) * 2 + (connCounts[e.id] || 0),
    }));
    scoredEntities.sort((a, b) => b.score - a.score);

    // Primary tier: Top 6-8 most influential concepts
    const primaryLimit = Math.min(7, Math.ceil(scoredEntities.length * 0.45));
    const primarySet = new Set(scoredEntities.slice(0, primaryLimit).map((e) => e.id));

    // Construct Main Topic Node
    const centerNode: NodeDatum = {
      id: centerNodeId,
      name: topic,
      type: 'Main Topic',
      isMainTopic: true,
      tier: 'center',
      mentionCount: entities.reduce((acc, e) => acc + (e.mentionCount || 1), 0),
      sources: Array.from(new Set(entities.flatMap((e) => e.sources || []))),
      description: `Central research subject synthesized across ${entities.length} primary concepts and ${relationships.length} documented relationships.`,
      relatedEntityIds: scoredEntities.map((e) => e.id),
      connectionsCount: scoredEntities.length,
      radius: 38,
    };

    const entityNodes: NodeDatum[] = scoredEntities.map((e) => {
      const isPrimary = primarySet.has(e.id);
      return {
        id: e.id,
        name: e.name,
        type: e.type || 'Concept',
        isMainTopic: false,
        tier: isPrimary ? 'primary' : 'secondary',
        mentionCount: e.mentionCount || 1,
        sources: e.sources || [],
        description: e.description || `Extracted research entity in the ${e.type || 'relevant'} domain.`,
        relatedEntityIds: e.relatedEntityIds || [],
        connectionsCount: connCounts[e.id] || 0,
        radius: isPrimary ? 24 : 18,
      };
    });

    const nodes = [centerNode, ...entityNodes];

    // Build synthesized links
    // 1. Links between entities from backend data
    const rawLinks: LinkDatum[] = relationships.map((r, idx) => ({
      id: r.id || `rel-${idx}`,
      source: r.sourceId,
      target: r.targetId,
      relationship: r.relationship || 'related to',
      evidence: r.evidence || 'Documented correlation identified in published literature.',
      sourceDocumentTitle: r.sourceDocumentTitle || 'Academic literature corpus',
      sourceDocumentId: r.sourceDocumentId,
      sourceName: r.sourceName,
      targetName: r.targetName,
    }));

    // 2. Ensure Primary Concepts have a direct visual link to the Central Topic
    const existingPairs = new Set(
      rawLinks.map((l) => `${typeof l.source === 'string' ? l.source : (l.source as any).id}-${typeof l.target === 'string' ? l.target : (l.target as any).id}`)
    );

    const centerLinks: LinkDatum[] = [];
    entityNodes.forEach((node) => {
      if (node.tier === 'primary') {
        const pairKey1 = `${centerNodeId}-${node.id}`;
        const pairKey2 = `${node.id}-${centerNodeId}`;
        if (!existingPairs.has(pairKey1) && !existingPairs.has(pairKey2)) {
          centerLinks.push({
            id: `link-center-${node.id}`,
            source: centerNodeId,
            target: node.id,
            relationship: 'explores',
            evidence: `Core concept directly investigated in the context of ${topic}.`,
            sourceDocumentTitle: node.sources[0] || 'Domain literature',
            sourceName: topic,
            targetName: node.name,
          });
        }
      }
    });

    return {
      allNodes: nodes,
      allLinks: [...centerLinks, ...rawLinks],
      primaryCount: primarySet.size,
      secondaryCount: scoredEntities.length - primarySet.size,
    };
  }, [entities, relationships, topic]);

  // Progressive Disclosure + Filtering + Focus Mode
  const { visibleNodes, visibleLinks } = useMemo(() => {
    let nodes = allNodes;

    // 1. Focus Mode Filter: if focusEntityId is set, show only it, its neighbors, and center
    if (focusEntityId) {
      const neighborIds = new Set<string>();
      neighborIds.add(focusEntityId);
      allLinks.forEach((l) => {
        const sId = typeof l.source === 'string' ? l.source : l.source.id;
        const tId = typeof l.target === 'string' ? l.target : l.target.id;
        if (sId === focusEntityId) neighborIds.add(tId);
        if (tId === focusEntityId) neighborIds.add(sId);
      });
      nodes = nodes.filter((n) => n.isMainTopic || neighborIds.has(n.id));
    } else {
      // 2. Progressive Disclosure: Central topic + primary concepts + revealed secondary concepts
      let secondariesRevealed = 0;
      nodes = nodes.filter((n) => {
        if (n.tier === 'center' || n.tier === 'primary') return true;
        if (secondariesRevealed < revealedCount) {
          secondariesRevealed++;
          return true;
        }
        return false;
      });

      // 3. Type Category Filter
      if (selectedTypes.size > 0) {
        nodes = nodes.filter((n) => n.isMainTopic || selectedTypes.has(n.type));
      }
    }

    // 4. Search Filter (if query is typed, highlight/retain matching nodes)
    const validNodeIds = new Set(nodes.map((n) => n.id));

    // Filter links that have both endpoints in visible nodes
    const links = allLinks.filter((l) => {
      const sId = typeof l.source === 'string' ? l.source : l.source.id;
      const tId = typeof l.target === 'string' ? l.target : l.target.id;
      return validNodeIds.has(sId) && validNodeIds.has(tId);
    });

    return {
      visibleNodes: nodes,
      visibleLinks: links,
    };
  }, [allNodes, allLinks, focusEntityId, revealedCount, selectedTypes]);

  // Search match ids (debounced to avoid recalculation per keystroke)
  const matchedNodeIds = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return new Set<string>();
    const q = debouncedSearchQuery.toLowerCase();
    return new Set(
      allNodes
        .filter((n) => n.name.toLowerCase().includes(q) || n.type.toLowerCase().includes(q))
        .map((n) => n.id)
    );
  }, [allNodes, debouncedSearchQuery]);

  // D3 Rendering & Simulation
  useEffect(() => {
    if (activeView !== 'graph' || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Defs: markers for directional arrows
    const defs = svg.append('defs');
    defs
      .append('marker')
      .attr('id', 'rcm-arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .append('path')
      .attr('d', 'M 0,-3 L 6,0 L 0,3')
      .attr('fill', '#94a3b8');

    // Main graph group with zoom & pan
    const g = svg.append('g').attr('class', 'connection-map-canvas');
    gRef.current = g;

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Initial center transform
    svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));

    // Deep clone nodes and links so D3 simulation doesn't mutate state objects directly
    const simNodes: NodeDatum[] = visibleNodes.map((d) => ({
      ...d,
      // Fix center node near the center
      fx: d.isMainTopic ? width / 2 : undefined,
      fy: d.isMainTopic ? height / 2 : undefined,
    }));

    const simLinks: LinkDatum[] = visibleLinks.map((l) => ({
      ...l,
      source: typeof l.source === 'string' ? l.source : l.source.id,
      target: typeof l.target === 'string' ? l.target : l.target.id,
    }));

    // Setup force simulation with generous spacing to avoid overlap
    const simulation = d3
      .forceSimulation<NodeDatum>(simNodes)
      .force(
        'link',
        d3
          .forceLink<NodeDatum, LinkDatum>(simLinks)
          .id((d) => d.id)
          .distance((d) => {
            const s = d.source as NodeDatum;
            const t = d.target as NodeDatum;
            if (s?.isMainTopic || t?.isMainTopic) return 170;
            return 130;
          })
          .strength(0.6)
      )
      .force('charge', d3.forceManyBody().strength((d) => ((d as NodeDatum).isMainTopic ? -700 : -320)))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.08))
      .force('collide', d3.forceCollide<NodeDatum>().radius((d) => d.radius + 32).iterations(2));

    // 1. Link Lines Container
    const linkGroup = g.append('g').attr('class', 'links');
    const links = linkGroup
      .selectAll('line')
      .data(simLinks)
      .enter()
      .append('line')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1.8)
      .attr('stroke-opacity', 0.8)
      .attr('marker-end', 'url(#rcm-arrow)')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        setActiveNode(null);
        setActiveLink(d);
      })
      .on('mouseenter', function () {
        d3.select(this).attr('stroke', '#2563eb').attr('stroke-width', 2.8);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('stroke', '#cbd5e1').attr('stroke-width', 1.8);
      });

    // 2. Link Labels (Pill with relation text e.g., "uses", "affects", "enables")
    const labelGroup = g.append('g').attr('class', 'link-labels');
    const linkLabels = labelGroup
      .selectAll('g')
      .data(simLinks)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        setActiveNode(null);
        setActiveLink(d);
      });

    // Background pill for label legibility
    linkLabels
      .append('rect')
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', '#ffffff')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1);

    linkLabels
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'central')
      .attr('font-size', '9px')
      .attr('font-weight', '600')
      .attr('fill', '#475569')
      .attr('letter-spacing', '0.02em')
      .text((d) => d.relationship);

    // Adjust rect size to fit label text
    linkLabels.each(function () {
      const text = d3.select(this).select('text').node() as SVGTextElement;
      if (text) {
        const bbox = text.getBBox();
        d3.select(this)
          .select('rect')
          .attr('x', bbox.x - 5)
          .attr('y', bbox.y - 2)
          .attr('width', bbox.width + 10)
          .attr('height', bbox.height + 4);
      }
    });

    // 3. Nodes Container
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodes = nodeGroup
      .selectAll('g')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, NodeDatum>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            if (!d.isMainTopic) {
              d.fx = null;
              d.fy = null;
            }
          })
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        setActiveLink(null);
        setActiveNode(d);
        if (onSelectEntity && !d.isMainTopic) {
          const original = entities.find((e) => e.id === d.id);
          if (original) onSelectEntity(original);
        }
      })
      .on('mouseenter', (event, d) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setHoveredNode({
            node: d,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        }
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
      });

    // Outer subtle pulse ring for Main Topic
    nodes
      .filter((d) => d.isMainTopic)
      .append('circle')
      .attr('r', (d) => d.radius + 6)
      .attr('fill', 'none')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3 3')
      .attr('opacity', 0.8);

    // Main Node Circle
    nodes
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => getNodeColors(d.type, d.isMainTopic).bg)
      .attr('stroke', (d) => {
        if (matchedNodeIds.has(d.id)) return '#f59e0b';
        return '#ffffff';
      })
      .attr('stroke-width', (d) => (matchedNodeIds.has(d.id) ? 3.5 : 2.5))
      .attr('filter', (d) => (d.isMainTopic ? 'drop-shadow(0 4px 6px rgba(15, 23, 42, 0.15))' : 'none'));

    // Inner icon / dot indicator for secondary concepts
    nodes
      .filter((d) => d.tier === 'secondary')
      .append('circle')
      .attr('r', 3)
      .attr('fill', '#ffffff')
      .attr('opacity', 0.7);

    // Node Typography / Labels
    // Center node text inside the circle
    nodes
      .filter((d) => d.isMainTopic)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'central')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('fill', '#ffffff')
      .attr('pointer-events', 'none')
      .text((d) => (d.name.length > 18 ? d.name.substring(0, 16) + '..' : d.name));

    // Surrounding nodes: text placed beneath the node with crisp outline
    nodes
      .filter((d) => !d.isMainTopic)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => d.radius + 14)
      .attr('font-size', (d) => (d.tier === 'primary' ? '11px' : '10px'))
      .attr('font-weight', (d) => (d.tier === 'primary' ? '600' : '500'))
      .attr('fill', '#1e293b')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3)
      .attr('paint-order', 'stroke')
      .attr('pointer-events', 'none')
      .text((d) => (d.name.length > 20 ? d.name.substring(0, 18) + '...' : d.name));

    // Simulation tick update
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabels.attr('transform', (d: any) => {
        const x = (d.source.x + d.target.x) / 2;
        const y = (d.source.y + d.target.y) / 2;
        return `translate(${x},${y})`;
      });

      nodes.attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Clicking empty background clears selections
    svg.on('click', () => {
      setActiveNode(null);
      setActiveLink(null);
    });

    return () => {
      simulation.stop();
    };
  }, [visibleNodes, visibleLinks, activeView, matchedNodeIds]);

  // Zoom helpers
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 0.75);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(350).call(zoomRef.current.transform, d3.zoomIdentity);
  };

  // Toggle category in type filter
  const toggleTypeFilter = (type: string) => {
    const next = new Set(selectedTypes);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    setSelectedTypes(next);
  };

  // Resolve connected nodes for active node
  const connectedNodesForActive = useMemo(() => {
    if (!activeNode) return [];
    const connectedIds = new Set<string>();
    allLinks.forEach((l) => {
      const sId = typeof l.source === 'string' ? l.source : l.source.id;
      const tId = typeof l.target === 'string' ? l.target : l.target.id;
      if (sId === activeNode.id) connectedIds.add(tId);
      if (tId === activeNode.id) connectedIds.add(sId);
    });
    return allNodes.filter((n) => connectedIds.has(n.id) && n.id !== activeNode.id);
  }, [activeNode, allLinks, allNodes]);

  // Resolve source articles for active link or node
  const getSourceDoc = (docTitle: string) => {
    return sources.find(
      (s) =>
        s.title.toLowerCase() === docTitle.toLowerCase() ||
        s.title.toLowerCase().includes(docTitle.toLowerCase()) ||
        docTitle.toLowerCase().includes(s.title.toLowerCase())
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col h-full w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs select-none"
    >
      {/* 1. Top Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-100 bg-white shrink-0 z-10">
        {/* Left: View Mode Toggle & Search */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Toggle: Graph View vs. Evidence View */}
          <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveView('graph')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                activeView === 'graph'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Graph View</span>
            </button>
            <button
              onClick={() => setActiveView('evidence')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                activeView === 'evidence'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Evidence View</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search in graph..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-2.5 py-1 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-md outline-none focus:border-blue-500 w-44 sm:w-48 text-slate-800 placeholder-slate-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition ${
                selectedTypes.size < availableTypes.length
                  ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>Filter</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showFilterDropdown && (
              <div className="absolute left-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-lg shadow-lg p-2.5 z-30 space-y-1.5 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Entity Categories</span>
                  <button
                    onClick={() => setSelectedTypes(new Set(availableTypes))}
                    className="text-blue-600 hover:underline capitalize"
                  >
                    Select All
                  </button>
                </div>
                {availableTypes.map((type) => {
                  const isChecked = selectedTypes.has(type);
                  return (
                    <label
                      key={type}
                      className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-1 hover:bg-slate-50 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTypeFilter(type)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                      />
                      <span className="truncate">{type}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Focus Mode Active Indicator */}
          {focusEntityId && (
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-xs">
              <Crosshair className="w-3 h-3" />
              <span className="truncate max-w-[140px]">
                Focused on: {allNodes.find((n) => n.id === focusEntityId)?.name}
              </span>
              <button
                onClick={() => setFocusEntityId(null)}
                className="text-blue-700 hover:text-blue-900 ml-1 font-bold"
                title="Exit Focus Mode"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Right: Progressive Disclosure & Zoom Controls */}
        <div className="flex items-center gap-2">
          {/* "Show More Connections" button */}
          {secondaryCount > revealedCount && !focusEntityId && activeView === 'graph' && (
            <button
              onClick={() => setRevealedCount((prev) => prev + 5)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition shadow-2xs"
            >
              <Plus className="w-3 h-3" />
              <span>Show more connections ({Math.min(5, secondaryCount - revealedCount)} more)</span>
            </button>
          )}

          {/* Zoom Controls */}
          {activeView === 'graph' && (
            <div className="flex items-center gap-0.5 border border-slate-200 rounded-md bg-slate-50 p-0.5">
              <button
                onClick={handleZoomIn}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition"
                title="Reset view"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Visual Canvas / Evidence List Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-slate-50/40">
        {activeView === 'graph' ? (
          <>
            {/* SVG Force-Directed Canvas */}
            <svg
              ref={svgRef}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              style={{ minHeight: '480px' }}
            />

            {/* Hover Tooltip */}
            {hoveredNode && !activeNode && !activeLink && (
              <div
                className="absolute z-20 pointer-events-none bg-slate-900/90 text-white rounded-lg px-3 py-2 text-xs shadow-md backdrop-blur-xs space-y-1 max-w-xs transition-transform duration-75"
                style={{
                  left: `${Math.min(hoveredNode.x + 16, (containerRef.current?.clientWidth || 800) - 220)}px`,
                  top: `${Math.min(hoveredNode.y + 16, (containerRef.current?.clientHeight || 600) - 100)}px`,
                }}
              >
                <div className="font-semibold text-sm leading-snug">{hoveredNode.node.name}</div>
                <div className="text-[11px] text-slate-300 flex items-center gap-2">
                  <span className="font-medium text-blue-300">{hoveredNode.node.type}</span>
                  <span>•</span>
                  <span>{hoveredNode.node.mentionCount} mentions</span>
                  <span>•</span>
                  <span>{hoveredNode.node.sources.length} sources</span>
                </div>
              </div>
            )}

            {/* Dynamic Graph Legend (Bottom-Left) */}
            <div className="absolute bottom-3 left-4 bg-white/90 backdrop-blur-xs border border-slate-200/90 rounded-lg px-3 py-2 shadow-2xs text-[11px] text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 max-w-lg pointer-events-auto">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Legend:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-2 ring-slate-200" />
                <span className="font-medium text-slate-800">Main Topic</span>
              </div>
              {availableTypes.slice(0, 4).map((type) => {
                const color = getNodeColors(type, false).bg;
                return (
                  <div key={type} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span>{type}</span>
                  </div>
                );
              })}
              {availableTypes.length > 4 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>Other Entities</span>
                </div>
              )}
            </div>

            {/* Hint in bottom right */}
            <div className="absolute bottom-3 right-4 text-[11px] text-slate-400 bg-white/80 px-2.5 py-1 rounded border border-slate-200/60 pointer-events-none hidden sm:block">
              Click node or line for evidence details
            </div>
          </>
        ) : (
          /* EVIDENCE VIEW: Readable statement format answering "HOW are they connected?" and "WHICH source supports it?" */
          <div className="h-full overflow-y-auto p-6 max-w-3xl mx-auto space-y-4">
            <div className="pb-2 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">
                Grounded Research Connections & Evidence
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every connection in this research map is backed by empirical evidence and literature citations.
              </p>
            </div>

            <div className="space-y-3">
              {visibleLinks.map((link, idx) => {
                const sName =
                  link.sourceName ||
                  (typeof link.source === 'object' ? link.source.name : link.source);
                const tName =
                  link.targetName ||
                  (typeof link.target === 'object' ? link.target.name : link.target);
                const matchedSource = getSourceDoc(link.sourceDocumentTitle);

                return (
                  <div
                    key={link.id || idx}
                    className="p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition space-y-3 text-xs"
                  >
                    {/* Readable connection statement */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm bg-slate-100 px-2 py-0.5 rounded">
                        {sName}
                      </span>
                      <span className="text-blue-600 font-medium font-mono text-xs px-1.5 py-0.5 bg-blue-50 rounded">
                        → {link.relationship} →
                      </span>
                      <span className="font-semibold text-slate-900 text-sm bg-slate-100 px-2 py-0.5 rounded">
                        {tName}
                      </span>
                    </div>

                    {/* Evidence Snippet */}
                    <div className="bg-slate-50 p-3 rounded-md border border-slate-100 text-slate-700 italic leading-relaxed">
                      "{link.evidence}"
                    </div>

                    {/* Source citation */}
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5 truncate max-w-md">
                        <span className="font-semibold text-slate-600">Supported by:</span>
                        <span className="truncate italic">{link.sourceDocumentTitle}</span>
                      </div>

                      {matchedSource?.url && (
                        <a
                          href={matchedSource.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium shrink-0 ml-3"
                        >
                          <span>Read Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Interactive Clean Side Panel (When a Node or Link is clicked) */}
        {(activeNode || activeLink) && (
          <div className="absolute top-0 right-0 h-full w-80 sm:w-96 bg-white border-l border-slate-200 shadow-xl z-30 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {activeNode ? 'Entity Details' : 'Relationship Evidence'}
              </span>
              <button
                onClick={() => {
                  setActiveNode(null);
                  setActiveLink(null);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
              {activeNode && (
                <>
                  {/* Entity Name & Type */}
                  <div>
                    <span className="inline-block text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded mb-1.5 uppercase">
                      {activeNode.type}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 leading-snug">
                      {activeNode.name}
                    </h2>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Description
                    </h4>
                    <p className="leading-relaxed text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {activeNode.description}
                    </p>
                  </div>

                  {/* Focus on this button */}
                  {!activeNode.isMainTopic && (
                    <div>
                      <button
                        onClick={() => {
                          setFocusEntityId(activeNode.id);
                          setActiveNode(null);
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition shadow-xs"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>Focus on this concept</span>
                      </button>
                    </div>
                  )}

                  {/* Mentioned in */}
                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Mentioned In
                    </h4>
                    <div className="text-slate-800 font-medium">
                      {activeNode.mentionCount} {activeNode.mentionCount === 1 ? 'mention' : 'mentions'} across research corpus
                    </div>
                  </div>

                  {/* Connected To */}
                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Connected To ({connectedNodesForActive.length})
                    </h4>
                    <div className="space-y-1.5">
                      {connectedNodesForActive.slice(0, 8).map((node) => (
                        <div
                          key={node.id}
                          onClick={() => {
                            setActiveNode(node);
                          }}
                          className="flex items-center justify-between p-2 rounded-md border border-slate-100 bg-slate-50/60 hover:bg-slate-100 cursor-pointer transition text-xs"
                        >
                          <span className="font-medium text-slate-800 truncate mr-2">
                            {node.name}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {node.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Supporting Sources */}
                  {activeNode.sources.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Supporting Sources
                      </h4>
                      <ul className="space-y-1.5">
                        {activeNode.sources.slice(0, 4).map((src, i) => {
                          const matched = getSourceDoc(src);
                          return (
                            <li
                              key={i}
                              className="p-2 rounded-md border border-slate-100 bg-slate-50 space-y-1"
                            >
                              <div className="font-medium text-slate-800 line-clamp-2">
                                {src}
                              </div>
                              {matched?.url && (
                                <a
                                  href={matched.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-medium"
                                >
                                  <span>Read Source</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {activeLink && (
                <>
                  {/* Visual Connection flow */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-center space-y-2">
                    <div className="font-bold text-sm text-slate-900">
                      {activeLink.sourceName ||
                        (typeof activeLink.source === 'object'
                          ? activeLink.source.name
                          : activeLink.source)}
                    </div>
                    <div className="inline-flex items-center justify-center gap-1 text-xs text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full font-medium">
                      ↓ {activeLink.relationship} ↓
                    </div>
                    <div className="font-bold text-sm text-slate-900">
                      {activeLink.targetName ||
                        (typeof activeLink.target === 'object'
                          ? activeLink.target.name
                          : activeLink.target)}
                    </div>
                  </div>

                  {/* Evidence Snippet */}
                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Documented Evidence
                    </h4>
                    <p className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-lg text-slate-800 leading-relaxed italic text-xs">
                      "{activeLink.evidence}"
                    </p>
                  </div>

                  {/* Source citation */}
                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Literature Source
                    </h4>
                    <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-2">
                      <div className="font-medium text-slate-900 leading-snug">
                        {activeLink.sourceDocumentTitle}
                      </div>

                      {(() => {
                        const matched = getSourceDoc(activeLink.sourceDocumentTitle);
                        if (matched?.url) {
                          return (
                            <a
                              href={matched.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-semibold pt-1"
                            >
                              <span>Read Source</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
