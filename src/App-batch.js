import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Container, Grid, Card, CardContent, Button, Box,
  Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, TextField,
  Switch, Snackbar, Alert, Fab, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, CircularProgress, LinearProgress, Chip, Avatar, Divider, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Info as InfoIcon,
  Mail as MailIcon,
  Add as AddIcon,
  Assessment as AssessmentIcon,
  Send as SendIcon,
  BatchPrediction as BatchIcon
} from '@mui/icons-material';
import Interface from './Interface';

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [splitVisible, setSplitVisible] = useState(false);
  
  // Single prediction
  const [apiInput, setApiInput] = useState('');
  const [apiResult, setApiResult] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  
  // Batch prediction
  const [batchMode, setBatchMode] = useState(false);
  const [batchInput, setBatchInput] = useState('');
  const [batchAnalysis, setBatchAnalysis] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);

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

  const handleBatchAnalyze = async () => {
    setSplitVisible(true);
    setBatchLoading(true);
    setBatchAnalysis(null);
    
    try {
      // Split by "---" delimiter (three dashes)
      const messages = batchInput
        .split('---')
        .map(msg => msg.trim())
        .filter(msg => msg.length > 0);
      
      if (messages.length === 0) {
        setBatchAnalysis({ error: 'Please enter at least one message' });
        return;
      }
      
      const resp = await fetch('http://localhost:8000/predict-batch/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: messages }),
      });
      
      const data = await resp.json();
      
      if (!resp.ok) {
        throw new Error(data.detail || 'Analysis failed');
      }
      
      setBatchAnalysis(data);
    } catch (err) {
      setBatchAnalysis({ error: String(err) });
    } finally {
      setBatchLoading(false);
    }
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
        <ListItem>
          <ListItemText primary="Batch Mode" />
          <Switch 
            checked={batchMode} 
            onChange={() => {
              setBatchMode(!batchMode);
              setSplitVisible(false);
              setApiResult(null);
              setBatchAnalysis(null);
            }} 
          />
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
        {batchMode 
          ? 'Analyze multiple emails at once to detect spam and malware patterns.'
          : 'This application allows for the analysis of emails to detect potential spam and malware threats.'
        }
      </Typography>
    </Container>
  );

  const BatchAnalysisResults = () => {
    if (!batchAnalysis || batchAnalysis.error) return null;
    
    const { overview, score_distribution, model_agreement, actions, top_spam_indicators } = batchAnalysis;
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          <AssessmentIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Analysis Results
        </Typography>
        
        {/* Overview Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Total Messages</Typography>
                <Typography variant="h4">{overview.total_messages}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ bgcolor: 'error.light' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Spam Detected</Typography>
                <Typography variant="h4">{overview.spam_count}</Typography>
                <Typography variant="body2">
                  {((overview.spam_count / overview.total_messages) * 100).toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ bgcolor: 'success.light' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Legitimate</Typography>
                <Typography variant="h4">{overview.ham_count}</Typography>
                <Typography variant="body2">
                  {((overview.ham_count / overview.total_messages) * 100).toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Avg Score</Typography>
                <Typography variant="h4">{overview.avg_score.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Score Distribution */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Score Distribution</Typography>
          {Object.entries(score_distribution).map(([range, count]) => (
            <Box key={range} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">{range}</Typography>
                <Typography variant="body2">{count} messages</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(count / overview.total_messages) * 100}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
          ))}
        </Paper>

        {/* Model Agreement */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Model Agreement</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2">Agreement Rate</Typography>
              <Typography variant="h5">{model_agreement.agreement_rate}%</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="success.main">Agree: {model_agreement.agree}</Typography>
              <Typography variant="body2" color="warning.main">Disagree: {model_agreement.disagree}</Typography>
            </Box>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={model_agreement.agreement_rate}
            color={model_agreement.agreement_rate > 80 ? "success" : "warning"}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Paper>

        {/* Actions */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Recommended Actions</Typography>
          <Grid container spacing={2}>
            {Object.entries(actions).map(([action, count]) => (
              <Grid item xs={4} key={action}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color={
                    action === 'block' ? 'error.main' : 
                    action === 'quarantine' ? 'warning.main' : 
                    'success.main'
                  }>
                    {count}
                  </Typography>
                  <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                    {action}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Top Spam Indicators */}
        {top_spam_indicators && top_spam_indicators.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Top Spam Indicators</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {top_spam_indicators.slice(0, 10).map((indicator, idx) => (
                <Chip
                  key={idx}
                  label={`${indicator.term} (×${indicator.count})`}
                  color="error"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Paper>
        )}

        {batchAnalysis.indexed_details && batchAnalysis.indexed_details.length > 0 && (
          <Paper sx={{ p: 2, mt: 3 }}>
            <Typography variant="h6" gutterBottom>Detailed Results</Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Text (Preview)</TableCell>
                    <TableCell>Label</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batchAnalysis.indexed_details.map((item, idx) => (
                    <TableRow
                      key={idx}
                      sx={{
                        bgcolor:
                          item.label === 'spam'
                            ? 'error.light'
                            : item.label === 'ham'
                            ? 'success.light'
                            : 'inherit',
                      }}
                    >
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 250,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.text}
                      </TableCell>
                      <TableCell>{item.label}</TableCell>
                      <TableCell>{(item.score * 100).toFixed(1)}%</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{item.action}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>
    );
  };

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
          <Chip 
            label={batchMode ? "Batch Mode" : "Single Mode"}
            color={batchMode ? "secondary" : "primary"}
            size="small"
            sx={{ mr: 2 }}
          />
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
          
          {/* Input Section */}
          <Box sx={{ order: { xs: 2, md: 1 }, flex: 1, p: 2, width: { xs: '100%', md: 'auto' } }}>
            <Box sx={{ display: { xs: 'none', md: 'block' }, mt: 0, mb: 2, p: 0 }}>
              <MainHeadings />
            </Box>

            {batchMode ? (
              // BATCH MODE
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Separate multiple emails with <strong>---</strong> (three dashes on a new line)
                </Alert>
                
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Enter multiple emails below:
                </Typography>
                
                <TextField
                  label="Batch Email Input"
                  placeholder={`Email 1 text here...
---
Email 2 text here...
---
Email 3 text here...`}
                  multiline
                  minRows={8}
                  fullWidth
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  sx={{ mt: 1, fontFamily: 'monospace' }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    {batchInput.split('---').filter(m => m.trim()).length} messages ready
                  </Typography>
                </Box>

                <Box sx={{ display: 'block', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AssessmentIcon />}
                    onClick={handleBatchAnalyze}
                    disabled={batchLoading || !batchInput.trim()}
                  >
                    {batchLoading ? 'Analyzing...' : 'Analyze Batch'}
                  </Button>
                </Box>

                {batchAnalysis && batchAnalysis.error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {batchAnalysis.error}
                  </Alert>
                )}
              </>
            ) : (
              // SINGLE MODE
              <>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Enter the text of your email in the field below.
                </Typography>
                
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
                    startIcon={<SendIcon />}
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
                    disabled={apiLoading || !apiInput.trim()}
                  >
                    {apiLoading ? 'Predicting...' : 'Predict'}
                  </Button>
                </Box>
                
                {apiResult && apiResult.error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {apiResult.error}
                  </Alert>
                )}
              </>
            )}
          </Box>

          {/* Results Section */}
          <Box
            sx={{
              order: { xs: 1, md: 0 },
              display: { xs: splitVisible ? 'block' : 'none', md: 'block' },
              width: { xs: '100%', md: '50%' },
              p: 2,
              borderRight: { md: '1px solid' },
              borderColor: 'divider',
              maxHeight: { md: '80vh' },
              overflowY: 'auto'
            }}
          >
            {batchMode ? (
              // BATCH RESULTS
              batchLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
                  <CircularProgress size={40} />
                  <Typography sx={{ mt: 2 }}>Analyzing messages...</Typography>
                </Box>
              ) : batchAnalysis ? (
                batchAnalysis.error ? (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {batchAnalysis.error}
                  </Alert>
                ) : (
                  <BatchAnalysisResults />
                )
              ) : (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <AssessmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">
                    No analysis yet
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Enter multiple emails separated by "---" and click "Analyze Batch"
                  </Typography>
                </Box>
              )
            ) : (
              // SINGLE RESULTS
              apiLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <CircularProgress size={20} />
                  <Typography sx={{ ml: 1 }}>Predicting...</Typography>
                </Box>
              ) : apiResult ? (
                apiResult.error ? (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {apiResult.error}
                  </Alert>
                ) : (
                  <Box sx={{ mt: 1 }}>
                    <Paper sx={{ p: 2, mb: 2, bgcolor: apiResult.label === 'spam' ? 'error.light' : 'success.light' }}>
                      <Typography variant="h6" gutterBottom>
                        Classification: {apiResult.label.toUpperCase()}
                      </Typography>
                      <Typography variant="h4">
                        {(apiResult.score * 100).toFixed(1)}% confidence
                      </Typography>
                    </Paper>

                    <Typography><strong>Action:</strong> {apiResult.action}</Typography>
                    {apiResult.reasons.length > 0 && (
                      <Typography><strong>Reasons:</strong> {apiResult.reasons.join(', ')}</Typography>
                    )}
                    
                    {apiResult.explain && apiResult.explain.length > 0 && (
                      <>
                        <Typography sx={{ mt: 2 }}><strong>Key Terms:</strong></Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                          {apiResult.explain.map((item, index) => (
                            <Chip 
                              key={index}
                              label={`${item.term} (${(item.weight * 100).toFixed(0)}%)`}
                              color={item.weight > 0.5 ? "error" : "default"}
                              size="small"
                            />
                          ))}
                        </Box>
                      </>
                    )}
                  </Box>
                )
              ) : (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <MailIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">
                    No prediction yet
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Enter email text and press "Predict"
                  </Typography>
                </Box>
              )
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