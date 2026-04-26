/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { X, Pencil } from 'lucide-react';
import { graph } from '../../services/api';
import type { GraphData, GraphLink, GraphNode, MainCategory } from '../../types';

interface KnowledgeGraphProps {
    /** Opens the same item edit flow as list view (parent owns the modal). */
    onEditItem?: (node: GraphNode) => void;
}

type CategoryStyle = {
    base: string;
    glow: string;
};

const CATEGORY_PALETTE: Record<MainCategory, CategoryStyle> = {
    task: { base: '#3fb950', glow: 'rgba(63, 185, 80, 0.85)' },
    idea: { base: '#d29922', glow: 'rgba(210, 153, 34, 0.85)' },
    thought: { base: '#bc8cff', glow: 'rgba(188, 140, 255, 0.85)' },
};

const DEFAULT_STYLE: CategoryStyle = { base: '#8b949e', glow: 'rgba(139, 148, 158, 0.7)' };
const CANVAS_BG = '#161b22';

const styleForNode = (node: GraphNode): CategoryStyle =>
    CATEGORY_PALETTE[node.category as MainCategory] ?? DEFAULT_STYLE;

const linkEndpointId = (endpoint: GraphLink['source']): number => {
    if (typeof endpoint === 'number') return endpoint;
    if (endpoint && typeof endpoint === 'object' && 'id' in endpoint) {
        return (endpoint as GraphNode).id;
    }
    return Number(endpoint);
};

const categoryBadgeClass: Record<MainCategory, string> = {
    task: 'bg-[#3fb950]/20 text-[#3fb950] border-[#3fb950]/40',
    idea: 'bg-[#d29922]/20 text-[#d29922] border-[#d29922]/40',
    thought: 'bg-[#bc8cff]/20 text-[#bc8cff] border-[#bc8cff]/40',
};

type CanvasMode = 'details' | 'connect';

