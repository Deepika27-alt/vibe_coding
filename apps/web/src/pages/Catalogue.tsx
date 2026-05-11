import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  alpha
} from '@mui/material';
import { RocketLaunch, Apartment } from '@mui/icons-material';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

interface Workflow {
  id: string;
  name: string;
  department: string;
  description: string;
}

const Catalogue: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<Workflow | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await api.get('/workflows/catalogue');
        setWorkflows(response.data);
      } catch (err) {
        console.error('Failed to fetch workflows', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, []);

  const handleStart = async () => {
    if (!confirmDialog) return;
    setStarting(true);
    try {
      const response = await api.post('/instances', { workflowDefinitionId: confirmDialog.id });
      setConfirmDialog(null);
      if (response.data.firstTaskId) {
        navigate(`/tasks/${response.data.firstTaskId}`);
      } else {
        navigate('/requests');
      }
    } catch (err) {
      console.error('Failed to start instance', err);
    } finally {
      setStarting(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>Workflow Catalogue</Typography>

      <Grid container spacing={3}>
        {workflows.map((wf) => (
          <Grid item xs={12} sm={6} md={4} key={wf.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 20px -10px rgba(0,0,0,0.1)'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Apartment fontSize="small" color="primary" />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                    {wf.department}
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{wf.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {wf.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<RocketLaunch />}
                  onClick={() => setConfirmDialog(wf)}
                >
                  Start Workflow
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Start Workflow?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to start a new <strong>{confirmDialog?.name}</strong> instance.
            This will create an initial task for you to complete.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setConfirmDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleStart}
            disabled={starting}
            autoFocus
          >
            {starting ? 'Starting...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Catalogue;
