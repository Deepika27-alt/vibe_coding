import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import api from '../api/axios';
import { format } from 'date-fns';

interface Request {
  id: string;
  workflowName: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  startedDate: string;
  lastUpdated: string;
}

const MyRequests: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await api.get('/instances/my-requests');
        setRequests(response.data);
      } catch (err) {
        console.error('Failed to fetch requests', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'REJECTED': return 'error';
      case 'CANCELLED': return 'default';
      default: return 'primary';
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>My Requests</Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Workflow</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Started Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Last Updated</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{req.workflowName}</TableCell>
                <TableCell>
                  <Chip
                    label={req.status}
                    color={getStatusColor(req.status) as any}
                    size="small"
                    sx={{ fontWeight: 600, borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell>{format(new Date(req.startedDate), 'MMM dd, yyyy')}</TableCell>
                <TableCell>{format(new Date(req.lastUpdated), 'MMM dd, yyyy HH:mm')}</TableCell>
                <TableCell align="right">
                  <Tooltip title="View History">
                    <IconButton size="small">
                      <InfoOutlined />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary">You haven't started any requests yet.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MyRequests;
