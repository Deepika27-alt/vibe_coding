import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Chip, 
  IconButton, 
  Tooltip,
  Drawer,
  TextField,
  MenuItem,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Skeleton
} from '@mui/material';
import { 
  DataGrid, 
  GridColDef, 
  GridRenderCellParams,
  GridPaginationModel
} from '@mui/x-data-grid';
import { 
  Edit as EditIcon, 
  PersonOff as DeactivateIcon, 
  PersonAdd as InviteIcon,
  FileUpload as ImportIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import axios from '../../api/axios';
import { User, Role } from '../../types/admin';

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  // Drawer & Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  // Invite Form state
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', department: '' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/users', {
        params: {
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
        }
      });
      setUsers(response.data.data);
      setTotal(response.data.meta.total);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get('/roles');
      setRoles(response.data);
    } catch (error) {
      console.error('Failed to fetch roles', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [paginationModel]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDeactivate = async (id: string) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        await axios.patch(`/users/${id}`, { status: 'inactive' });
        fetchUsers();
      } catch (error) {
        console.error('Failed to deactivate user', error);
      }
    }
  };

  const handleInvite = async () => {
    try {
      await axios.post('/users', inviteForm);
      setInviteModalOpen(false);
      setInviteForm({ name: '', email: '', department: '' });
      fetchUsers();
    } catch (error) {
      console.error('Failed to invite user', error);
    }
  };

  const handleBulkImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/users/bulk-import', formData);
      alert(`Import successful: ${response.data.count} users imported.`);
      fetchUsers();
    } catch (error) {
      console.error('Bulk import failed', error);
      alert('Bulk import failed');
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    { field: 'department', headerName: 'Department', flex: 0.8, minWidth: 130 },
    { 
      field: 'roles', 
      headerName: 'Roles', 
      flex: 1.2, 
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={0.5} sx={{ overflowX: 'auto', py: 1 }}>
          {params.value?.map((userRole: { role: Role }) => (
            <Chip key={userRole.role.id} label={userRole.role.name} size="small" variant="outlined" />
          ))}
        </Stack>
      )
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
          icon={params.value === 'active' ? <ActiveIcon /> : <InactiveIcon />}
          label={params.value === 'active' ? 'Active' : 'Inactive'}
          color={params.value === 'active' ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="Edit User">
            <IconButton onClick={() => { setSelectedUser(params.row); setDrawerOpen(true); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Deactivate">
            <IconButton 
              color="error" 
              onClick={() => handleDeactivate(params.row.id)}
              disabled={params.row.status === 'inactive'}
            >
              <DeactivateIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const handleRoleChange = async (userId: string, roleId: string, assigned: boolean) => {
    try {
      if (assigned) {
        await axios.post(`/users/${userId}/roles`, { roleId });
      } else {
        await axios.delete(`/users/${userId}/roles/${roleId}`);
      }
      // Update local state or refetch
      fetchUsers();
    } catch (error) {
      console.error('Failed to update role', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Users Management</Typography>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="outlined" 
            startIcon={<ImportIcon />}
            component="label"
          >
            Bulk Import
            <input type="file" hidden accept=".csv" onChange={handleBulkImport} />
          </Button>
          <Button 
            variant="contained" 
            startIcon={<InviteIcon />}
            onClick={() => setInviteModalOpen(true)}
          >
            Invite User
          </Button>
        </Stack>
      </Box>

      <Box sx={{ height: 650, width: '100%', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          rowCount={total}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
          }}
        />
      </Box>

      {/* User Detail Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 450, p: 3 } }}
      >
        {selectedUser && (
          <Stack spacing={3}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>User Details</Typography>
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Name</Typography>
              <Typography variant="body1">{selectedUser.name}</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">Email</Typography>
              <Typography variant="body1">{selectedUser.email}</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">Department</Typography>
              <Typography variant="body1">{selectedUser.department}</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">Last Login</Typography>
              <Typography variant="body1">
                {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Role Assignments</Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {roles.map((role) => {
                  const isAssigned = selectedUser.roles.some(ur => ur.role.id === role.id);
                  return (
                    <Chip
                      key={role.id}
                      label={role.name}
                      color={isAssigned ? "primary" : "default"}
                      onClick={() => handleRoleChange(selectedUser.id, role.id, !isAssigned)}
                      variant={isAssigned ? "filled" : "outlined"}
                    />
                  );
                })}
              </Stack>
            </Box>

            <Button 
              variant="contained" 
              fullWidth 
              onClick={() => setDrawerOpen(false)}
              sx={{ mt: 2 }}
            >
              Close
            </Button>
          </Stack>
        )}
      </Drawer>

      {/* Invite Modal */}
      <Dialog open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Invite New User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField 
              label="Full Name" 
              fullWidth 
              value={inviteForm.name}
              onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
            />
            <TextField 
              label="Email Address" 
              fullWidth 
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
            />
            <TextField 
              label="Department" 
              fullWidth 
              value={inviteForm.department}
              onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setInviteModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleInvite}>Invite</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersList;
