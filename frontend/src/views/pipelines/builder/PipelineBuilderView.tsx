/**
 * PipelineBuilderView — the main visual pipeline builder using React Flow.
 * Supports drag-and-drop from sidebar, node configuration, graph serialization,
 * undo/redo, validation, and save/activate actions.
 */
import {
  useState,
  useCallback,
  useRef,
  useMemo,
  type DragEvent,
  type ReactNode,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  type Connection,
  type OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { toastSuccess, toastError } from '@/components/ui';
import { PipelineService } from '@/services';
import type { CreatePipelineDto } from '@/@types/pipeline';
import { ModuleSidebar } from './ModuleSidebar';
import { ModuleConfigPanel } from './ModuleConfigPanel';
import { PipelineSettingsPanel } from './PipelineSettingsPanel';
import { nodeTypes } from './PipelineNodes';
import type { PipelineNode, PipelineEdge, PipelineNodeData, ModuleType, PipelineValidationError } from './types';
import type { NodeTypes } from '@xyflow/react';
import { MODULE_TYPES } from './types';
import { PipelineTemplateGallery, type PipelineTemplate } from './PipelineTemplateGallery';

/** Cast nodeTypes to satisfy React Flow's NodeTypes constraint */
const typedNodeTypes = nodeTypes as unknown as NodeTypes;

/** Creates initial start and end nodes */
function createInitialNodes(): PipelineNode[] {
  return [
    {
      id: 'start',
      type: 'start',
      position: { x: 250, y: 50 },
      data: { label: 'Start' },
      deletable: false,
    },
    {
      id: 'end',
      type: 'end',
      position: { x: 250, y: 500 },
      data: { label: 'End' },
      deletable: false,
    },
  ];
}

function createInitialEdges(): PipelineEdge[] {
  return [];
}

let nodeIdCounter = 0;
function getNextNodeId(): string {
  nodeIdCounter += 1;
  return `module-${Date.now()}-${nodeIdCounter}`;
}

/** Inner component that uses the React Flow hooks */
function PipelineBuilderInner(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: pipelineId } = useParams<{ id: string }>();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Pipeline metadata
  const [pipelineName, setPipelineName] = useState('');
  const [pipelineDescription, setPipelineDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<PipelineNode>(createInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState<PipelineEdge>(createInitialEdges());

  // Selected node for config panel
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Undo/redo history
  const historyRef = useRef<{ nodes: PipelineNode[]; edges: PipelineEdge[] }[]>([]);
  const historyIndexRef = useRef(-1);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<PipelineValidationError[]>([]);

  // Template gallery
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  // Push state to history for undo/redo
  const pushHistory = useCallback(() => {
    const snapshot = { nodes: [...nodes], edges: [...edges] };
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(snapshot);
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    setIsDirty(true);
  }, [nodes, edges]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const state = historyRef.current[historyIndexRef.current];
      if (state) {
        setNodes(state.nodes);
        setEdges(state.edges);
      }
    }
  }, [setNodes, setEdges]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const state = historyRef.current[historyIndexRef.current];
      if (state) {
        setNodes(state.nodes);
        setEdges(state.edges);
      }
    }
  }, [setNodes, setEdges]);

  // Handle edge connection
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      pushHistory();
      setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
    },
    [setEdges, pushHistory]
  );

  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: PipelineNode) => {
    if (node.type !== 'start' && node.type !== 'end') {
      setSelectedNodeId(node.id);
    }
  }, []);

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Drop handler for drag-and-drop from sidebar
  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const moduleType = event.dataTransfer.getData('application/pipeline-module') as ModuleType;
      if (!moduleType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const moduleInfo = MODULE_TYPES.find((m) => m.type === moduleType);
      const newNode: PipelineNode = {
        id: getNextNodeId(),
        type: moduleType,
        position,
        data: {
          label: moduleInfo?.label ?? moduleType,
          moduleType,
          moduleConfig: {},
        },
      };

      pushHistory();
      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes, pushHistory]
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Update node data from config panel
  const handleNodeDataUpdate = useCallback(
    (nodeId: string, data: Partial<PipelineNodeData>) => {
      pushHistory();
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
        )
      );
    },
    [setNodes, pushHistory]
  );

  // Delete a node
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      pushHistory();
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNodeId(null);
    },
    [setNodes, setEdges, pushHistory]
  );

  // Validate pipeline graph
  const validateGraph = useCallback((): PipelineValidationError[] => {
    const errors: PipelineValidationError[] = [];

    if (!pipelineName.trim()) {
      errors.push({ message: 'Pipeline name is required', severity: 'error' });
    }

    const moduleNodes = nodes.filter(
      (n) => n.type !== 'start' && n.type !== 'end'
    );

    if (moduleNodes.length === 0) {
      errors.push({
        message: 'Pipeline must have at least one module',
        severity: 'error',
      });
    }

    // Check that all non-start/end nodes have at least one connection
    for (const node of moduleNodes) {
      const hasIncoming = edges.some((e) => e.target === node.id);
      const hasOutgoing = edges.some((e) => e.source === node.id);
      if (!hasIncoming && !hasOutgoing) {
        errors.push({
          nodeId: node.id,
          message: `"${node.data.label}" is not connected to any other module`,
          severity: 'warning',
        });
      }
    }

    // Check start has at least one outgoing edge
    const startHasEdge = edges.some((e) => e.source === 'start');
    if (!startHasEdge && moduleNodes.length > 0) {
      errors.push({
        nodeId: 'start',
        message: 'Start node must be connected to the first module',
        severity: 'warning',
      });
    }

    // Check end has at least one incoming edge
    const endHasEdge = edges.some((e) => e.target === 'end');
    if (!endHasEdge && moduleNodes.length > 0) {
      errors.push({
        nodeId: 'end',
        message: 'End node must be connected to the last module',
        severity: 'warning',
      });
    }

    setValidationErrors(errors);
    return errors;
  }, [nodes, edges, pipelineName]);

  // Serialize graph to pipeline stages + graph JSON
  const serializePipeline = useCallback(() => {
    const moduleNodes = nodes.filter(
      (n) => n.type !== 'start' && n.type !== 'end'
    );

    // Determine order via topological sort through edges from start
    const visited = new Set<string>();
    const orderedNodes: PipelineNode[] = [];
    const adjacency = new Map<string, string[]>();

    for (const edge of edges) {
      const list = adjacency.get(edge.source) || [];
      list.push(edge.target);
      adjacency.set(edge.source, list);
    }

    function dfs(nodeId: string) {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      const node = moduleNodes.find((n) => n.id === nodeId);
      if (node) orderedNodes.push(node);
      const neighbors = adjacency.get(nodeId) || [];
      for (const next of neighbors) {
        dfs(next);
      }
    }

    dfs('start');

    // Also include any disconnected module nodes at the end
    for (const node of moduleNodes) {
      if (!visited.has(node.id)) {
        orderedNodes.push(node);
      }
    }

    const stages = orderedNodes.map((node, index) => ({
      formDefinitionId:
        (node.data.moduleConfig?.formDefinitionId as string) ||
        '00000000-0000-0000-0000-000000000000',
      name: node.data.label,
      order: index,
      isRequired: node.data.isRequired ?? true,
      ...(node.data.estimatedDurationMinutes !== undefined
        ? { estimatedDurationMinutes: node.data.estimatedDurationMinutes }
        : {}),
      moduleType: node.data.moduleType || (node.type as ModuleType),
      moduleConfig: node.data.moduleConfig || {},
    }));

    const graph = {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type || 'form',
        position: n.position,
        data: n.data as Record<string, unknown>,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        ...(e.sourceHandle != null ? { sourceHandle: e.sourceHandle } : {}),
        ...(e.targetHandle != null ? { targetHandle: e.targetHandle } : {}),
      })),
    };

    return { stages, graph };
  }, [nodes, edges]);

  // Save handler
  const handleSave = useCallback(async () => {
    const errors = validateGraph();
    if (errors.some((e) => e.severity === 'error')) {
      toastError(t('pipelines.builder.validationFailed', 'Please fix validation errors before saving'));
      return;
    }

    setIsSaving(true);
    try {
      const { stages, graph } = serializePipeline();
      const payload: CreatePipelineDto = {
        name: pipelineName.trim(),
        ...(pipelineDescription.trim() ? { description: pipelineDescription.trim() } : {}),
        stages,
        graph,
      };

      if (pipelineId) {
        await PipelineService.update(pipelineId, payload);
        toastSuccess(t('pipelines.builder.updated', 'Pipeline updated'));
      } else {
        const created = await PipelineService.create(payload);
        toastSuccess(t('pipelines.builder.created', 'Pipeline created'));
        navigate(`/admin/pipelines/${created.id}/builder`, { replace: true });
      }
      setIsDirty(false);
    } catch (error) {
      console.error('Save pipeline error:', error);
      toastError(t('pipelines.builder.saveError', 'Failed to save pipeline'));
    } finally {
      setIsSaving(false);
    }
  }, [
    pipelineId,
    pipelineName,
    pipelineDescription,
    validateGraph,
    serializePipeline,
    navigate,
    t,
  ]);

  // Activate handler
  const handleActivate = useCallback(async () => {
    // First save, then activate
    const errors = validateGraph();
    if (errors.some((e) => e.severity === 'error')) {
      toastError(t('pipelines.builder.validationFailed', 'Please fix validation errors before activating'));
      return;
    }

    setIsSaving(true);
    try {
      const { stages, graph } = serializePipeline();
      const payload: CreatePipelineDto = {
        name: pipelineName.trim(),
        ...(pipelineDescription.trim() ? { description: pipelineDescription.trim() } : {}),
        stages,
        graph,
      };

      let id = pipelineId;
      if (id) {
        await PipelineService.update(id, payload);
      } else {
        const created = await PipelineService.create(payload);
        id = created.id;
      }

      await PipelineService.activate(id!);
      toastSuccess(t('pipelines.builder.activated', 'Pipeline activated'));
      navigate('/admin/pipelines');
    } catch (error) {
      console.error('Activate pipeline error:', error);
      toastError(t('pipelines.builder.activateError', 'Failed to activate pipeline'));
    } finally {
      setIsSaving(false);
    }
  }, [
    pipelineId,
    pipelineName,
    pipelineDescription,
    validateGraph,
    serializePipeline,
    navigate,
    t,
  ]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z' && !event.shiftKey) {
          event.preventDefault();
          handleUndo();
        } else if ((event.key === 'z' && event.shiftKey) || event.key === 'y') {
          event.preventDefault();
          handleRedo();
        } else if (event.key === 's') {
          event.preventDefault();
          handleSave();
        }
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNodeId && selectedNodeId !== 'start' && selectedNodeId !== 'end') {
          handleDeleteNode(selectedNodeId);
        }
      }
    },
    [handleUndo, handleRedo, handleSave, handleDeleteNode, selectedNodeId]
  );

  // Handle template selection — populate nodes from template stages
  const handleSelectTemplate = useCallback(
    (template: PipelineTemplate) => {
      pushHistory();

      const startY = 50;
      const spacingY = 120;
      const x = 250;

      const newNodes: PipelineNode[] = [
        {
          id: 'start',
          type: 'start',
          position: { x, y: startY },
          data: { label: 'Start' },
          deletable: false,
        },
      ];

      const newEdges: PipelineEdge[] = [];
      let prevNodeId = 'start';

      template.stages.forEach((stage, idx) => {
        const nodeId = getNextNodeId();
        const y = startY + (idx + 1) * spacingY;

        newNodes.push({
          id: nodeId,
          type: stage.moduleType,
          position: { x, y },
          data: {
            label: stage.name,
            moduleType: stage.moduleType,
            moduleConfig: stage.moduleConfig,
            isRequired: stage.isRequired,
            ...(stage.estimatedDurationMinutes !== undefined
              ? { estimatedDurationMinutes: stage.estimatedDurationMinutes }
              : {}),
          },
        });

        newEdges.push({
          id: `edge-${prevNodeId}-${nodeId}`,
          source: prevNodeId,
          target: nodeId,
          animated: true,
        });

        prevNodeId = nodeId;
      });

      // End node
      const endY = startY + (template.stages.length + 1) * spacingY;
      newNodes.push({
        id: 'end',
        type: 'end',
        position: { x, y: endY },
        data: { label: 'End' },
        deletable: false,
      });

      newEdges.push({
        id: `edge-${prevNodeId}-end`,
        source: prevNodeId,
        target: 'end',
        animated: true,
      });

      setPipelineName(template.name);
      setPipelineDescription(template.description);
      setNodes(newNodes);
      setEdges(newEdges);
      setIsDirty(true);
    },
    [pushHistory, setNodes, setEdges]
  );

  return (
    <div
      className="flex flex-col h-[calc(100vh-4rem)]"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Top bar — pipeline settings */}
      <PipelineSettingsPanel
        name={pipelineName}
        description={pipelineDescription}
        onNameChange={(v) => { setPipelineName(v); setIsDirty(true); }}
        onDescriptionChange={(v) => { setPipelineDescription(v); setIsDirty(true); }}
        onSave={handleSave}
        onActivate={handleActivate}
        isSaving={isSaving}
        isDirty={isDirty}
      />

      {/* Secondary toolbar — Templates button */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/50">
        <button
          onClick={() => setIsTemplateGalleryOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-white dark:bg-gray-800 border border-border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <span>📋</span>
          {t('pipelines.templates.title', 'Templates')}
        </button>
        <button
          onClick={handleUndo}
          className="p-1.5 text-xs text-muted-foreground hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          title={t('common.undo', 'Undo (Ctrl+Z)')}
        >
          ↩️
        </button>
        <button
          onClick={handleRedo}
          className="p-1.5 text-xs text-muted-foreground hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          title={t('common.redo', 'Redo (Ctrl+Y)')}
        >
          ↪️
        </button>
      </div>

      {/* Validation errors bar */}
      {validationErrors.length > 0 && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <div className="flex flex-wrap gap-2">
            {validationErrors.map((err, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-1 rounded-full ${
                  err.severity === 'error'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                }`}
              >
                {err.message}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main content — sidebar + canvas + config panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Module sidebar */}
        <ModuleSidebar />

        {/* React Flow canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={typedNodeTypes}
            fitView
            deleteKeyCode={null}
            className="bg-gray-50 dark:bg-gray-950"
          >
            <Controls position="bottom-left" />
            <MiniMap
              position="bottom-right"
              nodeStrokeWidth={3}
              className="!bg-white dark:!bg-gray-800"
            />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          </ReactFlow>
        </div>

        {/* Config panel — shown when a module node is selected */}
        {selectedNode && selectedNode.type !== 'start' && selectedNode.type !== 'end' && (
          <ModuleConfigPanel
            nodeId={selectedNode.id}
            nodeData={selectedNode.data}
            onUpdate={handleNodeDataUpdate}
            onClose={() => setSelectedNodeId(null)}
            onDelete={handleDeleteNode}
          />
        )}
      </div>

      {/* Template Gallery Dialog */}
      <PipelineTemplateGallery
        open={isTemplateGalleryOpen}
        onOpenChange={setIsTemplateGalleryOpen}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}

/**
 * PipelineBuilderView wraps the inner component with ReactFlowProvider.
 */
export function PipelineBuilderView(): ReactNode {
  return (
    <ReactFlowProvider>
      <PipelineBuilderInner />
    </ReactFlowProvider>
  );
}
