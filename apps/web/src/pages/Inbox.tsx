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
  Skeleton,
  alpha
} from '@mui/material';
import { ChevronRight, FilterList } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { formatDistanceToNow } from 'date-fns';

interface Task {
  taskId: string;
  workflowName: string;
  stepName: string;
  initiatorName: string;
  dueAt: string | null;
  slaStatus: 'on_time' | 'at_risk' | 'breached';
}

const Inbox: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.get('/tasks/pending');
        setTasks(response.data);
      } catch (err) {
        console.error('Failed to fetch tasks', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const getSLAProps = (status: string) => {
    switch (status) {
      case 'breached': return { label: 'Overdue', color: 'error' as const };
      case 'at_risk': return { label: 'At risk', color: 'warning' as const };
      default: return { label: 'On track', color: 'success' as const };
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>My Tasks</Typography>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 2 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>My Tasks</Typography>
        <IconButton>
          <FilterList />
        </IconButton>
      </Box>

      {tasks.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4 }}>
          <Typography variant="h6" color="text.secondary">All caught up! No pending tasks.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: alpha('#6366f1', 0.04) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Workflow / Step</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Initiator</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>SLA</TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow
                  key={task.taskId}
                  hover
                  onClick={() => navigate(`/tasks/${task.taskId}`)}
                  sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{task.workflowName}</Typography>
                    <Typography variant="body2" color="text.secondary">{task.stepName}</Typography>
                  </TableCell>
                  <TableCell>{task.initiatorName}</TableCell>
                  <TableCell>
                    {task.dueAt ? formatDistanceToNow(new Date(task.dueAt), { addSuffix: true }) : 'No deadline'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      {...getSLAProps(task.slaStatus)}
                      sx={{ fontWeight: 600, borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton size="small">
                        <ChevronRight />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Inbox;
