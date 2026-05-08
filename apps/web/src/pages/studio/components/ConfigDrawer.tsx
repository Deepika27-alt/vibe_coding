import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Drawer, 
  TextField, 
  FormControl, 
  FormLabel, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Select, 
  MenuItem, 
  Button, 
  Stack,
  IconButton,
  Divider,
  InputAdornment
} from '@mui/material';
import { X, Settings, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { WorkflowNode, NodeConfig, FormField } from '../types';
import FormBuilder from './FormBuilder';

interface ConfigDrawerProps {
  selectedNode: WorkflowNode | null;
  onUpdate: (id: string, data: Partial<NodeConfig>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const ConfigDrawer = ({ selectedNode, onUpdate, onDelete, onClose }: ConfigDrawerProps) => {
  const [isBuildingForm, setIsBuildingForm] = useState(false);

  if (!selectedNode) return null;

  const { id, type, data } = selectedNode;

  const handleChange = (field: keyof NodeConfig, value: any) => {
    onUpdate(id, { [field]: value });
  };

  const handleFieldsChange = (fields: FormField[]) => {
    handleChange('fields', fields);
  };

  const renderSpecificFields = () => {
    if (isBuildingForm && type === 'form') {
      return (
        <Box sx={{ height: 'calc(100vh - 70px)', mt: -3, mx: -3 }}>
          <FormBuilder 
            fields={data.fields || []} 
            onChange={handleFieldsChange} 
          />
        </Box>
      );
    }

    switch (type) {
      case 'task':
      case 'approval':
        return (
          <>
            <FormControl sx={{ mt: 3 }}>
              <FormLabel sx={{ fontWeight: 600, mb: 1 }}>Assign to</FormLabel>
              <RadioGroup
                row
                value={data.assigneeType || 'role'}
                onChange={(e) => handleChange('assigneeType', e.target.value)}
              >
                <FormControlLabel value="role" control={<Radio size="small" />} label="Role" />
                <FormControlLabel value="user" control={<Radio size="small" />} label="Specific User" />
              </RadioGroup>
            </FormControl>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <FormLabel sx={{ fontWeight: 600, mb: 1 }}>Select {data.assigneeType || 'Role'}</FormLabel>
              <Select
                size="small"
                value={data.assigneeId || ''}
                onChange={(e) => handleChange('assigneeId', e.target.value)}
              >
                <MenuItem value="admin">Administrator</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="hr">HR Representative</MenuItem>
                <MenuItem value="finance">Finance Officer</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="SLA (Hours)"
              type="number"
              size="small"
              sx={{ mt: 3 }}
              value={data.sla || ''}
              onChange={(e) => handleChange('sla', parseInt(e.target.value))}
              InputProps={{
                endAdornment: <InputAdornment position="end">hrs</InputAdornment>,
              }}
            />

            <TextField
              fullWidth
              label="Escalation Target"
              placeholder="e.g. manager"
              size="small"
              sx={{ mt: 3 }}
              value={data.escalationTarget || ''}
              onChange={(e) => handleChange('escalationTarget', e.target.value)}
            />
          </>
        );

      case 'action':
        return (
          <>
            <FormControl fullWidth sx={{ mt: 3 }}>
              <FormLabel sx={{ fontWeight: 600, mb: 1 }}>Action Type</FormLabel>
              <Select
                size="small"
                value={data.actionType || 'email'}
                onChange={(e) => handleChange('actionType', e.target.value)}
              >
                <MenuItem value="email">Send Email</MenuItem>
                <MenuItem value="webhook">Call Webhook</MenuItem>
                <MenuItem value="api">Call Internal API</MenuItem>
              </Select>
            </FormControl>
            
            {data.actionType === 'email' && (
              <TextField
                fullWidth
                label="Email Template ID"
                size="small"
                sx={{ mt: 3 }}
                value={data.actionConfig?.templateId || ''}
                onChange={(e) => handleChange('actionConfig', { ...data.actionConfig, templateId: e.target.value })}
              />
            )}
            
            {data.actionType === 'webhook' && (
              <TextField
                fullWidth
                label="Webhook URL"
                size="small"
                sx={{ mt: 3 }}
                value={data.actionConfig?.url || ''}
                onChange={(e) => handleChange('actionConfig', { ...data.actionConfig, url: e.target.value })}
              />
            )}
          </>
        );

      case 'condition':
        return (
          <>
            <FormControl fullWidth sx={{ mt: 3 }}>
              <FormLabel sx={{ fontWeight: 600, mb: 1 }}>Field to Check</FormLabel>
              <Select
                size="small"
                value={data.conditionField || ''}
                onChange={(e) => handleChange('conditionField', e.target.value)}
              >
                <MenuItem value="amount">Amount</MenuItem>
                <MenuItem value="reason">Reason</MenuItem>
                <MenuItem value="priority">Priority</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <FormLabel sx={{ fontWeight: 600, mb: 1 }}>Operator</FormLabel>
              <Select
                size="small"
                value={data.conditionOperator || 'equals'}
                onChange={(e) => handleChange('conditionOperator', e.target.value)}
              >
                <MenuItem value="equals">Equals</MenuItem>
                <MenuItem value="contains">Contains</MenuItem>
                <MenuItem value="gt">Greater Than</MenuItem>
                <MenuItem value="lt">Less Than</MenuItem>
                <MenuItem value="empty">Is Empty</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Value"
              size="small"
              sx={{ mt: 2 }}
              value={data.conditionValue || ''}
              onChange={(e) => handleChange('conditionValue', e.target.value)}
            />

            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <FormLabel sx={{ fontWeight: 600 }}>Branches</FormLabel>
                <IconButton size="small" onClick={() => handleChange('branches', [...(data.branches || []), 'New Branch'])}>
                  <Plus size={16} />
                </IconButton>
              </Box>
              <Stack spacing={1}>
                {(data.branches || []).map((branch, index) => (
                  <TextField
                    key={index}
                    fullWidth
                    size="small"
                    value={branch}
                    onChange={(e) => {
                      const newBranches = [...(data.branches || [])];
                      newBranches[index] = e.target.value;
                      handleChange('branches', newBranches);
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </>
        );

      case 'form':
        return (
          <Box sx={{ mt: 3 }}>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={() => setIsBuildingForm(true)}
              sx={{ py: 1.5, borderRadius: 2 }}
            >
              Open Form Builder
            </Button>
            {data.fields && data.fields.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                {data.fields.length} field(s) configured
              </Typography>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const drawerWidth = isBuildingForm ? 800 : 360;

  return (
    <Drawer
      anchor="right"
      open={true}
      onClose={() => {
        setIsBuildingForm(false);
        onClose();
      }}
      variant="persistent"
      sx={{
        width: drawerWidth,
        transition: 'width 0.3s ease',
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          transition: 'width 0.3s ease',
          boxSizing: 'border-box',
          borderLeft: '1px solid #e2e8f0',
          boxShadow: '-4px 0 10px -2px rgba(0,0,0,0.05)',
        },
      }}
    >
      <Box sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          p: 2.5, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {isBuildingForm ? (
              <>
                <IconButton size="small" onClick={() => setIsBuildingForm(false)}>
                  <ArrowLeft size={20} />
                </IconButton>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Form Builder: {data.name}
                </Typography>
              </>
            ) : (
              <>
                <Settings size={20} color="#64748b" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Step Configuration
                </Typography>
              </>
            )}
          </Stack>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, p: isBuildingForm ? 0 : 3, overflowY: 'auto' }}>
          {!isBuildingForm && (
            <>
              <TextField
                fullWidth
                label="Step Name"
                value={data.name}
                onChange={(e) => handleChange('name', e.target.value)}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={data.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                sx={{ mb: 3 }}
              />

              <Divider sx={{ my: 2 }} />
            </>
          )}

          {renderSpecificFields()}
        </Box>

        {!isBuildingForm && (
          <Box sx={{ p: 2, borderTop: '1px solid #f1f5f9', display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<Trash2 size={18} />}
              onClick={() => onDelete(id)}
              sx={{ borderRadius: 2 }}
            >
              Delete Step
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default ConfigDrawer;
