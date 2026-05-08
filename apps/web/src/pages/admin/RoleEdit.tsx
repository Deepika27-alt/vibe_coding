import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Stack, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Checkbox, 
  ListItemText, 
  OutlinedInput,
  FormGroup,
  FormControlLabel,
  Divider,
  Breadcrumbs,
  Link,
  Grid,
  Chip
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Delete as DeleteIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import axios from '../../api/axios';
import { Role, Workflow } from '../../types/admin';

const RoleEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [role, setRole] = useState<Partial<Role>>({
    name: '',
    description: '',
    workflows: [],
    stepTypes: []
  });
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRole = async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const response = await axios.get(`/roles/${id}`);
      setRole(response.data);
    } catch (error) {
      console.error('Failed to fetch role', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const response = await axios.get('/workflows');
      setWorkflows(response.data);
    } catch (error) {
      console.error('Failed to fetch workflows', error);
    }
  };

  useEffect(() => {
    fetchRole();
    fetchWorkflows();
  }, [id]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (isNew) {
        await axios.post('/roles', role);
      } else {
        await axios.patch(`/roles/${id}`, role);
      }
      navigate('/admin/roles');
    } catch (error) {
      console.error('Failed to save role', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await axios.delete(`/roles/${id}`);
        navigate('/admin/roles');
      } catch (error) {
        console.error('Failed to delete role', error);
      }
    }
  };

  const handleStepTypeChange = (type: string) => {
    const current = role.stepTypes || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    setRole({ ...role, stepTypes: updated });
  };

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/admin/roles" color="inherit" underline="hover">Roles</Link>
        <Typography color="text.primary">{isNew ? 'New Role' : 'Edit Role'}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {isNew ? 'Create New Role' : `Edit Role: ${role.name}`}
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<BackIcon />} onClick={() => navigate('/admin/roles')}>
            Cancel
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={loading}>
            Save Changes
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Basic Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Role Name"
                  fullWidth
                  value={role.name}
                  onChange={(e) => setRole({ ...role, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={role.description}
                  onChange={(e) => setRole({ ...role, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Workflow Permissions</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select which workflows this role can initiate.
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Can Initiate Workflows</InputLabel>
              <Select
                multiple
                value={role.workflows || []}
                onChange={(e) => setRole({ ...role, workflows: e.target.value as string[] })}
                input={<OutlinedInput label="Can Initiate Workflows" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const wf = workflows.find(w => w.id === value);
                      return <Chip key={value} label={wf?.name || value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {workflows.map((wf) => (
                  <MenuItem key={wf.id} value={wf.id}>
                    <Checkbox checked={(role.workflows || []).indexOf(wf.id) > -1} />
                    <ListItemText primary={wf.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Action Permissions</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select which step types this role can action within any workflow.
            </Typography>
            <FormGroup row>
              {['form', 'approval', 'manual'].map((type) => (
                <FormControlLabel
                  key={type}
                  control={
                    <Checkbox 
                      checked={(role.stepTypes || []).includes(type)} 
                      onChange={() => handleStepTypeChange(type)}
                    />
                  }
                  label={type.charAt(0).toUpperCase() + type.slice(1)}
                  sx={{ mr: 4 }}
                />
              ))}
            </FormGroup>
          </Box>

          {!isNew && (
            <>
              <Divider />
              <Box sx={{ pt: 2 }}>
                <Button 
                  color="error" 
                  variant="outlined" 
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                >
                  Delete Role
                </Button>
              </Box>
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default RoleEdit;
