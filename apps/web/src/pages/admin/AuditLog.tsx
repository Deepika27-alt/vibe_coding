import React, { useState, useEffect, useMemo } from 'react';
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
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  IconButton,
  Collapse,
  Alert,
  Snackbar,
  alpha,
  useTheme
} from '@mui/material';
import {
  ChevronDown,
  ChevronUp,
  Download,
  Calendar,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { getAuditPreview, exportAuditLogs, AuditEvent } from '../../api/audit';
import api from '../../api/axios';

const AuditLog = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [range, setRange] = useState('7');
  const [customRange, setCustomRange] = useState({
    from: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });
  const [workflowId, setWorkflowId] = useState('all');
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dateRange = useMemo(() => {
    if (range === 'custom') {
      return {
        from: new Date(customRange.from).toISOString(),
        to: new Date(customRange.to).toISOString(),
      };
    }
    const to = new Date();
    const from = subDays(to, parseInt(range));
    return {
      from: from.toISOString(),
      to: to.toISOString(),
    };
  }, [range, customRange]);

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await api.get('/workflows');
        setWorkflows(response.data);
      } catch (err) {
        console.error('Failed to fetch workflows', err);
      }
    };
    fetchWorkflows();
  }, []);

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      try {
        const data = await getAuditPreview(dateRange.from, dateRange.to, workflowId);
        setEvents(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch audit logs');
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [dateRange, workflowId]);

  const handleExport = async (formatType: 'csv' | 'json') => {
    setExporting(true);
    try {
      await exportAuditLogs(dateRange.from, dateRange.to, formatType, workflowId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'STARTED': return theme.palette.info.main;
      case 'SUBMITTED': return theme.palette.primary.main;
      case 'APPROVED': return theme.palette.success.main;
      case 'REJECTED': return theme.palette.error.main;
      case 'SENT_BACK': return theme.palette.warning.main;
      case 'COMPLETED': return theme.palette.secondary.main;
      case 'EXPORTED': return theme.palette.grey[600];
      default: return theme.palette.grey[400];
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
            <Typography variant="h4" fontWeight="bold">Audit Logs</Typography>
            <Typography variant="body2" color="textSecondary">Monitor system activities and export historical records</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {range === 'custom' && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <input
                type="date"
                value={customRange.from}
                onChange={(e) => setCustomRange(p => ({ ...p, from: e.target.value }))}
                style={{ padding: '8px', borderRadius: '4px', border: `1px solid \${theme.palette.divider}`, background: 'transparent', color: theme.palette.text.primary }}
              />
              <input
                type="date"
                value={customRange.to}
                onChange={(e) => setCustomRange(p => ({ ...p, to: e.target.value }))}
                style={{ padding: '8px', borderRadius: '4px', border: `1px solid \${theme.palette.divider}`, background: 'transparent', color: theme.palette.text.primary }}
              />
            </Box>
          )}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Range</InputLabel>
            <Select value={range} label="Range" onChange={(e) => setRange(e.target.value)}>
              <MenuItem value="1">Last 24 Hours</MenuItem>
              <MenuItem value="7">Last 7 Days</MenuItem>
              <MenuItem value="30">Last 30 Days</MenuItem>
              <MenuItem value="90">Last 90 Days</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Workflow</InputLabel>
            <Select value={workflowId} label="Workflow" onChange={(e) => setWorkflowId(e.target.value)}>
              <MenuItem value="all">All Workflows</MenuItem>
              {workflows.map(wf => (
                <MenuItem key={wf.id} value={wf.id}>{wf.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<FileSpreadsheet size={18} />}
            onClick={() => handleExport('csv')}
            disabled={exporting}
            sx={{ borderRadius: 2 }}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileJson size={18} />}
            onClick={() => handleExport('json')}
            disabled={exporting}
            sx={{ borderRadius: 2 }}
          >
            Export JSON
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
              <TableRow>
                <TableCell width={40} />
                <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Workflow</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actor</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Step</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Note</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <React.Fragment key={event.id}>
                  <TableRow hover onClick={() => setExpandedRow(expandedRow === event.id ? null : event.id)} sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <IconButton size="small">
                        {expandedRow === event.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>{format(new Date(event.createdAt), 'MMM dd, yyyy')}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{format(new Date(event.createdAt), 'HH:mm:ss')}</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography variant="body2" fontWeight={500}>{event.instance?.definition?.name || 'System'}</Typography>
                        {event.instanceId && <Typography variant="caption" color="textSecondary" sx={{ fontFamily: 'monospace' }}>{event.instanceId.split('-')[0]}...</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{event.actor.name}</Typography>
                      <Typography variant="caption" color="textSecondary">{event.actor.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ 
                        px: 1.5, py: 0.5, borderRadius: 10, display: 'inline-block',
                        bgcolor: alpha(getActionColor(event.action), 0.1),
                        color: getActionColor(event.action), fontSize: '0.7rem', fontWeight: 800,
                        textTransform: 'uppercase', letterSpacing: '0.05em', border: `1px solid \${alpha(getActionColor(event.action), 0.2)}`
                      }}>
                        {event.action}
                      </Box>
                    </TableCell>
                    <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{event.stepId || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {event.note}
                        </Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0, backgroundColor: alpha(theme.palette.primary.main, 0.01) }} colSpan={7}>
                      <Collapse in={expandedRow === event.id} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2, p: 3, bgcolor: 'background.paper', borderRadius: 2, border: `1px solid \${theme.palette.divider}`, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                          <Typography variant="subtitle2" gutterBottom fontWeight={700} color="primary">Snapshot Details</Typography>
                          <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.grey[50], 0.5), overflow: 'auto', maxHeight: 400 }}>
                            <pre style={{ margin: 0, fontSize: '0.85rem', fontFamily: 'JetBrains Mono, monospace' }}>
                                {JSON.stringify(event.snapshot, null, 2)}
                            </pre>
                          </Paper>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                    <Box sx={{ opacity: 0.5 }}>
                        <Calendar size={48} style={{ marginBottom: 16 }} />
                        <Typography variant="h6">No audit events found</Typography>
                        <Typography variant="body2">Try adjusting your filters or date range</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" variant="filled" onClose={() => setError(null)} sx={{ borderRadius: 2 }}>{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AuditLog;
