import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Container, Grid, Card, CardContent, Button, Box,
  Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, TextField,
  Switch, Snackbar, Alert, Fab, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, CircularProgress, LinearProgress, Chip, Avatar, Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Info as InfoIcon,
  Mail as MailIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import Interface from './Interface';

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [splitVisible, setSplitVisible] = useState(false);
  const [apiInput, setApiInput] = useState('');
  const [apiResult, setApiResult] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      handleDialogClose();
      setSnackbarOpen(true);
    }, 2000);
  };

  const drawerContent = (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
      <List>
        {['Home', 'About', 'Contact'].map((text, index) => (
          <ListItem button key={text}>
            <ListItemIcon>
              {index === 0 ? <HomeIcon /> : index === 1 ? <InfoIcon /> : <MailIcon />}
            </ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem>
          <ListItemText primary="Dark Mode" />
          <Switch checked={darkMode} onChange={handleDarkModeToggle} />
        </ListItem>
      </List>
    </Box>
  );

  const MainHeadings = () => (
    <Container component="main" sx={{ mt: 0, mb: 2, p: 0 }}>
      <Typography variant="h2" component="h1" gutterBottom>
        Spam and Malware Detection System
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom>
        This application allows for the analysis of emails to detect potential spam and malware threats.
      </Typography>
    </Container>
  );

  return (
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

      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        {drawerContent}
      </Drawer>

      <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 0, mb: 2, px: 2 }}>
        <MainHeadings />
      </Box>

      <Box sx={{ px: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, width: '100%', minHeight: 240, bgcolor: darkMode ? 'grey.900' : 'background.default', color: darkMode ? 'common.white' : 'common.black', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ order: { xs: 2, md: 1 }, flex: 1, p: 2, width: { xs: '100%', md: 'auto' } }}>
            <Box sx={{ display: { xs: 'none', md: 'block' }, mt: 0, mb: 2, p: 0 }}>
              <MainHeadings />
            </Box>

            <Typography variant="body2" sx={{ mt: 1 }}>Enter the text of your email in the field below.</Typography>
            <TextField
              label="Email text"
              placeholder="Paste email body here"
              multiline
              minRows={4}
              fullWidth
              value={apiInput}
              onChange={(e) => setApiInput(e.target.value)}
              sx={{ mt: 1 }}
            />

            <Box sx={{ display: 'block', mt: 1 }}>
              <Button
                variant="contained"
                onClick={async () => {
                  setSplitVisible(true);
                  try {
                    setApiLoading(true);
                    setApiResult(null);
                    const resp = await fetch('http://localhost:8000/predict', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ text: apiInput }),
                    });
                    const data = await resp.json();
                    if (!resp.ok) throw new Error(data.detail || 'Prediction failed');
                    setApiResult(data);
                  } catch (err) {
                    setApiResult({ error: String(err) });
                  } finally {
                    setApiLoading(false);
                  }
                }}
                aria-controls="split-left-pane"
              >
                {splitVisible ? 'Predict' : 'Predict'}
              </Button>
            </Box>
            {apiResult && apiResult.error && (
              <Typography color="error" sx={{ mt: 1 }}>Error: {apiResult.error}</Typography>
            )}
          </Box>
          <Box
            sx={{
              order: { xs: 1, md: 0 },
              display: { xs: splitVisible ? 'block' : 'none', md: 'block' },
              width: { xs: '100%', md: '50%' },
              p: 2,
              borderRight: { md: '1px solid' },
              borderColor: 'divider'
            }}
            aria-hidden={!splitVisible && true}
            id="split-left-pane"
          >
            {apiLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <CircularProgress size={20} />
                <Typography sx={{ ml: 1 }}>Predicting...</Typography>
              </Box>
            ) : apiResult ? (
              apiResult.error ? (
                <Typography color="error" sx={{ mt: 1 }}>Error: {apiResult.error}</Typography>
              ) : (
                <Box sx={{ mt: 1 }}>
                  <Typography><strong>Classification:</strong> {apiResult.label}</Typography>
                  <Typography><strong>Confidence:</strong> {(apiResult.score * 100).toFixed(1)}%</Typography>
                  <Typography><strong>Action:</strong> {apiResult.action}</Typography>
                  {apiResult.reasons.length > 0 && (
                    <Typography><strong>Reasons:</strong> {apiResult.reasons.join(', ')}</Typography>
                  )}
                  {apiResult.explain && apiResult.explain.length > 0 && (
                    <>
                      <Typography><strong>Key Terms:</strong></Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {apiResult.explain.map((item, index) => (
                          <Chip 
                            key={index}
                            label={`${item.term} (${(item.weight * 100).toFixed(0)}%)`}
                            color={item.weight > 0.5 ? "error" : "default"}
                          />
                        ))}
                      </Box>
                    </>
                  )}
                </Box>
              )
            ) : (
              <Typography variant="body2" sx={{ mt: 1 }}>No prediction yet. Enter text on the right and press "Predict".</Typography>
            )}
          </Box>
        </Box>
      </Box>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {darkMode ? 'Dark mode enabled!' : 'Light mode enabled!'}
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
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App;
