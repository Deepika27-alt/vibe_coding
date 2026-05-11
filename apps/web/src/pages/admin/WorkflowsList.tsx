import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  Tooltip,
  Paper,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem
} from '@mui/material';
import { 
  DataGrid, 
  GridColDef, 
  GridRenderCellParams 
} from '@mui/x-data-grid';
import { 
  Edit as EditIcon, 
  Add as AddIcon,
  Publish as PublishIcon,
  Archive as ArchiveIcon,
  Brush as DesignIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';

interface Workflow {
  id: string;
  name: string;
  description: string;
  department: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
}

const WorkflowsList: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '', department: '' });
  const navigate = useNavigate();

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      // For admins, we might need a different endpoint or a flag
      const response = await axios.get('/workflows');
      setWorkflows(response.data);
    } catch (error) {
      console.error('Failed to fetch workflows', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleCreate = async () => {
    try {
      const response = await axios.post('/workflows', {
        ...newWorkflow,
        graph: { nodes: [], edges: [] }
      });
      setCreateModalOpen(false);
      navigate(`/studio/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create workflow', error);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await axios.post(`/workflows/${id}/publish`);
      fetchWorkflows();
    } catch (error) {
      console.error('Failed to publish workflow', error);
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'department', headerName: 'Department', width: 130 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
          label={params.value} 
          color={params.value === 'PUBLISHED' ? 'success' : params.value === 'DRAFT' ? 'warning' : 'default'}
          size="small"
        />
      )
    },
    { field: 'createdAt', headerName: 'Created', width: 180, valueFormatter: (value) => value ? new Date(value).toLocaleString() : '' },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="Design / Edit">
            <IconButton onClick={() => navigate(`/studio/${params.row.id}`)}>
              <DesignIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Publish">
            <IconButton 
              onClick={() => handlePublish(params.row.id)}
              disabled={params.row.status === 'PUBLISHED'}
            >
              <PublishIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Archive">
            <IconButton disabled={params.row.status === 'ARCHIVED'}>
              <ArchiveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Workflows Management</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setCreateModalOpen(true)}
        >
          Create Workflow
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%', borderRadius: 2, boxShadow: 1 }}>
        <DataGrid
          rows={workflows}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
          }}
        />
      </Paper>

      {/* Create Modal */}
      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create New Workflow</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField 
              label="Workflow Name" 
              fullWidth 
              value={newWorkflow.name}
              onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
            />
            <TextField 
              label="Department" 
              fullWidth 
              value={newWorkflow.department}
              onChange={(e) => setNewWorkflow({ ...newWorkflow, department: e.target.value })}
            />
            <TextField 
              label="Description" 
              fullWidth 
              multiline
              rows={3}
              value={newWorkflow.description}
              onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create & Design</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowsList;
