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
  Button
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { CloudUpload as UploadIcon } from '@mui/icons-material';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'file' | 'checkbox';
  options?: string[];
  required?: boolean;
  visibilityCondition?: {
    fieldId: string;
    value: any;
  };
}

interface DynamicFormProps {
  fields: FormField[];
  onSubmit: (data: any) => void;
  loading?: boolean;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ fields, onSubmit, loading }) => {
  const { control, handleSubmit, watch } = useForm();
  const formValues = watch();

  const isVisible = (field: FormField) => {
    if (!field.visibilityCondition) return true;
    return formValues[field.visibilityCondition.fieldId] === field.visibilityCondition.value;
  };

  const renderField = (field: FormField) => {
    if (!isVisible(field)) return null;

    return (
      <Box key={field.id} sx={{ mb: 3 }}>
        <Controller
          name={field.id}
          control={control}
          defaultValue={field.type === 'checkbox' ? false : ''}
          rules={{ required: field.required }}
          render={({ field: { onChange, value }, fieldState: { error } }) => {
            switch (field.type) {
              case 'text':
              case 'number':
              case 'date':
                return (
                  <TextField
                    fullWidth
                    label={field.label}
                    type={field.type}
                    value={value}
                    onChange={onChange}
                    error={!!error}
                    helperText={error ? `${field.label} is required` : ''}
                    InputLabelProps={field.type === 'date' ? { shrink: true } : {}}
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
                  </FormControl>
                );
              case 'checkbox':
                return (
                  <FormControlLabel
                    control={<Checkbox checked={value} onChange={(e) => onChange(e.target.checked)} />}
                    label={field.label}
                  />
                );
              case 'file':
                return (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      {field.label}
                    </Typography>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      fullWidth
                    >
                      Upload File
                      <input type="file" hidden onChange={(e) => onChange(e.target.files?.[0])} />
                    </Button>
                    {value && (
                      <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                        Selected: {value.name}
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
