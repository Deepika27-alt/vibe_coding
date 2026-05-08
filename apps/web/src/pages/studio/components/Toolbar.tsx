import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  IconButton, 
  Stack, 
  Tooltip,
  Divider,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  Save, 
  Send, 
  Play, 
  History, 
  ChevronDown, 
  ArrowLeft,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ToolbarProps {
  workflowName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onPublish: () => void;
  onSimulate: () => void;
  isSaving?: boolean;
  isPublishing?: boolean;
}

const Toolbar = ({ 
  workflowName, 
  onNameChange, 
  onSave, 
  onPublish, 
  onSimulate,
  isSaving,
  isPublishing 
}: ToolbarProps) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [historyAnchor, setHistoryAnchor] = useState<null | HTMLElement>(null);

  return (
    <Box sx={{ 
      height: 64, 
      borderBottom: '1px solid #e2e8f0', 
      display: 'flex', 
      alignItems: 'center', 
      px: 3, 
      gap: 3,
      bgcolor: 'white',
      zIndex: 10
    }}>
      <IconButton onClick={() => navigate('/admin/workflows')} size="small">
        <ArrowLeft size={20} />
      </IconButton>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        {isEditing ? (
          <TextField
            variant="standard"
            value={workflowName}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={() => setIsEditing(false)}
            autoFocus
            sx={{ 
              '& .MuiInput-root': { fontSize: '1.25rem', fontWeight: 700 } 
            }}
          />
        ) : (
          <Typography 
            variant="h6" 
            sx={{ fontWeight: 700, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
            onClick={() => setIsEditing(true)}
          >
            {workflowName}
          </Typography>
        )}
        <Box sx={{ 
          px: 1, 
          py: 0.25, 
          borderRadius: 1, 
          bgcolor: '#f1f5f9', 
          color: '#64748b', 
          fontSize: '0.75rem', 
          fontWeight: 600 
        }}>
          DRAFT
        </Box>
      </Box>

      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          variant="outlined"
          startIcon={<History size={16} />}
          endIcon={<ChevronDown size={16} />}
          onClick={(e) => setHistoryAnchor(e.currentTarget)}
          sx={{ color: '#64748b', borderColor: '#e2e8f0' }}
        >
          v1.0.4
        </Button>
        
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        <Button
          variant="text"
          startIcon={<Play size={16} />}
          onClick={onSimulate}
          sx={{ color: '#64748b' }}
        >
          Simulate
        </Button>

        <Button
          variant="outlined"
          startIcon={<Save size={16} />}
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save draft'}
        </Button>

        <Button
          variant="contained"
          startIcon={<Send size={16} />}
          onClick={onPublish}
          disabled={isPublishing}
          sx={{ 
            bgcolor: '#3b82f6', 
            boxShadow: '0 4px 6px -1px rgb(59 130 246 / 0.5)',
            '&:hover': { bgcolor: '#2563eb' }
          }}
        >
          Publish
        </Button>
      </Stack>

      <Menu
        anchorEl={historyAnchor}
        open={Boolean(historyAnchor)}
        onClose={() => setHistoryAnchor(null)}
      >
        <MenuItem onClick={() => setHistoryAnchor(null)}>v1.0.4 (Current)</MenuItem>
        <MenuItem onClick={() => setHistoryAnchor(null)}>v1.0.3 - 2 days ago</MenuItem>
        <MenuItem onClick={() => setHistoryAnchor(null)}>v1.0.2 - 1 week ago</MenuItem>
      </Menu>
    </Box>
  );
};

export default Toolbar;
