import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Connection,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Panel,
  ConnectionMode,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import {
  FormNode,
  TaskNode,
  ApprovalNode,
  ActionNode,
  ConditionNode,
  EndNode,
} from './nodes';
import DeleteEdge from './edges/DeleteEdge';
import { WorkflowNode, WorkflowEdge, NodeConfig } from '../types';
import { DEFAULT_NODE_DATA } from '../constants';

const nodeTypes = {
  form: FormNode,
  task: TaskNode,
  approval: ApprovalNode,
  action: ActionNode,
  condition: ConditionNode,
  end: EndNode,
};

const edgeTypes = {
  default: DeleteEdge,
};

interface FlowCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: (params: Connection) => void;
  onNodeClick: (event: React.MouseEvent, node: WorkflowNode) => void;
  onPaneClick: () => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
}

const FlowCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  onDrop,
  onDragOver,
}: FlowCanvasProps) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { strokeWidth: 2, stroke: '#94a3b8' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#94a3b8',
          },
        }}
        fitView
      >
        <Background color="#f1f5f9" gap={20} />
        <Controls />
        <Panel position="top-right" style={{ margin: 16 }}>
          <div style={{ background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
            Right-click edge to delete • Drag handles to connect
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default FlowCanvas;
