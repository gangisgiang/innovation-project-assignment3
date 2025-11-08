import React, { useState } from 'react';
import {
  Typography,
  Container,
  Box,
  List,
  ListItem,
  ListItemText,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';

// Reusable section card with glassmorphism + bottom glow
function SectionCard({ children, sx }) {
  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        borderRadius: 4,
        p: { xs: 3, md: 5 },
        mx: 'auto',
        maxWidth: 1100,
        backdropFilter: 'blur(6px)',
        background: 'rgba(255,255,255,0.55)', // subtle glass look
        border: '1px solid rgba(255,255,255,0.45)',
        boxShadow: '0 8px 28px rgba(0,0,0,0.08)',

        // bottom glow strip
        '::after': {
          content: '""',
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: -8,
          height: 12,
          borderRadius: 20,
          filter: 'blur(10px)',
          background:
            'linear-gradient(90deg, rgba(33,150,243,0.18), rgba(156,39,176,0.18))',
          zIndex: -1,
        },
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

function About() {
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoadInfo = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch('http://localhost:8000/model/info');
      if (!resp.ok) throw new Error(`Failed: ${resp.status}`);
      const data = await resp.json();
      setModelInfo(data);
    } catch (err) {
      setError(
        'Could not load model info. Please ensure /model/info is implemented and the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ label, value }) => (
    <Grid item xs={6} sm={4} md={2.4}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          textAlign: 'center',
          minHeight: 90,
          borderRadius: 3,
          background: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(0,0,0,0.07)',
        }}
      >
        <Typography variant="subtitle2">{label}</Typography>
        <Typography variant="h6" fontWeight="bold">
          {value != null ? `${(value * 100).toFixed(2)}%` : 'N/A'}
        </Typography>
      </Paper>
    </Grid>
  );

  return (
    <Container component="main" sx={{ mt: 6, mb: 10 }}>
      {/* ====== SECTION 1 — INTRO + 2 COLUMNS (big container with glow) ====== */}
      <SectionCard sx={{ mb: 6 }}>
        <Box sx={{ maxWidth: 900, mx: 'auto', textAlign: 'center' }}>
          <Typography variant="h2" component="h1" gutterBottom>
            About This Project
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ color: 'text.secondary', mb: 3 }}>
            Intelligent Email Spam &amp; Malware Detection
          </Typography>

          <Typography variant="body1" paragraph>
            <strong>SPECTER</strong> is a smart detection platform built to analyze and classify
            incoming emails using machine learning. It helps users and organizations identify
            potential spam or malware threats in real time, turning raw text into actionable
            insight.
          </Typography>

          <Typography variant="body1" paragraph sx={{ mb: 4 }}>
            By combining multiple ML models with explainable AI, SPECTER goes beyond a simple
            “spam/not spam” label. It reveals why an email was flagged, providing transparency and
            trust in every prediction.
          </Typography>
        </Box>

        {/* two equal columns, centered text, with wider middle gap */}
        <Grid
          container
          spacing={4}
          sx={{
            maxWidth: 1000,
            mx: 'auto',
            alignItems: 'stretch',
            justifyContent: 'center',
            columnGap: { md: 8 }, // extra space between two columns
          }}
        >
          {/* LEFT column */}
          <Grid item xs={12} md={5.5}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 3 },
                textAlign: 'center',
                borderRadius: 3,
                background: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(0,0,0,0.07)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Core Features
              </Typography>
              <List dense sx={{ m: 0, p: 0 }}>
                {[
                  'Real-time text-based email scanning',
                  'Ensemble prediction (Random Forest + XGBoost)',
                  'Confidence scores & interactive dashboards',
                  'Explainable AI: term & feature attribution',
                  'Single & batch analysis modes',
                ].map((t, i) => (
                  <ListItem key={i} sx={{ justifyContent: 'center' }}>
                    <ListItemText
                      primaryTypographyProps={{ align: 'center' }}
                      primary={t}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* RIGHT column */}
          <Grid item xs={12} md={5.5}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 3 },
                textAlign: 'center',
                borderRadius: 3,
                background: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(0,0,0,0.07)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Technology Stack
              </Typography>
              <List dense sx={{ m: 0, p: 0 }}>
                {[
                  'Frontend: React + Material UI',
                  'Backend: FastAPI (Python)',
                  'ML: Scikit-learn, XGBoost, RandomForest',
                  'Viz: Plotly.js, Chart.js, D3.js',
                ].map((t, i) => (
                  <ListItem key={i} sx={{ justifyContent: 'center' }}>
                    <ListItemText
                      primaryTypographyProps={{ align: 'center' }}
                      primary={t}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
          Built for COS30049 – Computing Technology Innovation Project
        </Typography>
      </SectionCard>

      {/* ====== SECTION 2 — MODEL INFORMATION (big container with glow) ====== */}
      <SectionCard>
        <Box sx={{ maxWidth: 1000, mx: 'auto', textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Model Information
          </Typography>

          <Button
            variant="contained"
            onClick={handleLoadInfo}
            disabled={loading}
            sx={{ mt: 1, mb: 3 }}
          >
            {loading ? 'Loading...' : 'Load Model Info'}
          </Button>

          {error && (
            <Alert severity="warning" sx={{ maxWidth: 800, mx: 'auto', mb: 2 }}>
              {error}
            </Alert>
          )}
          {loading && (
            <Box sx={{ my: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {modelInfo && (
            <Box sx={{ mt: 1 }}>
              {/* Top summary bar */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, md: 3 },
                  mb: 3,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.75)',
                  border: '1px solid rgba(0,0,0,0.07)',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  {modelInfo.model_name}
                </Typography>
                {modelInfo.tagline && (
                  <Typography variant="body1" color="text.secondary">
                    {modelInfo.tagline}
                  </Typography>
                )}
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2} justifyContent="center">
                  <Grid item xs={6} sm={4} md={3}>
                    <Typography variant="caption" color="text.secondary">
                      TF-IDF Vocabulary
                    </Typography>
                    <Typography variant="body1">
                      {modelInfo.tfidf_vocab_size ?? 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <Typography variant="caption" color="text.secondary">
                      RF Engineered Features
                    </Typography>
                    <Typography variant="body1">
                      {modelInfo.rf_engineered_features ?? 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <Typography variant="caption" color="text.secondary">
                      XGB Feature Count
                    </Typography>
                    <Typography variant="body1">
                      {modelInfo.xgb_feature_count ?? 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Metrics: XGB */}
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                XGBoost — Performance
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <MetricCard label="Accuracy" value={modelInfo.xgb_accuracy} />
                <MetricCard label="Precision" value={modelInfo.xgb_precision} />
                <MetricCard label="Recall" value={modelInfo.xgb_recall} />
                <MetricCard label="F1" value={modelInfo.xgb_f1} />
                <MetricCard label="AUC" value={modelInfo.xgb_auc} />
              </Grid>

              {/* Metrics: RF */}
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Random Forest — Performance
              </Typography>
              <Grid container spacing={2}>
                <MetricCard label="Accuracy" value={modelInfo.rf_accuracy} />
                <MetricCard label="Precision" value={modelInfo.rf_precision} />
                <MetricCard label="Recall" value={modelInfo.rf_recall} />
                <MetricCard label="F1" value={modelInfo.rf_f1} />
                <MetricCard label="AUC" value={modelInfo.rf_auc} />
              </Grid>

              {/* Raw JSON (title centered) */}
              <Accordion sx={{ mt: 3 }}>
                <AccordionSummary
                  sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    '& .MuiTypography-root': { textAlign: 'center', width: '100%' },
                  }}
                >
                  <Typography variant="subtitle1">View raw JSON</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ textAlign: 'left' }}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, bgcolor: 'background.default' }}
                  >
                    <pre
                      style={{
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {JSON.stringify(modelInfo, null, 2)}
                    </pre>
                  </Paper>
                </AccordionDetails>
              </Accordion>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
                © 2025 SPECTER — A student-built AI security project.
              </Typography>
            </Box>
          )}
        </Box>
      </SectionCard>
    </Container>
  );
}

export default About;