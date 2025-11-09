import React, { createContext, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
    Box, Snackbar, Alert, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Switch,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, TextField,
    AppBar, Toolbar, Typography, IconButton
} from '@mui/material';

import {
  Home as HomeIcon,
  Info as InfoIcon,
  Mail as MailIcon,
  Menu as MenuIcon,
  History as HistoryIcon,
} from '@mui/icons-material';

export const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {},
  snackbarOpen: false,
  setSnackbarOpen: () => {},
  snackbarMessage: '',
  setSnackbarMessage: () => {},
  snackbarSeverity: 'info',
  setSnackbarSeverity: () => {},
  drawerOpen: false,
  toggleDrawer: () => {},
  dialogOpen: false,
  handleDialogOpen: () => {},
  handleDialogClose: () => {},
  handleSubmit: () => {},
  colors: {
    paper_bgcolor: 'white',
    plot_bgcolor: 'white',
    textColor: 'black',
    gridColor: 'rgba(0, 0, 0, 0.1)'
  }
});

export default function Background({ children }) {
  const theme = useTheme();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  const toggleDarkMode = () => {
    setDarkMode((d) => {
      const newMode = !d;
      setSnackbarMessage(newMode ? 'Dark mode enabled!' : 'Light mode enabled!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      return newMode;
    });
  };

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggleDrawer = (open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleDialogOpen = () => setDialogOpen(true);
  const handleDialogClose = () => setDialogOpen(false);

  const handleSubmit = () => {
    handleDialogClose();
    setSnackbarMessage('Contact form submission is not available at this time.');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
  };

  const contextValue = {
    darkMode,
    toggleDarkMode,
    snackbarOpen,
    setSnackbarOpen,
    snackbarMessage,
    setSnackbarMessage,
    snackbarSeverity,
    setSnackbarSeverity,
    drawerOpen,
    toggleDrawer,
    dialogOpen,
    handleDialogOpen,
    handleDialogClose,
    handleSubmit,
    colors: {
      paper_bgcolor: darkMode ? theme.palette.grey[900] : theme.palette.background.default,
      textColor: darkMode ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
      textSecondary: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
      textDisabled: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.38)',
      borderColor: darkMode ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
      borderHover: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
      gridColor: darkMode ? 'rgba(255,255,255,0.08)' : theme.palette.divider,
      plot_bgcolor: darkMode ? theme.palette.grey[900] : theme.palette.background.default,
      backgroundColor: darkMode ? '#000' : 'transparent'
    }
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh', 
        bgcolor: darkMode ? '#000' : 'background.default', 
        color: darkMode ? 'common.white' : 'common.black',
        transition: 'background-color 0.3s ease'
      }}>
        <AppBar position="static" sx={{
          bgcolor: darkMode ? '#0a0a0a' : 'primary.main',
          boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.5)' : undefined
        }}>
          <Toolbar>
            <IconButton 
              edge="start" 
              color="inherit" 
              aria-label="menu" 
              onClick={toggleDrawer(true)}
              sx={{
                '&:hover': {
                  bgcolor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              SPECTER - Spam and Malware Detection System
            </Typography>
            <Button 
              color="inherit" 
              onClick={handleDialogOpen}
              sx={{
                '&:hover': {
                  bgcolor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Contact
            </Button>
          </Toolbar>
        </AppBar>
        
        {children}
        
        <Drawer 
          anchor="left" 
          open={drawerOpen} 
          onClose={toggleDrawer(false)}
          PaperProps={{
            sx: {
              bgcolor: darkMode ? '#0f0f0f' : 'background.paper',
              color: darkMode ? '#fff' : 'text.primary',
              backgroundImage: 'none',
              borderRight: darkMode ? '1px solid rgba(255,255,255,0.12)' : undefined,
              transition: 'background-color 0.3s ease'
            }
          }}
        >
          <Box 
            sx={{ width: 250 }} 
            role="presentation"
          >
            {/* Drawer Header */}
            <Box sx={{
              p: 2,
              bgcolor: darkMode ? '#0a0a0a' : 'primary.main',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <MenuIcon />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Navigation
              </Typography>
            </Box>

            <List onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
              {[
                { text: 'Home', path: '/', icon: <HomeIcon /> },
                { text: 'About', path: '/about', icon: <InfoIcon /> },
                { text: 'Previous Results', path: '/previous-results', icon: <HistoryIcon /> },
                { text: 'Contact', path: '#', icon: <MailIcon /> }
              ].map((item) => (
                <ListItem 
                  button 
                  key={item.text}
                  onClick={() => {
                    if (item.path !== '#') {
                      navigate(item.path);
                    } else {
                      handleDialogOpen();
                    }
                  }}
                  sx={{
                    '&:hover': {
                      bgcolor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'
                    },
                    borderRadius: '8px',
                    mx: 1,
                    mb: 0.5
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: darkMode ? '#fff' : 'inherit',
                    minWidth: 40
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      sx: { 
                        color: darkMode ? '#fff' : 'inherit',
                        fontWeight: 500
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
            
            <Divider sx={{ 
              my: 1,
              borderColor: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
            }} />
            
            <List>
              <ListItem sx={{ px: 2 }}>
                <ListItemText 
                  primary="Dark Mode"
                  primaryTypographyProps={{
                    sx: { 
                      color: darkMode ? '#fff' : 'inherit',
                      fontWeight: 500
                    }
                  }}
                />
                <Switch 
                  checked={darkMode} 
                  onChange={toggleDarkMode}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: darkMode ? '#90caf9' : 'primary.main',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: darkMode ? '#90caf9' : 'primary.main',
                    }
                  }}
                />
              </ListItem>
            </List>
          </Box>
        </Drawer>
        
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={(event, reason) => {
            if (reason === 'clickaway') return;
            setSnackbarOpen(false);
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={(event, reason) => {
              if (reason === 'clickaway') return;
              setSnackbarOpen(false);
            }}
            severity={snackbarSeverity}
            sx={{
              width: '100%',
              bgcolor: darkMode ? '#1a1a1a' : 'background.paper',
              color: darkMode ? '#fff' : 'common.black',
              border: darkMode ? '1px solid rgba(255,255,255,0.12)' : undefined,
              '& .MuiAlert-icon': {
                color: darkMode ? 'primary.light' : 'primary.main'
              }
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
        
        <Dialog 
          open={dialogOpen} 
          onClose={handleDialogClose}
          PaperProps={{
            sx: {
              bgcolor: darkMode ? '#0f0f0f' : 'background.paper',
              color: darkMode ? '#fff' : 'text.primary',
              backgroundImage: 'none'
            }
          }}
        >
          <DialogTitle sx={{ color: darkMode ? '#fff' : 'inherit' }}>
            Contact Us
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: darkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>
              Fill out this form to get in touch with us.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Your Name"
              type="text"
              fullWidth
              variant="standard"
              sx={{
                '& .MuiInputBase-input': { color: darkMode ? '#fff' : 'inherit' },
                '& .MuiInputLabel-root': { color: darkMode ? 'rgba(255,255,255,0.7)' : 'inherit' },
                '& .MuiInput-underline:before': { borderBottomColor: darkMode ? 'rgba(255,255,255,0.42)' : 'inherit' },
                '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: darkMode ? 'rgba(255,255,255,0.87)' : 'inherit' }
              }}
            />
            <TextField
              margin="dense"
              id="email"
              label="Email Address"
              type="email"
              fullWidth
              variant="standard"
              sx={{
                '& .MuiInputBase-input': { color: darkMode ? '#fff' : 'inherit' },
                '& .MuiInputLabel-root': { color: darkMode ? 'rgba(255,255,255,0.7)' : 'inherit' },
                '& .MuiInput-underline:before': { borderBottomColor: darkMode ? 'rgba(255,255,255,0.42)' : 'inherit' },
                '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: darkMode ? 'rgba(255,255,255,0.87)' : 'inherit' }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleDialogClose}
              sx={{ color: darkMode ? '#90caf9' : 'primary.main' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              sx={{ color: darkMode ? '#90caf9' : 'primary.main' }}
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeContext.Provider>
  );
}