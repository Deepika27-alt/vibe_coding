import React from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import BaseNode from './BaseNode';
import { NodeConfig } from '../../types';
import { Box, Typography } from '@mui/material';

export const FormNode = (props: NodeProps<NodeConfig>) => <BaseNode {...props} type="form" />;
export const TaskNode = (props: NodeProps<NodeConfig>) => <BaseNode {...props} type="task" />;
export const ApprovalNode = (props: NodeProps<NodeConfig>) => <BaseNode {...props} type="approval" />;
export const ActionNode = (props: NodeProps<NodeConfig>) => <BaseNode {...props} type="action" />;
export const EndNode = (props: NodeProps<NodeConfig>) => <BaseNode {...props} type="end" />;

export const ConditionNode = (props: NodeProps<NodeConfig>) => {
  const branches = props.data.branches || ['True', 'False'];
  
  return (
    <BaseNode {...props} type="condition">
      <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {branches.map((branch, index) => (
          <Box key={index} sx={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 1 }}>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
              {branch}
            </Typography>
            <Handle
              type="source"
              position={Position.Right}
              id={branch}
              style={{ 
                top: '50%', 
                right: -12, 
                background: '#94a3b8',
                width: 8,
                height: 8
              }}
            />
          </Box>
        ))}
      </Box>
    </BaseNode>
  );
};