const KnowledgeGraph = ({ onEditItem }: KnowledgeGraphProps) => {
    const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [canvasMode, setCanvasMode] = useState<CanvasMode>('details');
    const [connectAnchor, setConnectAnchor] = useState<GraphNode | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [hoverNode, setHoverNode] = useState<any | null>(null);
    const [highlightNodes, setHighlightNodes] = useState<Set<any>>(new Set());
    const [highlightLinks, setHighlightLinks] = useState<Set<any>>(new Set());

    const graphPaneRef = useRef<HTMLDivElement>(null);
    const fgRef = useRef<any>(null);

    const loadGraph = useCallback(async () => {
        try {
            const graphData = await graph.getData();
            setData(graphData);
        } catch (err) {
            console.error('Failed to load graph data', err);
            setError('Could not load your knowledge graph.');
        }
    }, []);

    useEffect(() => {
        loadGraph();
    }, [loadGraph]);

    useEffect(() => {
        const updateDimensions = () => {
            if (graphPaneRef.current) {
                const rect = graphPaneRef.current.getBoundingClientRect();
                setDimensions({
                    width: Math.max(320, Math.floor(rect.width)),
                    height: Math.max(500, Math.floor(rect.height)),
                });
            }
        };

        updateDimensions();
        const resizeObserver = new ResizeObserver(updateDimensions);
        if (graphPaneRef.current) {
            resizeObserver.observe(graphPaneRef.current);
        }
        window.addEventListener('resize', updateDimensions);
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateDimensions);
        };
    }, []);

    useEffect(() => {
        const updateDimensions = () => {
            if (graphPaneRef.current) {
                const rect = graphPaneRef.current.getBoundingClientRect();
                setDimensions({
                    width: Math.max(320, Math.floor(rect.width)),
                    height: Math.max(500, Math.floor(rect.height)),
                });
            }
        };
        const timeout = window.setTimeout(() => {
            updateDimensions();
            fgRef.current?.zoomToFit?.(500, 40);
        }, 260);
        return () => window.clearTimeout(timeout);
    }, [selectedNode]);

    useEffect(() => {
        let frameId = 0;
        const tick = () => {
            fgRef.current?.refresh?.();
            frameId = window.requestAnimationFrame(tick);
        };
        frameId = window.requestAnimationFrame(tick);
        return () => window.cancelAnimationFrame(frameId);
    }, []);

    const nodeById = useMemo(() => {
        const map = new Map<number, any>();
        for (const node of data.nodes) {
            map.set(node.id, node);
        }
        return map;
    }, [data.nodes]);

    useEffect(() => {
        const fg = fgRef.current;
        if (!fg) return;

        const linkForce = fg.d3Force('link');
        if (linkForce) {
            linkForce
                .distance(130)
                .strength(0.18);
        }

        const chargeForce = fg.d3Force('charge');
        if (chargeForce) {
            chargeForce.strength(-160);
        }

        fg.d3ReheatSimulation();
    }, [data]);

    const handleNodeHover = useCallback((node: any) => {
        if (!node) {
            setHoverNode(null);
            setHighlightNodes(new Set());
            setHighlightLinks(new Set());
            return;
        }

        const nodeId = node.id as number;
        const nextNodes = new Set<any>([node]);
        const nextLinks = new Set<any>();

        for (const link of data.links) {
            const source = linkEndpointId(link.source);
            const target = linkEndpointId(link.target);

            if (source === nodeId || target === nodeId) {
                const sourceNode = typeof link.source === 'object' ? link.source : nodeById.get(source);
                const targetNode = typeof link.target === 'object' ? link.target : nodeById.get(target);
                if (sourceNode) nextNodes.add(sourceNode);
                if (targetNode) nextNodes.add(targetNode);
                nextLinks.add(link);
            }
        }

        setHoverNode(node);
        setHighlightNodes(nextNodes);
        setHighlightLinks(nextLinks);
    }, [data.links, nodeById]);

    const drawNode = useCallback(
        (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            if (node.x === undefined || node.y === undefined) return;

            const isHovered = hoverNode === node;
            const isNeighbor = highlightNodes.has(node);
            const opacity = hoverNode ? (isNeighbor || isHovered ? 1 : 0.1) : 1;
            const style = styleForNode(node as GraphNode);
            const breath = (Math.sin(performance.now() / 850 + Number(node.id || 0) * 0.75) + 1) / 2;
            const radius = 7.5 + breath * 1.8;
            const glowStrength = 14 + breath * 14;
            const isConnectAnchor = canvasMode === 'connect' && connectAnchor && connectAnchor.id === node.id;

            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.shadowColor = style.glow;
            ctx.shadowBlur = opacity >= 1 ? glowStrength : 0;
            ctx.fillStyle = style.base;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2, false);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.lineWidth = 1.3 / globalScale;
            ctx.strokeStyle = isConnectAnchor ? 'rgba(125, 211, 252, 0.95)' : 'rgba(255, 255, 255, 0.45)';
            ctx.stroke();
            if (isConnectAnchor) {
                ctx.lineWidth = 2 / globalScale;
                ctx.strokeStyle = 'rgba(125, 211, 252, 0.6)';
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius + 4 / globalScale + breath * 2, 0, Math.PI * 2, false);
                ctx.stroke();
            }

            const label = (node.title ?? '') as string;
            if (label && globalScale > 1.1) {
                const fontSize = Math.max(10, 12 / globalScale);
                ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
                ctx.fillStyle = 'rgba(230, 237, 243, 0.9)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(label, node.x, node.y + radius + 4);
            }
            ctx.restore();
        },
        [canvasMode, connectAnchor, highlightNodes, hoverNode]
    );

    const linkColor = useCallback((link: any) => {
        const isHighlighted = highlightLinks.has(link);
        const alpha = hoverNode
            ? (isHighlighted ? 0.8 : 0.05)
            : 0.55;
        return `rgba(51, 65, 85, ${alpha})`;
    }, [highlightLinks, hoverNode]);

    const linkWidth = 1;

    const handleNodeClick = useCallback(
        async (node: any) => {
            if (canvasMode === 'connect') {
                if (typeof node.x === 'number' && typeof node.y === 'number') {
                    fgRef.current?.centerAt(node.x, node.y, 800);
                }
                const clicked = node as GraphNode;
                if (!connectAnchor) {
                    setConnectAnchor(clicked);
                    setSelectedNode(clicked);
                    setError(null);
                    return;
                }
                if (connectAnchor.id === clicked.id) {
                    setConnectAnchor(null);
                    setSelectedNode(null);
                    return;
                }
                setError(null);
                try {
                    await graph.createLink(connectAnchor.id, clicked.id, 'relates_to');
                    await loadGraph();
                    setConnectAnchor(null);
                    setSelectedNode(null);
                } catch (err: unknown) {
                    console.error('Failed to create link', err);
                    const msg =
                        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
                        'Could not create that link (it may already exist).';
                    setError(String(msg));
                }
                return;
            }

            if (typeof node.x === 'number' && typeof node.y === 'number') {
                fgRef.current?.centerAt(node.x, node.y, 1000);
                fgRef.current?.zoom(4, 1800);
            }
            setSelectedNode(node as GraphNode);
        },
        [canvasMode, connectAnchor, loadGraph]
    );

    const handleNodeDragEnd = useCallback((node: any) => {
        node.fx = node.x;
        node.fy = node.y;
    }, []);

    return (
        <div className="premium-card flex flex-row h-full min-h-[700px] w-full overflow-hidden">
            {selectedNode && (
                <aside className="premium-glass h-full w-[350px] shrink-0 border-r border-white/10 overflow-hidden">
                    <div className="h-full flex flex-col">
                        <div className="px-4 py-3 border-b border-white/10 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <span className={`inline-flex px-2 py-1 rounded-md border text-xs font-semibold uppercase tracking-wide ${categoryBadgeClass[selectedNode.category] || 'border-[#30363d] text-[#8b949e]'}`}>
                                    {selectedNode.category}
                                </span>
                                <h3 className="mt-2 text-[#e6edf3] font-bold text-base break-words">{selectedNode.title}</h3>
                                {canvasMode === 'connect' && connectAnchor && connectAnchor.id === selectedNode.id && (
                                    <p className="mt-2 text-xs leading-relaxed text-[#58a6ff]">
                                        Click another node on the graph to create a link. Click this node again to cancel.
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedNode(null);
                                    setConnectAnchor(null);
                                }}
                                className="p-1 rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]"
                                aria-label="Close details"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm">
                            {canvasMode === 'details' ? (
                                <>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-[#7d8590] mb-1">Description</p>
                                        <p className="text-[#c9d1d9] leading-6 whitespace-pre-wrap">
                                            {selectedNode.description?.trim() || 'No description available.'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-[#7d8590] mb-2">Tags</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(selectedNode.tags && selectedNode.tags.length > 0
                                                ? selectedNode.tags
                                                : [selectedNode.subcategory, selectedNode.life_area, selectedNode.status].filter(Boolean)
                                            ).map((tag) => (
                                                <span key={tag} className="px-2 py-1 rounded-md bg-[#161b22] border border-[#30363d] text-[#8b949e] text-xs">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : connectAnchor && connectAnchor.id === selectedNode.id ? (
                                <p className="text-[#8b949e] text-sm leading-relaxed">
                                    New links use the type <span className="text-[#e6edf3]">relates_to</span>.
                                </p>
                            ) : (
                                <p className="text-[#8b949e] text-sm leading-relaxed">
                                    Click a node to pick the first endpoint, then a second node to connect them.
                                </p>
                            )}
                        </div>
                        <div className="p-4 border-t border-[#30363d] flex items-center gap-2">
                            {canvasMode === 'details' ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (selectedNode && onEditItem) {
                                                onEditItem(selectedNode);
                                            }
                                        }}
                                        disabled={!onEditItem}
                                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-[#58a6ff]/35 bg-[#58a6ff]/10 text-[#58a6ff] text-sm font-semibold px-3 py-2 hover:bg-[#58a6ff]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Pencil size={14} />
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedNode(null);
                                            setConnectAnchor(null);
                                        }}
                                        className="px-3 py-2 rounded-lg border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]"
                                    >
                                        Close
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setConnectAnchor(null);
                                        setSelectedNode(null);
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22] text-sm font-medium"
                                >
                                    Cancel connection
                                </button>
                            )}
                        </div>
                    </div>
                </aside>
            )}

            <div
                ref={graphPaneRef}
                className="relative flex-1 h-full min-h-[700px]"
                style={{
                    backgroundColor: CANVAS_BG,
                    cursor: hoverNode || canvasMode === 'connect' ? 'pointer' : 'default',
                }}
            >
                <div className="premium-glass absolute top-0 left-0 right-0 z-10 px-5 py-3 flex items-center justify-between gap-4 border-b border-white/10">
                    <div className="flex flex-col">
                        <span className="text-[#e6edf3] text-sm font-semibold tracking-wide">Mind Map</span>
                        <span className="text-[#7d8590] text-xs">
                            {data.nodes.length} nodes · {data.links.length} connections
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {error && <span className="text-xs text-[#f85149] max-w-[200px] truncate">{error}</span>}
                        <div
                            className="inline-flex rounded-lg border border-[#30363d] bg-[#0d1117] p-0.5"
                            role="group"
                            aria-label="Canvas mode"
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setCanvasMode('details');
                                    setConnectAnchor(null);
                                }}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                                    canvasMode === 'details'
                                        ? 'bg-[#21262d] text-[#e6edf3] shadow-sm'
                                        : 'text-[#8b949e] hover:text-[#e6edf3]'
                                }`}
                            >
                                Details
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setCanvasMode('connect');
                                    setConnectAnchor(null);
                                    setSelectedNode(null);
                                    setError(null);
                                }}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                                    canvasMode === 'connect'
                                        ? 'bg-[#21262d] text-[#e6edf3] shadow-sm'
                                        : 'text-[#8b949e] hover:text-[#e6edf3]'
                                }`}
                            >
                                Connect
                            </button>
                        </div>
                    </div>
                </div>

                {data.nodes.length > 0 ? (
                    <ForceGraph2D
                        ref={fgRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        graphData={data}
                        backgroundColor={CANVAS_BG}
                        nodeId="id"
                        linkSource="source"
                        linkTarget="target"
                        nodeRelSize={6}
                        nodeLabel={(node: any) => `${(node.category || '').toUpperCase()}: ${node.title}`}
                        nodeCanvasObject={drawNode}
                        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
                            const radius = 10;
                            ctx.fillStyle = color;
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2, false);
                            ctx.fill();
                        }}
                        linkColor={linkColor}
                        linkWidth={linkWidth}
                        linkLabel={(link: any) => link.link_type}
                        onNodeHover={handleNodeHover}
                        onNodeClick={handleNodeClick}
                        onNodeDragEnd={handleNodeDragEnd}
                        cooldownTicks={120}
                        d3VelocityDecay={0.32}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-[#7d8590]">
                        <p className="text-sm">No connections to display. Add more items to build your graph.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KnowledgeGraph;
