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
      <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {branches.map((branch, index) => (
          <Box 
            key={index} 
            className="nodrag"
            sx={{ 
              position: 'relative', 
              height: 32, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-end', 
              pr: 0.5,
              border: '1px solid #f1f5f9',
              borderRadius: 1,
              bgcolor: '#fff',
              mb: 0.5
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569', mr: 1 }}>
              {branch}
            </Typography>
            <Handle
              type="source"
              position={Position.Right}
              id={branch}
              style={{ 
                top: '50%', 
                right: -24, // Push it well outside the Paper's padding and border
                background: '#ec4899',
                width: 14,
                height: 14,
                border: '3px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                zIndex: 2000,
              }}
            />
          </Box>
        ))}
      </Box>
    </BaseNode>
  );
};
