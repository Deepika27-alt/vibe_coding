import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Button,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Download, Calendar } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { 
  getOverview, 
  getWorkflowStats, 
  getStepStats,
  OverviewStats,
  WorkflowStats,
  StepStats
} from '../../api/analytics';

const Analytics = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30');
  const [customRange, setCustomRange] = useState<{ from: string, to: string }>({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowStats[]>([]);
  const [steps, setSteps] = useState<StepStats[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof WorkflowStats; direction: 'asc' | 'desc' }>({
    key: 'totalRuns',
    direction: 'desc',
  });

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
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ov, wf, st] = await Promise.all([
          getOverview(dateRange.from, dateRange.to),
          getWorkflowStats(dateRange.from, dateRange.to),
          getStepStats(dateRange.from, dateRange.to),
        ]);
        setOverview(ov);
        setWorkflows(wf);
        setSteps(st);
      } catch (error) {
        console.error('Failed to fetch analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const handleExportCSV = () => {
    if (!workflows.length) return;
    
    const headers = ['Workflow Name', 'Total Runs', 'Completion Rate (%)', 'Avg Cycle Time (hrs)', 'SLA Breach Rate (%)'];
    const rows = workflows.map(wf => [
      wf.name,
      wf.totalRuns,
      wf.completionRate.toFixed(2),
      wf.avgCycleTimeHours.toFixed(2),
      wf.slaBreachRate.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortedWorkflows = useMemo(() => {
    return [...workflows].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [workflows, sortConfig]);

  const handleSort = (key: keyof WorkflowStats) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  if (loading && !overview) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">Analytics Dashboard</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {range === 'custom' && (
              <>
                <input
                  type="date"
                  value={customRange.from}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, from: e.target.value }))}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <input
                  type="date"
                  value={customRange.to}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, to: e.target.value }))}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </>
            )}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={range}
                label="Date Range"
                onChange={(e) => setRange(e.target.value)}
                startAdornment={<Calendar size={18} style={{ marginRight: 8 }} />}
              >
                <MenuItem value="7">Last 7 Days</MenuItem>
                <MenuItem value="30">Last 30 Days</MenuItem>
                <MenuItem value="90">Last 90 Days</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<Download size={18} />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total Runs', value: overview?.totalInstances, color: theme.palette.primary.main },
          { label: 'Active', value: overview?.activeInstances, color: theme.palette.info.main },
          { label: 'Completed Today', value: overview?.completedToday, color: theme.palette.success.main },
          { label: 'Avg Cycle Time', value: `${overview?.avgCycleTimeHours.toFixed(1)}h`, color: theme.palette.warning.main },
          { label: 'SLA Breach Rate', value: `${overview?.slaBreachRate.toFixed(1)}%`, color: theme.palette.error.main },
        ].map((metric, idx) => (
          <Grid item xs={12} sm={6} md={2.4} key={idx}>
            <Card sx={{ 
              borderLeft: `6px solid ${metric.color}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <CardContent>
                <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                  {metric.label}
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {metric.value ?? '-'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Bar Chart */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Completions Per Day</Typography>
        <Box sx={{ height: 350, width: '100%' }}>
          <ResponsiveContainer>
            <BarChart data={overview?.completionsPerDay}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(val) => format(new Date(val), 'MMM dd')}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                labelFormatter={(val) => format(new Date(val), 'PPP')}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="count" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Bottom Tables */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
              <Typography variant="h6">Per-Workflow Stats</Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Workflow Name</TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={sortConfig.key === 'totalRuns'}
                        direction={sortConfig.key === 'totalRuns' ? sortConfig.direction : 'asc'}
                        onClick={() => handleSort('totalRuns')}
                      >
                        Runs
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={sortConfig.key === 'completionRate'}
                        direction={sortConfig.key === 'completionRate' ? sortConfig.direction : 'asc'}
                        onClick={() => handleSort('completionRate')}
                      >
                        Success %
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">Avg Time</TableCell>
                    <TableCell align="right">SLA Breach %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedWorkflows.map((wf) => (
                    <TableRow key={wf.workflowId} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{wf.name}</TableCell>
                      <TableCell align="right">{wf.totalRuns}</TableCell>
                      <TableCell align="right">{wf.completionRate.toFixed(1)}%</TableCell>
                      <TableCell align="right">{wf.avgCycleTimeHours.toFixed(1)}h</TableCell>
                      <TableCell align="right">
                        <Box sx={{ 
                          color: wf.slaBreachRate > 20 ? 'error.main' : 'inherit',
                          fontWeight: wf.slaBreachRate > 20 ? 600 : 400
                        }}>
                          {wf.slaBreachRate.toFixed(1)}%
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
              <Typography variant="h6">Top 5 Slowest Steps</Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Step ID</TableCell>
                    <TableCell align="right">Avg Hrs</TableCell>
                    <TableCell align="right">Breaches</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {steps.map((step, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{step.stepId}</Typography>
                      </TableCell>
                      <TableCell align="right">{step.avgTimeHours.toFixed(1)}h</TableCell>
                      <TableCell align="right">{step.breachCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
