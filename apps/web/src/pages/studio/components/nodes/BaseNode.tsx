import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import { StepType, NodeConfig } from '../../types';
import { STEP_PALETTE } from '../../constants';
import { Clock, User, FileText } from 'lucide-react';

interface BaseNodeProps extends NodeProps<NodeConfig> {
  type: StepType;
  children?: React.ReactNode;
}

const BaseNode = ({ data, selected, type, children }: BaseNodeProps) => {
  const palette = STEP_PALETTE.find((p: any) => p.type === type);
  const Icon = palette?.icon || FileText;
  const color = palette?.color || '#ccc';

  return (
    <Paper
      elevation={selected ? 8 : 2}
      sx={{
        width: 220,
        borderRadius: 3,
        border: selected ? `2px solid #3b82f6` : '2px solid transparent',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: selected ? '#3b82f6' : '#e2e8f0',
        }
      }}
    >
      {/* Top Handle */}
      {type !== 'form' && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: '#94a3b8', width: 8, height: 8 }}
        />
      )}

      {/* Header */}
      <Box sx={{ 
        p: 1.5, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1.5,
        borderBottom: '1px solid #f1f5f9',
        bgcolor: `${color}10`,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10
      }}>
        <Box sx={{ 
          p: 0.75, 
          borderRadius: 1.5, 
          bgcolor: color, 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={18} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
            {data.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
            {type}
          </Typography>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ p: 1.5 }}>
        {(data.assigneeType || data.assigneeId) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <User size={14} color="#64748b" />
            <Typography variant="caption" color="text.secondary">
              {data.assigneeId || 'Unassigned'}
            </Typography>
          </Box>
        )}
        {data.sla && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Clock size={14} color="#64748b" />
            <Typography variant="caption" color="text.secondary">
              {data.sla}h SLA
            </Typography>
          </Box>
        )}
        {children}
      </Box>

      {/* Bottom Handle */}
      {type !== 'end' && type !== 'condition' && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: '#94a3b8', width: 8, height: 8 }}
        />
      )}

      {/* Condition Handles will be handled in ConditionNode */}
    </Paper>
  );
};

export default memo(BaseNode);
