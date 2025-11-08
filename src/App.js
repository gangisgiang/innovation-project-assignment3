import React, { useState, useContext } from 'react';
import {
  Typography, Container, Button, Box, TextField, CircularProgress, Chip, Switch, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, Grid, Card, CardContent, LinearProgress
} from '@mui/material';

import {
  Assessment as AssessmentIcon,
  Mail as MailIcon,
} from '@mui/icons-material';

import Plot from 'react-plotly.js';
import { ThemeContext } from './background';
import { PredictionContext } from './PredictionProvider';
import { ScoreDistributionBarChart, ScatterPlotChart, SpamHamPieChart } from './D3Charts';

// Colours for chart
const hamColor = 'rgba(76,175,80,0.8)'; // green
const spamColor = 'rgba(244,67,54,0.8)'; // red

function MainHeadings({ batchMode, colors }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h2" component="h1" gutterBottom sx={{ color: colors.textColor }}>
        Spam and Malware Detection System
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom sx={{ color: colors.textSecondary }}>
        {batchMode
          ? 'Analyze multiple emails at once to detect spam and malware patterns.'
          : 'This application allows for the analysis of emails to detect potential spam and malware threats.'}
      </Typography>
    </Box>
  );
}

function BasicSingleResults({ apiResult, darkMode, colors }) {
  if (!apiResult || apiResult.error) return null;
  
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ color: colors.textColor }}>
        Analysis Results
      </Typography>
      
      <Card sx={{ 
        mb: 3, 
        bgcolor: apiResult.label === 'spam' 
          ? (darkMode ? 'error.dark' : 'error.light')
          : (darkMode ? 'success.dark' : 'success.light'),
        border: 2,
        borderColor: apiResult.label === 'spam' ? 'error.main' : 'success.main'
      }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h4" sx={{ textTransform: 'capitalize', color: colors.textColor }}>
                {apiResult.label}
              </Typography>
              <Typography variant="h2" sx={{ my: 1, color: colors.textColor }}>
                {(apiResult.score * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body1" sx={{ color: colors.textSecondary }}>
                Confidence Score
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: darkMode ? 'grey.700' : 'background.paper' }}>
                <Typography variant="subtitle2" sx={{ color: colors.textSecondary }} gutterBottom>
                  Recommended Action
                </Typography>
                <Chip 
                  label={apiResult.action.toUpperCase()}
                  color={
                    apiResult.action === 'block' ? 'error' : 
                    apiResult.action === 'quarantine' ? 'warning' : 
                    'success'
                  }
                  sx={{ fontSize: '1rem', fontWeight: 'bold', px: 2, py: 2.5 }}
                />
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {apiResult.reasons && apiResult.reasons.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: darkMode ? 'grey.800' : 'background.paper' }}>
          <Typography variant="h6" gutterBottom sx={{ color: colors.textColor }}>Analysis Reasons</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {apiResult.reasons.map((reason, index) => (
              <Chip
                key={index}
                label={reason.replace(/_/g, ' ')}
                sx={{ textTransform: 'capitalize' }}
              />
            ))}
          </Box>
        </Paper>
      )}

      {apiResult.ensemble && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: darkMode ? 'grey.800' : 'background.paper' }}>
          <Typography variant="h6" gutterBottom sx={{ color: colors.textColor }}>Model Ensemble Analysis</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {Object.entries(apiResult.ensemble).map(([modelName, modelData]) => (
              <Grid item xs={12} md={6} key={modelName}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ color: colors.textSecondary }} gutterBottom>
                      {modelName.toUpperCase()}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h5" sx={{ textTransform: 'capitalize', color: colors.textColor }}>
                        {modelData.label}
                      </Typography>
                      <Chip 
                        label={`${(modelData.score * 100).toFixed(1)}%`}
                        size="small"
                        color={modelData.label === 'spam' ? 'error' : 'success'}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
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
                },
                text: Object.values(apiResult.ensemble).map(m => `${(m.score * 100).toFixed(1)}%`),
                textposition: 'outside',
              }
            ]}
            layout={{
              width: window.innerWidth < 768 ? 350 : 500,
              height: 300,
              title: {
                text: 'Model Score Comparison',
                font: { color: colors.textColor }
              },
              paper_bgcolor: colors.paper_bgcolor,
              plot_bgcolor: colors.plot_bgcolor,
              font: { color: colors.textColor },
              yaxis: {
                range: [0, 1],
                dtick: 0.1,
                title: {
                  text: 'Score',
                  font: { color: colors.textColor }
                },
                tickfont: { color: colors.textColor },
                gridcolor: colors.gridColor
              },
              xaxis: {
                title: {
                  text: 'Model',
                  font: { color: colors.textColor }
                },
                tickfont: { color: colors.textColor }
              },
              margin: { l: 50, r: 50, t: 50, b: 50 }
            }}
            config={{
              displayModeBar: false,
              responsive: true
            }}
          />
        </Paper>
      )}

      {apiResult.explain && apiResult.explain.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: darkMode ? 'grey.800' : 'background.paper' }}>
          <Typography variant="h6" gutterBottom sx={{ color: colors.textColor }}>Key Spam Indicators</Typography>
          <Typography variant="body2" sx={{ mb: 2, color: colors.textSecondary }}>
            Terms and features that influenced the classification
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {apiResult.explain
              .sort((a, b) => b.weight - a.weight)
              .map((item, index) => (
                <Chip
                  key={index}
                  label={`${item.term} (${(item.weight * 100).toFixed(0)}%)`}
                  color={item.weight > 0.5 ? 'error' : item.weight > 0.3 ? 'warning' : 'default'}
                  sx={{ fontWeight: item.weight > 0.5 ? 'bold' : 'normal' }}
                />
              ))}
          </Box>
        </Paper>
      )}

      {apiResult.anomaly && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: darkMode ? 'grey.800' : 'background.paper' }}>
          <Typography variant="h6" gutterBottom sx={{ color: colors.textColor }}>Anomaly Detection</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>Cluster</Typography>
              <Typography variant="h5" sx={{ color: colors.textColor }}>{apiResult.anomaly.cluster}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>Out-of-Distribution Score</Typography>
              <Typography variant="h5" sx={{ color: colors.textColor }}>{apiResult.anomaly.ood_score.toFixed(3)}</Typography>
              <LinearProgress 
                variant="determinate" 
                value={apiResult.anomaly.ood_score * 100}
                color={apiResult.anomaly.ood_score > 0.7 ? 'error' : 'warning'}
                sx={{ height: 6, borderRadius: 1, mt: 1 }}
              />
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}

