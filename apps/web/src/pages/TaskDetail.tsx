import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Paper, 
  Chip, 
  Button, 
  Divider, 
  Avatar,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  alpha
} from '@mui/material';
import { 
  History as TimelineIcon, 
  CheckCircle, 
  Cancel, 
  Reply, 
  PlayArrow,
  AccessTime,
  Person
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DynamicForm from '../components/Forms/DynamicForm';
import { format } from 'date-fns';

interface AuditEvent {
  id: string;
  action: string;
  actor: {
    name: string;
    email: string;
  };
  createdAt: string;
  note?: string;
}

interface TaskDetail {
  task: {
    id: string;
    stepName?: string;
    stepId: string;
    type: 'FORM' | 'APPROVAL' | 'MANUAL';
    dueAt: string | null;
    instance: {
      definition: {
        name: string;
      }
    }
  };
  formDefinition?: {
    fields: any[];
  };
  auditTrail: AuditEvent[];
  availableSendBackSteps?: { id: string, name: string }[];
}

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Action dialog states
  const [actionType, setActionType] = useState<'REJECT' | 'SEND_BACK' | null>(null);
  const [comment, setComment] = useState('');
  const [targetStep, setTargetStep] = useState('');

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await api.get(`/tasks/${id}`);
        setTask(response.data);
      } catch (err) {
        console.error('Failed to fetch task', err);
        navigate('/inbox');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id, navigate]);

  const handleAction = async (type: string, data?: any) => {
    if (!task?.task.id) return;
    setSubmitting(true);
    try {
      const actionMap: Record<string, string> = {
        'SUBMIT': 'submit',
        'APPROVE': 'approve',
        'REJECT': 'reject',
        'SEND_BACK': 'sendback',
        'COMPLETE': 'complete'
      };

      const endpoint = actionMap[type];
      if (!endpoint) throw new Error(`Invalid action type: ${type}`);

      await api.post(`/tasks/${task.task.id}/${endpoint}`, {
        comment,
        targetStepId: targetStep,
        formData: data
      });
      navigate('/inbox');
    } catch (err) {
      console.error('Action failed', err);
    } finally {
      setSubmitting(false);
      setActionType(null);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>;
  if (!task) return null;

  return (
    <Box>
      <Grid container spacing={4}>
        {/* Left Column: Form & Actions (60%) */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 4, borderRadius: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
              <Box>
                <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                  {task.task.instance.definition.name}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{task.task.stepName || task.task.stepId}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Chip 
                  label={task.task.type} 
                  color="primary" 
                  variant="outlined" 
                  size="small" 
                  sx={{ mb: 1, borderRadius: 1, fontWeight: 600 }} 
                />
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main', gap: 0.5 }}>
                  <AccessTime fontSize="small" />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    SLA: {task.task.dueAt ? format(new Date(task.task.dueAt), 'MMM dd, HH:mm') : 'No deadline'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {task.task.type === 'FORM' && task.formDefinition && (
              <DynamicForm 
                fields={task.formDefinition.fields || []} 
                onSubmit={(data) => handleAction('SUBMIT', data)} 
              />
            )}

            {task.task.type === 'MANUAL' && (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body1" sx={{ mb: 4 }}>
                  Please complete this manual step and click the button below to proceed.
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 6, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              {task.task.type === 'APPROVAL' ? (
                <>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<Cancel />}
                    onClick={() => setActionType('REJECT')}
                  >
                    Reject
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="warning" 
                    startIcon={<Reply />}
                    onClick={() => setActionType('SEND_BACK')}
                  >
                    Send Back
                  </Button>
                  <Button 
                    variant="contained" 
                    color="success" 
                    startIcon={<CheckCircle />}
                    onClick={() => handleAction('APPROVE')}
                    disabled={submitting}
                  >
                    Approve
                  </Button>
                </>
              ) : task.task.type === 'FORM' ? (
                <Button 
                  variant="contained" 
                  type="submit" 
                  form="task-form"
                  disabled={submitting}
                  sx={{ px: 4 }}
                >
                  Submit Form
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  onClick={() => handleAction('COMPLETE')}
                  disabled={submitting}
                  sx={{ px: 4 }}
                >
                  Complete Task
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Timeline (40%) */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 4, borderRadius: 4, height: '100%', minHeight: 600 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
              <TimelineIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Activity Timeline</Typography>
            </Box>

            <Box sx={{ position: 'relative' }}>
              {(task.auditTrail || []).map((event, index) => (
                <Box key={event.id} sx={{ display: 'flex', gap: 2, mb: 4, position: 'relative' }}>
                  {index !== (task.auditTrail || []).length - 1 && (
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        left: 20, 
                        top: 40, 
                        bottom: -20, 
                        width: 2, 
                        bgcolor: alpha('#e2e8f0', 0.8) 
                      }} 
                    />
                  )}
                  <Avatar sx={{ bgcolor: alpha('#6366f1', 0.1), color: 'primary.main', width: 40, height: 40 }}>
                    {event.action === 'STARTED' ? <PlayArrow /> : <Person />}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{event.actor?.name || 'System'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(event.createdAt), 'HH:mm')}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', mb: 0.5 }}>
                      {event.action}
                    </Typography>
                    {event.note && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          p: 1.5, 
                          bgcolor: 'background.default', 
                          borderRadius: 2, 
                          mt: 1,
                          border: '1px dashed #e2e8f0'
                        }}
                      >
                        {event.note}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {format(new Date(event.createdAt), 'MMM dd, yyyy')}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Action Dialogs */}
      <Dialog open={!!actionType} onClose={() => setActionType(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {actionType === 'REJECT' ? 'Reject Task' : 'Send Task Back'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Comment"
              placeholder="Provide a reason for this action..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
            {actionType === 'SEND_BACK' && (
              <FormControl fullWidth sx={{ mt: 3 }}>
                <InputLabel>Target Step</InputLabel>
                <Select
                  value={targetStep}
                  label="Target Step"
                  onChange={(e) => setTargetStep(e.target.value)}
                >
                  {(task.availableSendBackSteps || []).map(step => (
                    <MenuItem key={step.id} value={step.id}>{step.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setActionType(null)}>Cancel</Button>
          <Button 
            variant="contained" 
            color={actionType === 'REJECT' ? 'error' : 'warning'}
            onClick={() => handleAction(actionType!)}
            disabled={!comment || (actionType === 'SEND_BACK' && !targetStep)}
          >
            Confirm {actionType === 'REJECT' ? 'Rejection' : 'Send Back'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskDetail;
