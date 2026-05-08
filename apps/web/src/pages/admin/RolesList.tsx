import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  Tooltip,
  Paper
} from '@mui/material';
import { 
  DataGrid, 
  GridColDef, 
  GridRenderCellParams 
} from '@mui/x-data-grid';
import { 
  Edit as EditIcon, 
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { Role } from '../../types/admin';

const RolesList: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/roles');
      setRoles(response.data);
    } catch (error) {
      console.error('Failed to fetch roles', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await axios.delete(`/roles/${id}`);
        fetchRoles();
      } catch (error) {
        console.error('Failed to delete role', error);
      }
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Role Name', flex: 1, minWidth: 150 },
    { field: 'description', headerName: 'Description', flex: 2, minWidth: 300 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="Edit Role">
            <IconButton onClick={() => navigate(`/admin/roles/${params.row.id}`)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton color="error" onClick={() => handleDelete(params.row.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Roles Management</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/roles/new')}
        >
          New Role
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%', borderRadius: 2, boxShadow: 1 }}>
        <DataGrid
          rows={roles}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
          }}
        />
      </Paper>
    </Box>
  );
};

export default RolesList;
