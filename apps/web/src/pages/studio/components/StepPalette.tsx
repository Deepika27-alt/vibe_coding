import React from 'react';
import { Box, Typography, Paper, Stack } from '@mui/material';
import { STEP_PALETTE } from '../constants';

const StepPalette = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: 260,
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f8fafc',
        height: '100%',
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
          Step Palette
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Drag and drop steps to build your workflow
        </Typography>

        <Stack spacing={2}>
          {STEP_PALETTE.map((item) => {
            const Icon = item.icon;
            return (
              <Box
                key={item.type}
                draggable
                onDragStart={(e) => onDragStart(e, item.type)}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'white',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  cursor: 'grab',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: item.color,
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    cursor: 'grabbing',
                  }
                }}
              >
                <Box sx={{ 
                  p: 1, 
                  borderRadius: 1.5, 
                  bgcolor: `${item.color}15`, 
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={20} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#334155' }}>
                  {item.label}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Box>
      
      <Box sx={{ mt: 'auto', p: 3, borderTop: '1px solid #e2e8f0' }}>
        <Typography variant="caption" color="text.secondary">
          Tip: Select a node to configure its properties in the right panel.
        </Typography>
      </Box>
    </Paper>
  );
};

export default StepPalette;
