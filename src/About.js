// src/About.js
import React, { useEffect, useState, useContext } from 'react';
import {
  Typography,
  Container,
  Box,
  Button,
  Paper,
  Grid,
  Alert,
  Skeleton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  useTheme,
  GlobalStyles,
} from '@mui/material';
import { ThemeContext } from './background';

function About() {
  const theme = useTheme();
  const { darkMode } = useContext(ThemeContext);
  const isDarkish = darkMode;

  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleLoadInfo = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch('http://localhost:8000/model/info');
      if (!resp.ok) throw new Error(`Failed: ${resp.status}`);
      const data = await resp.json();
      setModelInfo(data);
    } catch (err) {
      console.error(err);
      setError(
        'Could not load model info. Please ensure /model/info is implemented and backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  const pct = (v) =>
    typeof v === 'number' && isFinite(v) ? `${(v * 100).toFixed(2)}%` : 'N/A';

  const Muted = (alpha = 0.72) => `rgba(255,255,255,${alpha})`;

  const forceDark = isDarkish
    ? {
        isolation: 'isolate',
        bgcolor: '#0B0B0B !important',
        color: '#FFFFFF !important',
        backgroundImage: 'none !important',
        backdropFilter: 'none !important',
        WebkitBackdropFilter: 'none !important',
        border: '1px solid rgba(255,255,255,0.12) !important',
        '& *': { color: '#FFFFFF !important' },
        '& .MuiTypography-body2': { color: `${Muted(0.72)} !important` },
      }
    : {};

  const forceDarkCard = isDarkish
    ? {
        bgcolor: '#141414 !important',
        color: '#FFFFFF !important',
        border: '1px solid rgba(255,255,255,0.12) !important',
      }
    : {};

  const MetricCard = ({ label, value }) => (
    <Grid item xs={6} sm={4} md={2.4}>
      <Paper
        elevation={0}
        sx={{
          p: 2.25,
          textAlign: 'center',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: 'rgba(255,255,255,0.9)',
          transition: 'transform 0.22s ease, box-shadow 0.22s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: isDarkish
              ? '0 12px 28px rgba(0,0,0,0.55)'
              : '0 12px 28px rgba(0,0,0,0.12)',
          },
          ...forceDarkCard,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ color: isDarkish ? `${Muted(0.72)} !important` : 'text.secondary' }}
        >
          {label}
        </Typography>
        <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
          {pct(value)}
        </Typography>
      </Paper>
    </Grid>
  );

  const StatItem = ({ label, value }) => (
    <Grid item xs={12} sm={4}>
      <Typography
        variant="caption"
        sx={{ color: isDarkish ? `${Muted(0.72)} !important` : 'text.secondary' }}
      >
        {label}
      </Typography>
      <Typography
        variant="body1"
        sx={{ fontWeight: 600, color: isDarkish ? '#FFFFFF !important' : 'inherit' }}
      >
        {value ?? 'N/A'}
      </Typography>
    </Grid>
  );

  return (
    <>
      {/* toàn trang nền đen khi dark */}
      <GlobalStyles
        styles={{
          body: {
            backgroundColor: isDarkish ? '#000 !important' : undefined,
            transition: 'background-color 0.3s ease',
          },
          '#root': {
            backgroundColor: isDarkish ? '#000 !important' : undefined,
          },
          '.MuiContainer-root': {
            backgroundColor: isDarkish ? '#000 !important' : undefined,
          },
        }}
      />

      <Box sx={{ bgcolor: isDarkish ? '#000' : 'transparent', py: { xs: 4, md: 6 } }}>
        <Container 
          component="main" 
          maxWidth="lg" 
          sx={{ 
            py: 0,
            bgcolor: isDarkish ? '#000 !important' : 'transparent',
            color: isDarkish ? '#fff !important' : 'inherit',
          }}
        >
          {/* ================== INTRO ================== */}
          <Paper
            elevation={0}
            sx={{
              px: { xs: 3, md: 6 },
              py: { xs: 3, md: 5 },
              borderRadius: 3,
              textAlign: 'center',
              mx: 'auto',
              position: 'relative',
              transform: mounted ? 'none' : 'translateY(14px)',
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.42s ease, transform 0.42s ease',
              bgcolor: 'rgba(255,255,255,0.85)',
              border: `1px solid ${theme.palette.divider}`,
              ...forceDark,
              '&::after': {
                content: '""',
                position: 'absolute',
                left: '12%',
                right: '12%',
                bottom: -14,
                height: 26,
                borderRadius: '50%',
                filter: 'blur(16px)',
                background: isDarkish
                  ? 'radial-gradient(60% 60% at 50% 50%, rgba(255,255,255,0.16), rgba(0,0,0,0) 70%)'
                  : 'radial-gradient(60% 60% at 50% 50%, rgba(180,180,255,0.28), rgba(255,255,255,0) 70%)',
                pointerEvents: 'none',
              },
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              About This Project
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: isDarkish ? `${Muted(0.72)} !important` : 'text.secondary',
                mt: 1.5,
              }}
            >
              Intelligent Email Spam & Malware Detection
            </Typography>

            <Box sx={{ maxWidth: 900, mx: 'auto' }}>
              <Typography variant="body1" sx={{ mt: 2 }}>
                <strong>SPECTER</strong> is a smart detection platform built to
                analyze and classify incoming emails using machine learning. It
                helps users and organizations identify potential spam or malware
                threats in real time, turning raw text into actionable insight.
              </Typography>

              <Typography variant="body1" sx={{ mt: 1.5 }}>
                By combining multiple ML models with explainable AI, SPECTER goes
                beyond a simple "spam / not spam". It reveals <em>why</em> an email
                was flagged, providing transparency and trust in every prediction.
              </Typography>
            </Box>

            {/* ======= TWO-COLUMN ======= */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Grid
                container
                justifyContent="center"
                sx={{ maxWidth: 880, mx: 'auto', columnGap: { xs: 0, md: 8 }, rowGap: 4 }}
              >
                {/* LEFT COLUMN */}
                <Grid item xs={12} md={5.5}>
                  {/* >>> BLACK PANEL WRAPPER */}
                  <Box
                    sx={{
                      // sơn nền đen trong dark mode, chặn mọi override
                      ...(isDarkish
                        ? {
                            backgroundColor: '#0B0B0B !important',
                            border: '1px solid rgba(255,255,255,0.12) !important',
                            borderRadius: 2,
                            boxShadow: '0 12px 28px rgba(0,0,0,0.45)',
                            '& *': { color: '#FFFFFF !important' },
                          }
                        : {}),
                      p: 2.5,
                      textAlign: 'center',
                      transition: 'transform 0.24s ease',
                      '&:hover': { transform: 'translateY(-2px)' },
                    }}
                  >
                    <Stack
                      spacing={1.3}
                      sx={{
                        width: '100%',
                        maxWidth: 400,
                        minHeight: { xs: 280, md: 320 },
                        justifyContent: 'space-evenly',
                        mx: 'auto',
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Core Features
                      </Typography>
                      {[
                        'Real-time text-based email scanning',
                        'Ensemble prediction (Random Forest + XGBoost)',
                        'Confidence scores & interactive dashboards',
                        'Explainable AI: term & feature attribution',
                        'Single & batch analysis modes',
                      ].map((t, i) => (
                        <Typography key={i} variant="body1">
                          {t}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                  {/* <<< END BLACK PANEL WRAPPER */}
                </Grid>

                {/* RIGHT COLUMN */}
                <Grid item xs={12} md={5.5}>
                  {/* >>> BLACK PANEL WRAPPER */}
                  <Box
                    sx={{
                      ...(isDarkish
                        ? {
                            backgroundColor: '#0B0B0B !important',
                            border: '1px solid rgba(255,255,255,0.12) !important',
                            borderRadius: 2,
                            boxShadow: '0 12px 28px rgba(0,0,0,0.45)',
                            '& *': { color: '#FFFFFF !important' },
                          }
                        : {}),
                      p: 2.5,
                      textAlign: 'center',
                      transition: 'transform 0.24s ease',
                      '&:hover': { transform: 'translateY(-2px)' },
                    }}
                  >
                    <Stack
                      spacing={1.3}
                      sx={{
                        width: '100%',
                        maxWidth: 400,
                        minHeight: { xs: 280, md: 320 },
                        justifyContent: 'space-evenly',
                        mx: 'auto',
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Technology Stack
                      </Typography>
                      {[
                        'Frontend: React + Material UI',
                        'Backend: FastAPI (Python)',
                        'ML: Scikit-learn, XGBoost, RandomForest',
                        'Viz: Plotly.js, Chart.js, D3.js',
                      ].map((t, i) => (
                        <Typography key={i} variant="body1">
                          {t}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                  {/* <<< END BLACK PANEL WRAPPER */}
                </Grid>
              </Grid>
            </Box>


            <Typography
              variant="body2"
              sx={{
                mt: 2,
                color: isDarkish ? `${Muted(0.72)} !important` : 'text.secondary',
              }}
            >
              Built for <strong>COS30049 – Computing Technology Innovation Project</strong>, 
              demonstrating practical AI in cybersecurity.
            </Typography>
          </Paper>

          {/* ================== MODEL INFO ================== */}
          <Paper
            elevation={0}
            sx={{
              px: { xs: 3, md: 6 },
              py: { xs: 3, md: 5 },
              borderRadius: 3,
              textAlign: 'center',
              mt: 5,
              mx: 'auto',
              position: 'relative',
              transform: mounted ? 'none' : 'translateY(18px)',
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.5s ease 40ms, transform 0.5s ease 40ms',
              bgcolor: 'rgba(255,255,255,0.85)',
              border: `1px solid ${theme.palette.divider}`,
              ...forceDark,
            }}
          >
            <Stack spacing={1} alignItems="center">
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Model Information
              </Typography>

              <Button
                variant="contained"
                onClick={handleLoadInfo}
                disabled={loading}
                sx={{
                  mt: 1,
                  ...(isDarkish
                    ? {
                        bgcolor: '#FFFFFF !important',
                        color: '#000000 !important',
                        '&:hover': { bgcolor: '#E5E5E5 !important' },
                      }
                    : {}),
                }}
              >
                {loading ? 'Loading…' : 'Load Model Info'}
              </Button>
            </Stack>

            {error && (
              <Alert
                severity="warning"
                sx={{
                  mt: 2,
                  textAlign: 'left',
                  maxWidth: 900,
                  mx: 'auto',
                  ...(isDarkish
                    ? {
                        backgroundColor: '#141414 !important',
                        color: '#FFFFFF !important',
                        border: '1px solid rgba(255,255,255,0.12) !important',
                      }
                    : {}),
                }}
              >
                {error}
              </Alert>
            )}

            {loading && !modelInfo && (
              <Grid
                container
                spacing={2}
                sx={{ mt: 3, maxWidth: 1000, mx: 'auto' }}
                justifyContent="center"
              >
                {[...Array(6)].map((_, i) => (
                  <Grid key={i} item xs={6} sm={4} md={2.4}>
                    <Skeleton
                      variant="rounded"
                      height={96}
                      sx={{ bgcolor: isDarkish ? '#141414 !important' : undefined }}
                    />
                  </Grid>
                ))}
              </Grid>
            )}

            {modelInfo && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ maxWidth: 1000, mx: 'auto', textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {modelInfo.model_name}
                  </Typography>
                  {modelInfo.tagline && (
                    <Typography
                      variant="body1"
                      sx={{
                        mt: 0.5,
                        color: isDarkish
                          ? `${Muted(0.8)} !important`
                          : 'text.secondary',
                      }}
                    >
                      {modelInfo.tagline}
                    </Typography>
                  )}
                </Box>

                <Divider
                  sx={{
                    my: 2.5,
                    maxWidth: 1000,
                    mx: 'auto',
                    borderColor: isDarkish
                      ? 'rgba(255,255,255,0.12) !important'
                      : theme.palette.divider,
                  }}
                />

                <Grid
                  container
                  spacing={2}
                  sx={{ maxWidth: 900, mx: 'auto' }}
                  justifyContent="center"
                >
                  <StatItem
                    label="TF-IDF Vocabulary"
                    value={modelInfo.tfidf_vocab_size}
                  />
                  <StatItem
                    label="RF Engineered Features"
                    value={modelInfo.rf_engineered_features}
                  />
                  <StatItem
                    label="XGB Feature Count"
                    value={modelInfo.xgb_feature_count}
                  />
                </Grid>

                <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                    XGBoost's Performance
                  </Typography>
                  <Grid container spacing={2} justifyContent="center">
                    <MetricCard label="Accuracy" value={modelInfo.xgb_accuracy} />
                    <MetricCard label="Precision" value={modelInfo.xgb_precision} />
                    <MetricCard label="Recall" value={modelInfo.xgb_recall} />
                    <MetricCard label="F1" value={modelInfo.xgb_f1} />
                    <MetricCard label="AUC" value={modelInfo.xgb_auc} />
                  </Grid>
                </Box>

                <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                    Random Forest's Performance
                  </Typography>
                  <Grid container spacing={2} justifyContent="center">
                    <MetricCard label="Accuracy" value={modelInfo.rf_accuracy} />
                    <MetricCard label="Precision" value={modelInfo.rf_precision} />
                    <MetricCard label="Recall" value={modelInfo.rf_recall} />
                    <MetricCard label="F1" value={modelInfo.rf_f1} />
                    <MetricCard label="AUC" value={modelInfo.rf_auc} />
                  </Grid>
                </Box>

                <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 3, textAlign: 'left' }}>
                  <Accordion
                    sx={{
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: `1px solid ${theme.palette.divider}`,
                      ...(isDarkish
                        ? {
                            bgcolor: '#0B0B0B !important',
                            color: '#FFFFFF !important',
                            border:
                              '1px solid rgba(255,255,255,0.12) !important',
                          }
                        : {}),
                      '&:hover': {
                        boxShadow: isDarkish
                          ? '0 12px 28px rgba(0,0,0,0.5)'
                          : '0 12px 28px rgba(0,0,0,0.12)',
                      },
                    }}
                  >
                    <AccordionSummary
                      sx={{
                        '& .MuiAccordionSummary-content': {
                          justifyContent: 'center',
                          m: '0 !important',
                        },
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        textAlign="center"
                        sx={{ width: '100%' }}
                      >
                        View raw JSON
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                    <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: isDarkish
                            ? '#0B0B0B !important'
                            : (t) =>
                                t.palette.mode === 'dark'
                                  ? 'rgba(255,255,255,0.04)'
                                  : 'background.default',
                          color: isDarkish ? '#FFFFFF !important' : 'inherit',
                          border: isDarkish
                            ? '1px solid rgba(255,255,255,0.12) !important'
                            : `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <pre
                          style={{
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            color: isDarkish ? '#FFFFFF' : 'inherit',
                          }}
                        >
                          {JSON.stringify(modelInfo, null, 2)}
                        </pre>
                      </Paper>
                    </AccordionDetails>
                  </Accordion>
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    mt: 3,
                    color: isDarkish ? `${Muted(0.72)} !important` : 'text.secondary',
                  }}
                >
                  © 2025 SPECTER — A student-built AI security project.
                </Typography>
              </Box>
            )}
          </Paper>
        </Container>
      </Box>
    </>
  );
}

export default About;