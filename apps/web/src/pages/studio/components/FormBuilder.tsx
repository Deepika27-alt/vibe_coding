import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  Divider,
  TextField,
  FormControlLabel,
  Switch,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Collapse,
  Select,
  InputLabel,
  FormControl,
  Tooltip
} from '@mui/material';
import {
  GripVertical,
  Trash2,
  Plus,
  Type,
  Hash,
  Calendar,
  ChevronDown,
  CheckSquare,
  Upload,
  FileEdit,
  X,
  ChevronUp,
  Eye,
  Settings2,
  PlusCircle,
  MoreVertical
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { v4 as uuidv4 } from 'uuid';
import { FormField, FieldType, VisibilityCondition } from '../types';
import DynamicForm from '../../../components/Forms/DynamicForm';

interface FormBuilderProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

const FIELD_TYPES: { type: FieldType; label: string; icon: React.ReactNode }[] = [
  { type: 'text', label: 'Text Input', icon: <Type size={18} /> },
  { type: 'number', label: 'Number', icon: <Hash size={18} /> },
  { type: 'date', label: 'Date Picker', icon: <Calendar size={18} /> },
  { type: 'dropdown', label: 'Dropdown', icon: <ChevronDown size={18} /> },
  { type: 'checkbox', label: 'Checkbox', icon: <CheckSquare size={18} /> },
  { type: 'file', label: 'File Upload', icon: <Upload size={18} /> },
  { type: 'rich-text', label: 'Rich Text', icon: <FileEdit size={18} /> },
];

const SortableFieldItem = ({ 
  field, 
  isSelected, 
  onSelect, 
  onDelete 
}: { 
  field: FormField; 
  isSelected: boolean; 
  onSelect: () => void;
  onDelete: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = FIELD_TYPES.find(t => t.type === field.type)?.icon || <Type size={18} />;

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={isSelected ? 2 : 0}
      onClick={onSelect}
      sx={{
        p: 1.5,
        mb: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        cursor: 'pointer',
        border: '1px solid',
        borderColor: isSelected ? 'primary.main' : '#e2e8f0',
        borderRadius: 2,
        backgroundColor: isSelected ? '#f8fafc' : 'white',
        '&:hover': {
          borderColor: 'primary.light',
          backgroundColor: '#f8fafc',
        },
      }}
    >
      <Box {...attributes} {...listeners} sx={{ cursor: 'grab', display: 'flex', color: '#94a3b8' }}>
        <GripVertical size={20} />
      </Box>
      
      <Box sx={{ color: 'primary.main', display: 'flex' }}>
        {Icon}
      </Box>
      
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {field.label || 'Untitled Field'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {field.type}
        </Typography>
      </Box>

      {field.required && (
        <Badge badgeContent="Req" color="primary" sx={{ 
          '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 24, borderRadius: 1 } 
        }} />
      )}

      <IconButton 
        size="small" 
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        sx={{ color: '#ef4444', opacity: 0.6, '&:hover': { opacity: 1 } }}
      >
        <Trash2 size={16} />
      </IconButton>
    </Paper>
  );
};

const FieldConfigPanel = ({ 
  field, 
  allFields,
  onUpdate 
}: { 
  field: FormField | null; 
  allFields: FormField[];
  onUpdate: (updates: Partial<FormField>) => void;
}) => {
  if (!field) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4, textAlign: 'center' }}>
        <Box>
          <Settings2 size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
          <Typography color="text.secondary">
            Select a field to configure its properties
          </Typography>
        </Box>
      </Box>
    );
  }

  const handleVisibilityChange = (updates: Partial<VisibilityCondition>) => {
    onUpdate({
      visibilityCondition: {
        ...(field.visibilityCondition || { fieldId: '', operator: 'equals', value: '' }),
        ...updates
      }
    });
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflowY: 'auto' }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
        Field Properties
      </Typography>

      <Stack spacing={3}>
        <TextField
          fullWidth
          label="Label"
          size="small"
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
        />

        <TextField
          fullWidth
          label="Placeholder"
          size="small"
          value={field.placeholder || ''}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
        />

        <TextField
          fullWidth
          label="Help Text"
          size="small"
          multiline
          rows={2}
          value={field.helpText || ''}
          onChange={(e) => onUpdate({ helpText: e.target.value })}
        />

        <FormControlLabel
          control={
            <Switch 
              checked={!!field.required} 
              onChange={(e) => onUpdate({ required: e.target.checked })}
              color="primary"
            />
          }
          label="Required Field"
        />

        <Divider />

        {/* Type Specific Fields */}
        {field.type === 'dropdown' && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Options
            </Typography>
            <Stack spacing={1}>
              {(field.options || []).map((opt, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Stack direction="column">
                    <IconButton 
                      size="small" 
                      disabled={idx === 0}
                      onClick={() => {
                        const newOpts = [...(field.options || [])];
                        [newOpts[idx], newOpts[idx - 1]] = [newOpts[idx - 1], newOpts[idx]];
                        onUpdate({ options: newOpts });
                      }}
                      sx={{ p: 0 }}
                    >
                      <ChevronUp size={14} />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      disabled={idx === (field.options || []).length - 1}
                      onClick={() => {
                        const newOpts = [...(field.options || [])];
                        [newOpts[idx], newOpts[idx + 1]] = [newOpts[idx + 1], newOpts[idx]];
                        onUpdate({ options: newOpts });
                      }}
                      sx={{ p: 0 }}
                    >
                      <ChevronDown size={14} />
                    </IconButton>
                  </Stack>
                  <TextField
                    fullWidth
                    size="small"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...(field.options || [])];
                      newOpts[idx] = e.target.value;
                      onUpdate({ options: newOpts });
                    }}
                  />
                  <IconButton 
                    size="small" 
                    onClick={() => {
                      const newOpts = (field.options || []).filter((_, i) => i !== idx);
                      onUpdate({ options: newOpts });
                    }}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Box>
              ))}
              <Button 
                startIcon={<Plus size={16} />} 
                onClick={() => onUpdate({ options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`] })}
                sx={{ alignSelf: 'flex-start' }}
              >
                Add Option
              </Button>
            </Stack>
          </Box>
        )}

        {field.type === 'number' && (
          <Stack direction="row" spacing={2}>
            <TextField
              label="Min Value"
              type="number"
              size="small"
              value={field.min ?? ''}
              onChange={(e) => onUpdate({ min: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
            <TextField
              label="Max Value"
              type="number"
              size="small"
              value={field.max ?? ''}
              onChange={(e) => onUpdate({ max: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
          </Stack>
        )}

        {field.type === 'text' && (
          <>
            <TextField
              label="Max Length"
              type="number"
              size="small"
              value={field.maxLength ?? ''}
              onChange={(e) => onUpdate({ maxLength: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
            <TextField
              label="Regex Pattern"
              size="small"
              placeholder="e.g. ^[0-9]*$"
              value={field.regexPattern || ''}
              onChange={(e) => onUpdate({ regexPattern: e.target.value })}
            />
          </>
        )}

        {field.type === 'file' && (
          <>
            <TextField
              label="Accepted Types (e.g. .pdf,.jpg)"
              size="small"
              value={field.acceptedTypes || ''}
              onChange={(e) => onUpdate({ acceptedTypes: e.target.value })}
            />
            <TextField
              label="Max Size (MB)"
              type="number"
              size="small"
              value={field.maxSizeMB ?? ''}
              onChange={(e) => onUpdate({ maxSizeMB: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
          </>
        )}

        <Divider />

        {/* Conditional Visibility */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
            Conditional Visibility
          </Typography>
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Show this field when...</InputLabel>
              <Select
                label="Show this field when..."
                value={field.visibilityCondition?.fieldId || ''}
                onChange={(e) => handleVisibilityChange({ fieldId: e.target.value })}
              >
                <MenuItem value="">Always Visible</MenuItem>
                {allFields.filter(f => f.id !== field.id).map(f => (
                  <MenuItem key={f.id} value={f.id}>{f.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {field.visibilityCondition?.fieldId && (
              <>
                <FormControl fullWidth size="small">
                  <InputLabel>Operator</InputLabel>
                  <Select
                    label="Operator"
                    value={field.visibilityCondition.operator}
                    onChange={(e) => handleVisibilityChange({ operator: e.target.value as any })}
                  >
                    <MenuItem value="equals">Equals</MenuItem>
                    <MenuItem value="not_equals">Does not equal</MenuItem>
                    <MenuItem value="is_filled">Is filled</MenuItem>
                  </Select>
                </FormControl>

                {field.visibilityCondition.operator !== 'is_filled' && (
                  <TextField
                    fullWidth
                    label="Value"
                    size="small"
                    value={field.visibilityCondition.value || ''}
                    onChange={(e) => handleVisibilityChange({ value: e.target.value })}
                  />
                )}
              </>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

const FormBuilder: React.FC<FormBuilderProps> = ({ fields, onChange }) => {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const selectedField = useMemo(() => 
    fields.find(f => f.id === selectedFieldId) || null, 
  [fields, selectedFieldId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over?.id);
      onChange(arrayMove(fields, oldIndex, newIndex));
    }
  };

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: uuidv4(),
      type,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      required: false,
    };
    if (type === 'dropdown') newField.options = ['Option 1'];
    
    onChange([...fields, newField]);
    setSelectedFieldId(newField.id);
    setAnchorEl(null);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    onChange(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteField = (id: string) => {
    onChange(fields.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Field List */}
        <Box sx={{ 
          width: '40%', 
          borderRight: '1px solid #e2e8f0', 
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: 'white'
        }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569' }}>
              FIELDS ({fields.length})
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<Plus size={16} />}
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ borderRadius: 1.5, textTransform: 'none' }}
            >
              Add Field
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              PaperProps={{ sx: { width: 220, borderRadius: 2, mt: 1, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' } }}
            >
              {FIELD_TYPES.map((ft) => (
                <MenuItem key={ft.type} onClick={() => addField(ft.type)}>
                  <ListItemIcon sx={{ color: 'primary.main' }}>{ft.icon}</ListItemIcon>
                  <ListItemText primary={ft.label} />
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={fields.map(f => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {fields.map((field) => (
                  <SortableFieldItem
                    key={field.id}
                    field={field}
                    isSelected={selectedFieldId === field.id}
                    onSelect={() => setSelectedFieldId(field.id)}
                    onDelete={() => deleteField(field.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
            
            {fields.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
                <PlusCircle size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
                <Typography color="text.secondary" variant="body2">
                  No fields added yet. Click "Add Field" to start building your form.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Right: Config Panel */}
        <Box sx={{ width: '60%', bgcolor: 'white', overflow: 'hidden' }}>
          <FieldConfigPanel
            field={selectedField}
            allFields={fields}
            onUpdate={(updates) => selectedFieldId && updateField(selectedFieldId, updates)}
          />
        </Box>
      </Box>

      {/* Bottom: Preview Panel */}
      <Box sx={{ borderTop: '1px solid #e2e8f0', bgcolor: 'white' }}>
        <Box 
          sx={{ 
            px: 2, 
            py: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: 'pointer',
            '&:hover': { bgcolor: '#f1f5f9' }
          }}
          onClick={() => setShowPreview(!showPreview)}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Eye size={16} color="#64748b" />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', letterSpacing: 0.5 }}>
              LIVE PREVIEW
            </Typography>
          </Stack>
          <IconButton size="small">
            {showPreview ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </IconButton>
        </Box>
        
        <Collapse in={showPreview}>
          <Box sx={{ p: 3, maxHeight: 400, overflowY: 'auto', bgcolor: '#f8fafc' }}>
            <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto', borderRadius: 3 }}>
              {fields.length > 0 ? (
                <DynamicForm fields={fields} onSubmit={(data) => console.log('Preview submit:', data)} />
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Add fields to see the preview
                </Typography>
              )}
            </Paper>
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

export default FormBuilder;
