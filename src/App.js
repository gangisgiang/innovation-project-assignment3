import React, { useState, useContext } from 'react';
import {
  Typography, Container, Button, Box, TextField, CircularProgress, Chip
} from '@mui/material';
import Plot from 'react-plotly.js';

import { ThemeContext } from './background';

function App() {
  const [splitVisible, setSplitVisible] = useState(false);
  const [apiInput, setApiInput] = useState('');
  const [apiResult, setApiResult] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  const { darkMode, colors } = useContext(ThemeContext);

  const hamColor = 'rgb(75, 192, 75)';
  const spamColor = 'rgb(255, 99, 99)';

  

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
    <>
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
                sx={{ 
                  mt: 1,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                  },
                  '& .MuiOutlinedInput-input': {
                    color: darkMode ? 'white' : 'black',
                  },
                }}
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
                  {apiResult.ensemble && (
                    <Box sx={{ mt: 2, mb: 2 }}>
                      <Typography><strong>Model Scores:</strong></Typography>
                      <Plot
                        data={[
                          {
                            type: 'bar',
                            x: Object.keys(apiResult.ensemble),
                            y: Object.values(apiResult.ensemble).map(m => m.score),
                            marker: {
                              color: Object.values(apiResult.ensemble).map(m => 
                                m.label === 'ham' ? hamColor : spamColor
                              )
                            }
                          }
                        ]}
                        layout={{
                            width: 400,
                            height: 300,
                            title: {
                              text: 'Model Scores',
                              font: {
                                color: colors.textColor
                              }
                            },
                            paper_bgcolor: colors.paper_bgcolor,
                            font: { color: colors.textColor },
                            legend: { font: { color: colors.textColor } },
                            hoverlabel: { font: { color: colors.textColor }, bgcolor: colors.paper_bgcolor, bordercolor: colors.textColor },
                            yaxis: {
                              range: [0, 1],
                              dtick: 0.1,
                              title: {
                                text: 'Score',
                                font: {
                                  color: colors.textColor
                                }
                              },
                              tickfont: {
                                color: colors.textColor
                              },
                              gridcolor: colors.gridColor
                            },
                            xaxis: {
                              title: {
                                text: 'Model',
                                font: {
                                color: colors.textColor
                                }
                              },
                              tickfont: {
                                color: colors.textColor
                              }
                            },
                            margin: {
                              l: 50,
                              r: 50,
                              t: 50,
                              b: 50
                            }
                        }}
                        config={{
                          displayModeBar: false,
                          responsive: true
                        }}
                      />
                    </Box>
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
    </>
  );
}

export default App;
