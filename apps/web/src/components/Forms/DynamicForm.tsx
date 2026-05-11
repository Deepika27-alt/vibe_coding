import React from 'react';
import { 
  Box, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Checkbox, 
  FormControlLabel, 
  Typography,
  Button,
  FormHelperText
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { FormField } from '../../pages/studio/types';

interface DynamicFormProps {
  fields: FormField[];
  onSubmit: (data: any) => void;
  loading?: boolean;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ fields, onSubmit, loading }) => {
  const { control, handleSubmit, watch } = useForm();
  const formValues = watch();

  const isVisible = (field: FormField) => {
    if (!field.visibilityCondition || !field.visibilityCondition.fieldId) return true;
    
    const condition = field.visibilityCondition;
    const dependentValue = formValues[condition.fieldId];

    switch (condition.operator) {
      case 'equals':
        return dependentValue === condition.value;
      case 'not_equals':
        return dependentValue !== condition.value;
      case 'is_filled':
        return dependentValue !== undefined && dependentValue !== '' && dependentValue !== null;
      default:
        return true;
    }
  };

  const renderField = (field: FormField) => {
    if (!isVisible(field)) return null;

    return (
      <Box key={field.id} sx={{ mb: 3 }}>
        <Controller
          name={field.id}
          control={control}
          defaultValue={field.type === 'checkbox' ? false : ''}
          rules={{ 
            required: field.required,
            min: field.min,
            max: field.max,
            maxLength: field.maxLength,
            pattern: field.regexPattern ? { value: new RegExp(field.regexPattern), message: 'Invalid format' } : undefined
          }}
          render={({ field: { onChange, value }, fieldState: { error } }) => {
            const commonProps = {
              fullWidth: true,
              label: field.label,
              value: value,
              onChange: onChange,
              error: !!error,
              helperText: error ? (error.message || `${field.label} is required`) : (field.helpText || ''),
              placeholder: field.placeholder,
            };

            switch (field.type) {
              case 'text':
              case 'number':
              case 'date':
                return (
                  <TextField
                    {...commonProps}
                    type={field.type}
                    InputLabelProps={field.type === 'date' ? { shrink: true } : {}}
                    inputProps={{
                      min: field.min,
                      max: field.max,
                    }}
                  />
                );
              case 'textarea':
              case 'rich-text':
                return (
                  <TextField
                    {...commonProps}
                    multiline
                    rows={4}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white' } }}
                  />
                );
              case 'dropdown':
                return (
                  <FormControl fullWidth error={!!error}>
                    <InputLabel>{field.label}</InputLabel>
                    <Select value={value} label={field.label} onChange={onChange}>
                      {field.options?.map((opt) => (
                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                      ))}
                    </Select>
                    {(error || field.helpText) && (
                      <FormHelperText>{error ? `${field.label} is required` : field.helpText}</FormHelperText>
                    )}
                  </FormControl>
                );
              case 'checkbox':
                return (
                  <Box>
                    <FormControlLabel
                      control={<Checkbox checked={value} onChange={(e) => onChange(e.target.checked)} />}
                      label={field.label}
                    />
                    {field.helpText && <Typography variant="caption" display="block" color="text.secondary">{field.helpText}</Typography>}
                  </Box>
                );
              case 'file':
                return (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      {field.label} {field.required && '*'}
                    </Typography>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      fullWidth
                      color={error ? 'error' : 'primary'}
                    >
                      {value ? (value instanceof File ? value.name : 'File Selected') : 'Upload File'}
                      <input 
                        type="file" 
                        hidden 
                        accept={field.acceptedTypes}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && field.maxSizeMB && file.size > field.maxSizeMB * 1024 * 1024) {
                            alert(`File size exceeds ${field.maxSizeMB}MB`);
                            return;
                          }
                          onChange(file);
                        }} 
                      />
                    </Button>
                    {(error || field.helpText) && (
                      <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5, display: 'block' }}>
                        {error ? `${field.label} is required` : field.helpText}
                      </Typography>
                    )}
                  </Box>
                );
              default:
                return <></>;
            }
          }}
        />
      </Box>
    );
  };

  return (
    <form id="task-form" onSubmit={handleSubmit(onSubmit)}>
      {fields.map(renderField)}
    </form>
  );
};

export default DynamicForm;
