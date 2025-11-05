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
      gridColor: darkMode ? 'rgba(255,255,255,0.08)' : theme.palette.divider
    }
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: darkMode ? 'grey.900' : 'background.default', color: darkMode ? 'common.white' : 'common.black' }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton edge="start" color="inherit" aria-label="menu" onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              COS30049 - Assignment 3
            </Typography>
            <Button color="inherit" onClick={handleDialogOpen}>Contact</Button>
          </Toolbar>
        </AppBar>
        {children}
        <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
          <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
            <List>
              {[
                { text: 'Home', path: '/', icon: <HomeIcon /> },
                { text: 'About', path: '/about', icon: <InfoIcon /> },
                { text: 'Contact', path: '#', icon: <MailIcon /> }
              ].map((item) => (
                <ListItem 
                  button 
                  key={item.text}
                  onClick={() => {
                    if (item.path !== '#') {
                      navigate(item.path);
                      toggleDrawer(false)();
                    } else {
                      handleDialogOpen();
                      toggleDrawer(false)();
                    }
                  }}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
            </List>
            <Divider />
            <List>
              <ListItem>
                <ListItemText primary="Dark Mode" />
                <Switch checked={darkMode} onChange={toggleDarkMode} />
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
              bgcolor: darkMode ? 'grey.900' : 'background.paper',
              color: darkMode ? 'common.white' : 'common.black',
              '& .MuiAlert-icon': {
                color: darkMode ? 'primary.light' : 'primary.main'
              }
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
        <Dialog open={dialogOpen} onClose={handleDialogClose}>
          <DialogTitle>Contact Us</DialogTitle>
          <DialogContent>
            <DialogContentText>
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
            />
            <TextField
              margin="dense"
              id="email"
              label="Email Address"
              type="email"
              fullWidth
              variant="standard"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button onClick={handleSubmit}>
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeContext.Provider>
  );
}