function BasicBatchResults({ batchAnalysis, darkMode, colors }) {
  if (!batchAnalysis || !batchAnalysis.results) return null;
  
  const results = batchAnalysis.results;
  const spamCount = results.filter(r => r.label === 'spam').length;
  const hamCount = results.filter(r => r.label === 'ham').length;
  
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ color: colors.textColor }}>
        Batch Results ({results.length} emails)
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Card sx={{ 
            bgcolor: darkMode ? 'grey.800' : 'background.paper'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography sx={{ color: colors.textSecondary }} variant="caption">Total</Typography>
              <Typography variant="h5" sx={{ color: colors.textColor }}>{results.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ 
            bgcolor: darkMode ? 'error.dark' : 'error.light',
            color: darkMode ? 'error.contrastText' : 'inherit'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography sx={{ color: colors.textSecondary }} variant="caption">Spam</Typography>
              <Typography variant="h5" sx={{ color: colors.textColor }}>{spamCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ 
            bgcolor: darkMode ? 'success.dark' : 'success.light',
            color: darkMode ? 'success.contrastText' : 'inherit'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography sx={{ color: colors.textSecondary }} variant="caption">Ham</Typography>
              <Typography variant="h5" sx={{ color: colors.textColor }}>{hamCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 2, bgcolor: darkMode ? 'grey.800' : 'background.paper' }}>
        <Typography variant="h6" gutterBottom sx={{ color: colors.textColor }}>Batch Prediction Distribution</Typography>
        <Plot
          data={[{
            type: 'bar',
            x: ['Spam', 'Ham'],
            y: [spamCount, hamCount],
            marker: {
              color: [spamColor, hamColor]
            },
            text: [spamCount, hamCount],
            textposition: 'auto',
          }]}
          layout={{
            width: window.innerWidth < 768 ? 350 : 500,
            height: 300,
            title: {
              text: 'Batch Prediction Distribution',
              font: { color: colors.textColor }
            },
            paper_bgcolor: colors.paper_bgcolor,
            plot_bgcolor: colors.plot_bgcolor,
            font: { color: colors.textColor },
            yaxis: {
              title: {
                text: 'Count',
                font: { color: colors.textColor }
              },
              tickfont: { color: colors.textColor },
              gridcolor: colors.gridColor
            },
            xaxis: {
              title: {
                text: 'Label',
                font: { color: colors.textColor }
              },
              tickfont: { color: colors.textColor }
            },
            margin: { l: 50, r: 50, t: 50, b: 50 }
          }}
          config={{
            displayModeBar: false,
            responsive: true
          }}
        />
      </Paper>

      <Paper sx={{ p: 2, bgcolor: darkMode ? 'grey.800' : 'background.paper' }}>
        <Typography variant="h6" gutterBottom sx={{ color: colors.textColor }}>Individual Results</Typography>
        {results.map((result, idx) => (
          <Card 
            key={idx} 
            sx={{ 
              mb: 2, 
              bgcolor: darkMode ? 'grey.900' : 'grey.50',
              borderLeft: 4,
              borderColor: result.label === 'spam' ? 'error.main' : 'success.main'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: colors.textColor }}>
                  Email #{idx + 1}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip 
                    label={result.label.toUpperCase()}
                    color={result.label === 'spam' ? 'error' : 'success'}
                    size="small"
                  />
                  <Chip 
                    label={`${(result.score * 100).toFixed(1)}%`}
                    variant="outlined"
                    size="small"
                    sx={{
                      bgcolor: darkMode ? 'grey.700' : 'background.paper',
                      color: colors.textColor,
                      borderColor: colors.borderColor
                    }}
                  />
                </Box>
              </Box>
              
              <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 1 }}>
                <strong>Action:</strong> <Chip 
                  label={result.action} 
                  size="small" 
                  sx={{ 
                    textTransform: 'capitalize',
                    bgcolor: darkMode ? 'grey.700' : 'background.paper',
                    color: colors.textColor,
                    borderColor: colors.borderColor,
                    border: 1
                  }} 
                />
              </Typography>
              
              {result.reasons && result.reasons.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: colors.textSecondary }}>Reasons:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {result.reasons.map((reason, ridx) => (
                      <Chip
                        key={ridx}
                        label={reason.replace(/_/g, ' ')}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          fontSize: '0.7rem', 
                          height: 20,
                          bgcolor: darkMode ? 'grey.700' : 'background.paper',
                          color: colors.textColor,
                          borderColor: colors.borderColor
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Paper>
    </Box>
  );
}

function BatchAnalysisResults({ batchAnalysis, darkMode, colors }) {
  if (!batchAnalysis || !batchAnalysis.overview) return null;
  
  const { overview, score_distribution, model_agreement, actions, top_spam_indicators, indexed_details } = batchAnalysis;
  
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ color: colors.textColor }}>
        Analysis Results
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ 
            bgcolor: darkMode ? 'grey.800' : 'background.paper'
          }}>
            <CardContent>
              <Typography sx={{ color: colors.textSecondary }} gutterBottom>Total Messages</Typography>
              <Typography variant="h4" sx={{ color: colors.textColor }}>{overview.total_messages}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ 
            bgcolor: darkMode ? 'error.dark' : 'error.light',
            color: darkMode ? 'error.contrastText' : 'inherit'
          }}>
            <CardContent>
              <Typography sx={{ color: colors.textSecondary }} gutterBottom>Spam Detected</Typography>
              <Typography variant="h4" sx={{ color: colors.textColor }}>{overview.spam_count}</Typography>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                {((overview.spam_count / overview.total_messages) * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ 
            bgcolor: darkMode ? 'success.dark' : 'success.light',
            color: darkMode ? 'success.contrastText' : 'inherit'
          }}>
            <CardContent>
              <Typography sx={{ color: colors.textSecondary }} gutterBottom>Legitimate</Typography>
              <Typography variant="h4" sx={{ color: colors.textColor }}>{overview.ham_count}</Typography>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                {((overview.ham_count / overview.total_messages) * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ 
            bgcolor: darkMode ? 'grey.800' : 'background.paper'
          }}>
            <CardContent>
              <Typography sx={{ color: colors.textSecondary }} gutterBottom>Avg Score</Typography>
              <Typography variant="h4" sx={{ color: colors.textColor }}>{overview.avg_score.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bar Chart - Score Distribution */}
      {score_distribution && (
        <Box sx={{ mb: 3 }}>
          <ScoreDistributionBarChart 
            distributionData={score_distribution}
            darkMode={darkMode}
          />
        </Box>
      )}

      {/* Scatter Plot - Shows both distribution AND progression */}
      {indexed_details && (
        <Box sx={{ mb: 3 }}>
          <ScatterPlotChart 
            data={indexed_details}
            darkMode={darkMode}
          />
        </Box>
      )}

      {/* Spam vs Ham Pie Chart */}
      {overview && (
        <Box sx={{ mb: 3 }}>
          <SpamHamPieChart overview={overview} darkMode={darkMode} />
        </Box>
      )}

      <Paper sx={{ p: 2, mb: 2, bgcolor: darkMode ? 'grey.800' : 'background.paper' }}>
        <Typography variant="h6" gutterBottom sx={{ color: colors.textColor }}>Model Agreement</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>Agreement Rate</Typography>
            <Typography variant="h5" sx={{ color: colors.textColor }}>{model_agreement.agreement_rate}%</Typography>
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

      <Paper sx={{ p: 2, mb: 2, bgcolor: darkMode ? 'grey.800' : 'background.paper' }}>
        <Typography variant="h6" gutterBottom sx={{ color: colors.textColor }}>Recommended Actions</Typography>
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
                <Typography variant="caption" sx={{ textTransform: 'capitalize', color: colors.textSecondary }}>
                  {action}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {top_spam_indicators && top_spam_indicators.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: darkMode ? 'grey.800' : 'background.paper' }}>
          <Typography variant="h6" gutterBottom sx={{ color: colors.textColor }}>Top Spam Indicators</Typography>
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

      {indexed_details && indexed_details.length > 0 && (
        <Paper sx={{ p: 2, mt: 3, bgcolor: darkMode ? 'grey.800' : 'background.paper' }}>
          <Typography variant="h6" gutterBottom sx={{ color: colors.textColor }}>Detailed Results</Typography>
          <TableContainer component={Paper} sx={{ bgcolor: darkMode ? 'grey.900' : 'background.default' }}>
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
                {indexed_details.map((item, idx) => (
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
}

function App() {
  const [splitVisible, setSplitVisible] = useState(false);
  const [apiInput, setApiInput] = useState('');
  const [apiResult, setApiResult] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchAnalyzeMode, setBatchAnalyzeMode] = useState(false); // false = basic (default), true = analyze
  const [batchInput, setBatchInput] = useState('');
  const [batchAnalysis, setBatchAnalysis] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const { darkMode, colors } = useContext(ThemeContext);
  const { addPrediction } = useContext(PredictionContext);

  const constructPrediction = (predictionData) => {
    const modelScores = {};
    let totalScore = 0;
    let modelCount = 0;

    if (predictionData.ensemble) {
      Object.entries(predictionData.ensemble).forEach(([modelName, modelData]) => {
        modelScores[modelName] = {
          score: modelData.score,
          label: modelData.label
        };
        totalScore += modelData.score;
        modelCount++;
      });
    }

    const averageScore = modelCount > 0 ? totalScore / modelCount : predictionData.score || 0;

    return {
      timestamp: new Date().toISOString(),
      label: predictionData.label,
      averageScore: averageScore,
      text: predictionData.text || '',
      reasons: Array.isArray(predictionData.reasons) ? predictionData.reasons : [],
      explain: Array.isArray(predictionData.explain) ? predictionData.explain : [],
      ...modelScores
    };
  };

  const handleBatchAnalyze = async () => {
    setBatchLoading(true);
    setBatchAnalysis(null);
    try {
        const emailTexts = batchInput.split('///').map(m => m.trim()).filter(m => m);
      const endpoint = batchAnalyzeMode 
        ? 'http://localhost:8000/predict-batch/analyze'
        : 'http://localhost:8000/predict-batch';
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: emailTexts }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || 'Batch prediction failed');
      setBatchAnalysis(batchAnalyzeMode ? data : { results: data });
      
      if (!data.error) {
        const results = batchAnalyzeMode ? data.indexed_details || [] : data;
        if (Array.isArray(results)) {
          results.forEach((result, idx) => {
            const prediction = constructPrediction({
              label: result.label,
              score: result.score,
              ensemble: result.ensemble || null,
              text: result.text || emailTexts[idx] || '',
              reasons: Array.isArray(result.reasons) ? result.reasons : [],
              explain: Array.isArray(result.explain) ? result.explain : [],
            });
            addPrediction(prediction);
          });
        }
      }
    } catch (err) {
      setBatchAnalysis({ error: String(err) });
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <>
      <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 0, mb: 2, px: 2 }}>
        <MainHeadings colors={colors} />
      </Box>
      <Box sx={{ px: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, width: '100%', minHeight: 240, bgcolor: darkMode ? 'grey.900' : 'background.default', color: darkMode ? 'common.white' : 'common.black', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ order: { xs: 2, md: 1 }, flex: 1, p: 2, width: { xs: '100%', md: 'auto' } }}>
            <Box sx={{ display: { xs: 'none', md: 'block' }, mt: 0, mb: 2, p: 0 }}>
              <MainHeadings colors={colors} />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Switch
                checked={batchMode}
                onChange={() => {
                  setBatchMode(!batchMode);
                  setSplitVisible(false);
                  setApiResult(null);
                  setBatchAnalysis(null);
                }}
                color="secondary"
              />
              <Typography variant="body2" sx={{ display: 'inline', ml: 1, color: colors.textColor }}>
                {batchMode ? 'Batch Mode' : 'Single Mode'}
              </Typography>
            </Box>
            {batchMode ? (
              <>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Switch
                    checked={batchAnalyzeMode}
                    onChange={() => setBatchAnalyzeMode(!batchAnalyzeMode)}
                    color="secondary"
                  />
                  <Typography variant="body2" sx={{ color: colors.textColor }}>
                    {batchAnalyzeMode ? 'Analysis Mode' : 'Basic Mode'}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 1, color: colors.textColor }}>
                  Enter multiple emails below:
                </Typography>
                <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
                  Separate multiple emails with <strong>///</strong> (three slashes on a new line)
                </Alert>
                <TextField
                  label="Batch Email Input"
                  placeholder={`Email 1 text here...\n///\nEmail 2 text here...\n///\nEmail 3 text here...`}
                  multiline
                  minRows={8}
                  fullWidth
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  sx={{ 
                    mt: 1, 
                    fontFamily: 'monospace',
                    '& .MuiInputBase-input': {
                      color: colors.textColor,
                    },
                    '& .MuiInputLabel-root': {
                      color: colors.textSecondary,
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: colors.borderColor,
                      },
                      '&:hover fieldset': {
                        borderColor: colors.borderHover,
                      },
                    },
                  }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                    {batchInput.split('///').filter(m => m.trim()).length} messages ready
                  </Typography>
                </Box>
                <Box sx={{ display: 'block', mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleBatchAnalyze}
                    disabled={batchLoading || !batchInput.trim()}
                  >
                    {batchLoading ? 'Analyzing...' : 'Predict'}
                  </Button>
                </Box>
                {batchAnalysis && batchAnalysis.error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {batchAnalysis.error}
                  </Alert>
                )}
              </>
            ) : (
              <>
                <Typography variant="body2" sx={{ mt: 1, color: colors.textColor }}>Enter the text of your email in the field below.</Typography>
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
                    '& .MuiInputBase-input': {
                      color: colors.textColor,
                    },
                    '& .MuiInputLabel-root': {
                      color: colors.textSecondary,
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: colors.borderColor,
                      },
                      '&:hover fieldset': {
                        borderColor: colors.borderHover,
                      },
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
                        if (!data.error) {
                          const prediction = constructPrediction({ ...data, text: apiInput });
                          addPrediction(prediction);
                        }
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
              </>
            )}
          </Box>
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
            aria-hidden={!splitVisible && true}
            id="split-left-pane"
          >
            {batchMode ? (
              batchLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
                  <CircularProgress size={40} />
                  <Typography sx={{ mt: 2, color: colors.textColor }}>Analyzing messages...</Typography>
                </Box>
              ) : batchAnalysis ? (
                batchAnalysis.error ? (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {batchAnalysis.error}
                  </Alert>
                ) : batchAnalyzeMode ? (
                  <BatchAnalysisResults batchAnalysis={batchAnalysis} darkMode={darkMode} colors={colors} />
                ) : (
                  <BasicBatchResults batchAnalysis={batchAnalysis} darkMode={darkMode} colors={colors} />
                )
              ) : (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <AssessmentIcon sx={{ fontSize: 60, color: colors.textDisabled, mb: 2 }} />
                  <Typography variant="h6" sx={{ color: colors.textSecondary }}>
                    No {batchAnalyzeMode ? 'analysis' : 'results'} yet
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: colors.textDisabled }}>
                    {batchAnalyzeMode 
                      ? 'Enter multiple emails separated by "///" and click "Predict" for detailed analysis'
                      : 'Enter multiple emails separated by "///" and click "Predict" for basic results'
                    }
                  </Typography>
                </Box>
              )
            ) : (
              apiLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
                  <CircularProgress size={40} />
                  <Typography sx={{ mt: 2, color: colors.textColor }}>Analyzing email...</Typography>
                </Box>
              ) : apiResult ? (
                apiResult.error ? (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {apiResult.error}
                  </Alert>
                ) : (
                  <BasicSingleResults apiResult={apiResult} darkMode={darkMode} colors={colors} />
                )
              ) : (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <MailIcon sx={{ fontSize: 60, color: colors.textDisabled, mb: 2 }} />
                  <Typography variant="h6" sx={{ color: colors.textSecondary }}>
                    No results yet
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: colors.textDisabled }}>
                    Enter email text and click "Predict"
                  </Typography>
                </Box>
              )
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default App;