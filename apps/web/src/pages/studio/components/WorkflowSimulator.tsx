import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Stack,
  Divider,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fade,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
} from '@mui/material';
import { 
  X, 
  CheckCircle2, 
  User, 
  History as HistoryIcon,
  Play,
  ArrowRight,
  GitBranch,
  Zap,
  Flag,
  FileText,
  CheckSquare
} from 'lucide-react';
import { WorkflowNode, WorkflowEdge, NodeConfig } from '../types';
import DynamicForm from '../../../components/Forms/DynamicForm';

interface WorkflowSimulatorProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onClose: () => void;
  onHighlightNode: (nodeId: string | null) => void;
}

const STEP_ICONS: Record<string, any> = {
  start: Play,
  form: FileText,
  task: CheckSquare,
  approval: CheckCircle2,
  action: Zap,
  condition: GitBranch,
  end: Flag,
};

const WorkflowSimulator: React.FC<WorkflowSimulatorProps> = ({
  nodes,
  edges,
  onClose,
  onHighlightNode,
}) => {
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [history, setHistory] = useState<WorkflowNode[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [outcome, setOutcome] = useState<'Completed' | 'Rejected' | 'Cancelled' | null>(null);
  const [comment, setComment] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  // Find start node on mount
  useEffect(() => {
    if (!currentStepId && nodes.length > 0) {
      // Logic for start node: no incoming edges, or if multiple, pick the first one
      const startNode = nodes.find(node => !edges.some(edge => edge.target === node.id)) || nodes[0];
      setCurrentStepId(startNode.id);
      setHistory([startNode]);
      onHighlightNode(startNode.id);
    }
  }, []);

  const currentStep = useMemo(() => nodes.find(n => n.id === currentStepId), [nodes, currentStepId]);

  const advance = (nextNodeId: string) => {
    const nextNode = nodes.find(n => n.id === nextNodeId);
    if (nextNode) {
      setHistory(prev => [...prev, nextNode]);
      setCurrentStepId(nextNodeId);
      onHighlightNode(nextNodeId);
      setComment('');
      setSelectedBranch('');
      
      if (nextNode.type === 'end') {
        setIsFinished(true);
        setOutcome('Completed');
      }
    } else {
      setIsFinished(true);
      setOutcome('Completed');
    }
  };

  const handleNext = () => {
    if (!currentStepId) return;
    
    // Find next node based on edges
    const outgoingEdges = edges.filter(e => e.source === currentStepId);
    if (outgoingEdges.length === 0) {
      setIsFinished(true);
      setOutcome('Completed');
      return;
    }

    if (currentStep?.type === 'condition') {
      if (!selectedBranch) return;
      const branchEdge = outgoingEdges.find(e => e.sourceHandle === selectedBranch);
      if (branchEdge) {
        advance(branchEdge.target);
      } else {
        // Fallback to first edge if branch handle not found (shouldn't happen with correct graph)
        advance(outgoingEdges[0].target);
      }
    } else {
      advance(outgoingEdges[0].target);
    }
  };

  const handleApproval = (result: 'Approved' | 'Rejected') => {
    if (result === 'Rejected') {
      setIsFinished(true);
      setOutcome('Rejected');
    } else {
      handleNext();
    }
  };

  useEffect(() => {
    if (currentStep?.type === 'action' && !isFinished) {
      const timer = setTimeout(() => {
        handleNext();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStepId, currentStep?.type, isFinished]);

  if (!currentStep && !isFinished) return null;
  const currentStepType = currentStep?.type || 'task';
  const StepIcon = STEP_ICONS[currentStepType] || Play;

  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <Paper
        elevation={24}
        sx={{
          width: 480,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 4,
          overflow: 'hidden',
          pointerEvents: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: 2.5, 
          bgcolor: 'white', 
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ 
              p: 1, 
              borderRadius: 1.5, 
              bgcolor: 'primary.main', 
              color: 'white',
              display: 'flex'
            }}>
              <Play size={18} fill="currentColor" />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Simulation
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Step {history.length} {isFinished ? '(Completed)' : ''}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={() => {
            onHighlightNode(null);
            onClose();
          }} size="small">
            <X size={20} />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, bgcolor: '#f8fafc' }}>
          {isFinished ? (
            <Fade in>
              <Box>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Box sx={{ 
                    display: 'inline-flex', 
                    p: 2, 
                    borderRadius: '50%', 
                    bgcolor: outcome === 'Completed' ? '#dcfce7' : '#fee2e2',
                    color: outcome === 'Completed' ? '#166534' : '#991b1b',
                    mb: 2
                  }}>
                    {outcome === 'Completed' ? <CheckCircle2 size={48} /> : <X size={48} />}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                    Workflow {outcome}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    The simulation has ended successfully.
                  </Typography>
                </Box>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon size={16} />
                  SIMULATION HISTORY
                </Typography>
                
                <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <List disablePadding>
                    {history.map((step, idx) => {
                      const stepType = step.type || 'task';
                      const Icon = STEP_ICONS[stepType] || Play;
                      return (
                        <React.Fragment key={idx}>
                          <ListItem sx={{ py: 1.5 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              <Box sx={{ color: 'primary.main' }}>
                                <Icon size={20} />
                              </Box>
                            </ListItemIcon>
                            <ListItemText 
                              primary={step.data.name} 
                              secondary={(step.type || 'Task').charAt(0).toUpperCase() + (step.type || 'Task').slice(1)}
                              primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                          {idx < history.length - 1 && <Divider />}
                        </React.Fragment>
                      );
                    })}
                  </List>
                </Paper>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => {
                    onHighlightNode(null);
                    onClose();
                  }}
                  sx={{ mt: 4, py: 1.5, borderRadius: 2, fontWeight: 600 }}
                >
                  Exit Simulation
                </Button>
              </Box>
            </Fade>
          ) : (
            <Fade in={!!currentStepId} key={currentStepId}>
              <Box>
                {/* Step Info Card */}
                <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3, border: '1px solid #e2e8f0' }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Box sx={{ 
                      p: 1.25, 
                      borderRadius: 2, 
                      bgcolor: '#eff6ff', 
                      color: 'primary.main',
                      display: 'flex'
                    }}>
                      <StepIcon size={24} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {currentStep?.data.name}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                        <Chip 
                          label={(currentStep?.type || 'task').toUpperCase()} 
                          size="small" 
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f1f5f9' }} 
                        />
                        {currentStep?.data.assigneeId && (
                          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary' }}>
                            <User size={12} />
                            <Typography variant="caption">{currentStep.data.assigneeId}</Typography>
                          </Stack>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                  
                  {currentStep?.data.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      {currentStep.data.description}
                    </Typography>
                  )}
                </Paper>

                {/* Step Specific Content */}
                <Box>
                  {currentStep?.type === 'start' && (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleNext}
                      sx={{ py: 1.5, borderRadius: 2, fontWeight: 600 }}
                    >
                      Start Workflow
                    </Button>
                  )}

                  {currentStep?.type === 'form' && (
                    <Box sx={{ mt: 2 }}>
                      <DynamicForm 
                        fields={currentStep.data.fields || []} 
                        onSubmit={(data) => {
                          console.log('Simulation form data:', data);
                          handleNext();
                        }} 
                      />
                      <Button
                        fullWidth
                        variant="contained"
                        type="submit"
                        form="task-form"
                        sx={{ mt: 2, py: 1.5, borderRadius: 2, fontWeight: 600 }}
                      >
                        Submit Form
                      </Button>
                    </Box>
                  )}

                  {currentStep?.type === 'task' && (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleNext}
                      sx={{ py: 1.5, borderRadius: 2, fontWeight: 600 }}
                    >
                      Mark as Complete
                    </Button>
                  )}

                  {currentStep?.type === 'approval' && (
                    <Stack spacing={2.5}>
                      <TextField
                        fullWidth
                        label="Add a comment (optional)"
                        multiline
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Why are you approving/rejecting this?"
                      />
                      <Stack direction="row" spacing={2}>
                        <Button
                          fullWidth
                          variant="outlined"
                          color="error"
                          onClick={() => handleApproval('Rejected')}
                          sx={{ py: 1.5, borderRadius: 2, fontWeight: 600 }}
                        >
                          Reject
                        </Button>
                        <Button
                          fullWidth
                          variant="contained"
                          color="success"
                          onClick={() => handleApproval('Approved')}
                          sx={{ py: 1.5, borderRadius: 2, fontWeight: 600 }}
                        >
                          Approve
                        </Button>
                      </Stack>
                    </Stack>
                  )}

                  {currentStep?.type === 'condition' && (
                    <Stack spacing={3}>
                      {currentStep.data.conditionField && (
                        <Alert icon={<GitBranch size={20} />} severity="info" sx={{ borderRadius: 3 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Condition Rule:
                          </Typography>
                          <Typography variant="caption">
                            IF "{currentStep.data.conditionField}" {currentStep.data.conditionOperator} "{currentStep.data.conditionValue}"
                          </Typography>
                        </Alert>
                      )}
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                        The workflow will follow a branch based on rules. Choose a branch to simulate:
                      </Typography>
                      <FormControl fullWidth>
                        <InputLabel>Select Branch</InputLabel>
                        <Select
                          value={selectedBranch}
                          label="Select Branch"
                          onChange={(e) => setSelectedBranch(e.target.value)}
                        >
                          {(currentStep.data.branches || ['True', 'False']).map(branch => (
                            <MenuItem key={branch} value={branch}>{branch}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button
                        fullWidth
                        variant="contained"
                        disabled={!selectedBranch}
                        onClick={handleNext}
                        sx={{ py: 1.5, borderRadius: 2, fontWeight: 600 }}
                      >
                        Follow Branch
                      </Button>
                    </Stack>
                  )}

                  {currentStep?.type === 'action' && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Zap size={40} color="#8b5cf6" style={{ marginBottom: 16 }} />
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                        Simulated: {currentStep.data.actionType?.toUpperCase()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Automatically advancing in 1 second...
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Fade>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default WorkflowSimulator;
