import React from 'react';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  Badge,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Inbox as InboxIcon, 
  Send as RequestIcon, 
  ListAlt as CatalogueIcon,
  Logout as LogoutIcon,
  People as PeopleIcon,
  Security as RolesIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
  Assessment as AnalyticsIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from '../../api/axios';

const DRAWER_WIDTH = 280;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [taskCount, setTaskCount] = React.useState(0);
  const { logout, user } = useAuth();

  React.useEffect(() => {
    const fetchTaskCount = async () => {
      try {
        const response = await axios.get('/tasks/pending');
        setTaskCount(response.data.length);
      } catch (err) {
        console.error('Failed to fetch task count', err);
      }
    };

    if (user) {
      fetchTaskCount();
      // Polling every minute
      const interval = setInterval(fetchTaskCount, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const menuItems = [
    { text: 'Inbox', icon: <InboxIcon />, path: '/inbox', badge: taskCount },
    { text: 'My Requests', icon: <RequestIcon />, path: '/requests' },
    { text: 'Catalogue', icon: <CatalogueIcon />, path: '/catalogue' },
  ];

  const adminItems = [
    { text: 'Workflows', icon: <CatalogueIcon />, path: '/admin/workflows' },
    { text: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
    { text: 'Roles', icon: <RolesIcon />, path: '/admin/roles' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
    { text: 'Analytics', icon: <AnalyticsIcon />, path: '/admin/analytics' },
    { text: 'Audit Log', icon: <HistoryIcon />, path: '/admin/audit' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.default,
        },
      }}
    >
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box 
          sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: 1, 
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}
        >
          W
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
          WorkPortal
        </Typography>
      </Box>

      <List sx={{ px: 2, py: 1 }}>
        {menuItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  backgroundColor: active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error" overlap="circular">
                      {item.icon}
                    </Badge>
                  ) : item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ fontWeight: active ? 600 : 500 }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {user?.roles?.includes('ADMIN') && (
        <>
          <Box sx={{ px: 3, mt: 2, mb: 1 }}>
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.disabled', letterSpacing: '0.1em' }}>
              Administration
            </Typography>
          </Box>
          <List sx={{ px: 2, py: 0 }}>
            {adminItems.map((item) => {
              const active = location.pathname.startsWith(item.path);
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: 2,
                      backgroundColor: active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                      color: active ? theme.palette.primary.main : theme.palette.text.secondary,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{ fontWeight: active ? 600 : 500 }} 
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </>
      )}

      <Box sx={{ mt: 'auto', p: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={logout}
            sx={{
              borderRadius: 2,
              color: 'error.main',
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.08),
              },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
