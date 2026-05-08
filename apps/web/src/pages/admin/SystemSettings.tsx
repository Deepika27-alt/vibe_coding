import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Stack, 
  Paper, 
  Switch, 
  FormControlLabel, 
  Divider,
  Alert,
  IconButton,
  Avatar,
  Grid
} from '@mui/material';
import { 
  Save as SaveIcon, 
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import axios from '../../api/axios';
import { SystemSettings as SettingsType } from '../../types/admin';

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsType>({
    email: {
      smtpHost: '',
      smtpPort: 587,
      fromAddress: ''
    },
    notifications: {
      'task_assigned': true,
      'task_reminder': true,
      'workflow_completed': true,
      'workflow_rejected': true
    },
    branding: {
      companyName: 'WorkPortal',
      logoUrl: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/settings');
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings', error);
      // Fallback to defaults or mock
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.patch('/settings', settings);
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    try {
      await axios.post('/settings/test-smtp', settings.email);
      setTestStatus('success');
    } catch (error) {
      setTestStatus('error');
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Mock upload
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({
          ...settings,
          branding: { ...settings.branding, logoUrl: reader.result as string }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>System Settings</Typography>
        <Button 
          variant="contained" 
          startIcon={<SaveIcon />} 
          onClick={handleSave}
          disabled={loading}
        >
          Save All Settings
        </Button>
      </Box>

      <Stack spacing={4}>
        {/* Email Settings */}
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Email Configuration (SMTP)</Typography>
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField 
                  label="SMTP Host" 
                  fullWidth 
                  value={settings.email.smtpHost}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: { ...settings.email, smtpHost: e.target.value }
                  })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField 
                  label="Port" 
                  type="number"
                  fullWidth 
                  value={settings.email.smtpPort}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: { ...settings.email, smtpPort: parseInt(e.target.value) }
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  label="From Address" 
                  fullWidth 
                  value={settings.email.fromAddress}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: { ...settings.email, fromAddress: e.target.value }
                  })}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button 
                variant="outlined" 
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
              >
                Test Connection
              </Button>
              {testStatus === 'success' && (
                <Alert severity="success" icon={<SuccessIcon />} sx={{ py: 0 }}>Connection successful</Alert>
              )}
              {testStatus === 'error' && (
                <Alert severity="error" icon={<ErrorIcon />} sx={{ py: 0 }}>Connection failed</Alert>
              )}
            </Box>
          </Stack>
        </Paper>

        {/* Notification Settings */}
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Notification Preferences</Typography>
          <Stack spacing={1}>
            {Object.keys(settings.notifications).map((event) => (
              <FormControlLabel
                key={event}
                control={
                  <Switch 
                    checked={settings.notifications[event]} 
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, [event]: e.target.checked }
                    })}
                  />
                }
                label={`Notify on ${event.replace(/_/g, ' ')}`}
              />
            ))}
          </Stack>
        </Paper>

        {/* Branding Settings */}
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>White-labeling & Branding</Typography>
          <Stack spacing={3}>
            <TextField 
              label="Company Name" 
              fullWidth 
              value={settings.branding.companyName}
              onChange={(e) => setSettings({
                ...settings,
                branding: { ...settings.branding, companyName: e.target.value }
              })}
            />
            
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Company Logo</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar 
                  src={settings.branding.logoUrl} 
                  variant="rounded" 
                  sx={{ width: 100, height: 100, bgcolor: 'grey.200' }}
                >
                  {settings.branding.companyName.charAt(0)}
                </Avatar>
                <Button 
                  variant="outlined" 
                  startIcon={<UploadIcon />}
                  component="label"
                >
                  Upload Logo
                  <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                </Button>
              </Box>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
};

export default SystemSettings;
