import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Alert, Snackbar } from '@mui/material';
import { 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';

import Toolbar from './components/Toolbar';
import StepPalette from './components/StepPalette';
import FlowCanvas from './components/FlowCanvas';
import ConfigDrawer from './components/ConfigDrawer';
import { WorkflowNode, WorkflowEdge, NodeConfig, StepType } from './types';
import { DEFAULT_NODE_DATA } from './constants';
import axios from '../../api/axios';

const WorkflowStudioInternal = () => {
  const { workflowId } = useParams<{ workflowId: string }>();
  const { project } = useReactFlow();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/workflows/${workflowId}`);
        const workflow = response.data;
        
        setWorkflowName(workflow.name);
        if (workflow.graph) {
          setNodes(workflow.graph.nodes || []);
          setEdges(workflow.graph.edges || []);
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch workflow:', err);
        setError('Failed to load workflow definition.');
        setLoading(false);
      }
    };

    if (workflowId && workflowId !== 'new') {
      fetchWorkflow();
    } else {
      setLoading(false);
      // Initialize with a Form node for new workflows
      const startNodeId = uuidv4();
      setNodes([
        {
          id: startNodeId,
          type: 'form',
          position: { x: 250, y: 100 },
          data: { ...DEFAULT_NODE_DATA.form, name: 'Start Form' },
        },
      ]);
    }
  }, [workflowId]);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, animated: true, style: { strokeWidth: 2 } }, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: WorkflowNode) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = project({
        x: event.clientX - 260, // Subtract palette width
        y: event.clientY - 64,  // Subtract toolbar height
      });

      const stepType = type as StepType;
      const newNode: WorkflowNode = {
        id: uuidv4(),
        type: stepType,
        position,
        data: { ...DEFAULT_NODE_DATA[stepType] },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [project, setNodes]
  );

  const updateNodeData = useCallback((id: string, newData: Partial<NodeConfig>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const deleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    setSelectedNodeId(null);
  }, [setNodes, setEdges]);

  const onSave = async () => {
    try {
      setIsSaving(true);
      const payload = {
        name: workflowName,
        graph: { nodes, edges },
      };
      
      if (workflowId === 'new') {
        await axios.post('/workflows', { ...payload, department: 'General' });
      } else {
        await axios.patch(`/workflows/${workflowId}`, payload);
      }
      
      setToast({ open: true, message: 'Draft saved successfully', severity: 'success' });
    } catch (err) {
      setToast({ open: true, message: 'Failed to save draft', severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const onPublish = async () => {
    try {
      setIsPublishing(true);
      // Validate graph before publishing (simplified)
      if (nodes.length < 2) {
        throw new Error('Workflow must have at least two steps.');
      }
      
      await axios.post(`/workflows/${workflowId}/publish`);
      setToast({ open: true, message: 'Workflow published successfully', severity: 'success' });
    } catch (err: any) {
      setToast({ 
        open: true, 
        message: err.response?.data?.message || err.message || 'Failed to publish workflow', 
        severity: 'error' 
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Toolbar 
        workflowName={workflowName} 
        onNameChange={setWorkflowName}
        onSave={onSave}
        onPublish={onPublish}
        onSimulate={() => console.log('Simulate')}
        isSaving={isSaving}
        isPublishing={isPublishing}
      />
      
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <StepPalette />
        
        <Box sx={{ flex: 1, position: 'relative', bgcolor: '#f8fafc' }}>
          <FlowCanvas 
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
          />
        </Box>

        {selectedNode && (
          <ConfigDrawer 
            selectedNode={selectedNode}
            onUpdate={updateNodeData}
            onDelete={deleteNode}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </Box>

      <Snackbar 
        open={toast.open} 
        autoHideDuration={4000} 
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const WorkflowStudio = () => (
  <ReactFlowProvider>
    <WorkflowStudioInternal />
  </ReactFlowProvider>
);

export default WorkflowStudio;
