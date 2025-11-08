import React, { useContext, useEffect, useMemo, useRef } from 'react';
import {
  Typography,
  Container,
  Box,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { ThemeContext } from './background';
import { PredictionContext } from './PredictionProvider';
import AssessmentIcon from '@mui/icons-material/Assessment';
import * as d3 from 'd3';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
);

function PreviousResults() {
  const { darkMode, colors } = useContext(ThemeContext);
  const { predictionHistory } = useContext(PredictionContext);
  const hasHistory = !!(predictionHistory && predictionHistory.length > 0);
  
  // Refs for chart canvases
  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const bubbleChartRef = useRef(null);
  
  // Menu state for export options
  const [anchorEl, setAnchorEl] = React.useState(null);
  const exportMenuOpen = Boolean(anchorEl);

  const handleExportClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setAnchorEl(null);
  };

  // Prepare data for charts
  const historySlice = predictionHistory.slice(-15);
  const labels = predictionHistory.map((_, idx) => `Prediction ${idx + 1}`);
  const averageScores = predictionHistory.map(p => (p.averageScore * 100).toFixed(1));
  const rfScores = predictionHistory.map(p => p.rf ? (p.rf.score * 100).toFixed(1) : null).filter(s => s !== null);
  const xgbScores = predictionHistory.map(p => p.xgb ? (p.xgb.score * 100).toFixed(1) : null).filter(s => s !== null);
  
  // Bar chart data - Average scores
  const barChartData = {
    labels: labels,
    datasets: [
      {
        label: 'Average Score',
        data: averageScores,
        backgroundColor: predictionHistory.map(p => 
          p.label === 'spam' ? 'rgba(244, 67, 54, 0.6)' : 'rgba(76, 175, 80, 0.6)'
        ),
        borderColor: predictionHistory.map(p => 
          p.label === 'spam' ? 'rgba(244, 67, 54, 1)' : 'rgba(76, 175, 80, 1)'
        ),
        borderWidth: 2,
      },
    ],
  };

  // Line chart data - Model comparison
  const lineChartData = {
    labels: labels,
    datasets: [
      {
        label: 'Average Score',
        data: averageScores,
        borderColor: 'rgb(33, 150, 243)',
        backgroundColor: 'rgba(33, 150, 243, 0.5)',
        tension: 0.1,
      },
      ...(rfScores.length > 0 ? [{
        label: 'Random Forest',
        data: rfScores,
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        tension: 0.1,
      }] : []),
      ...(xgbScores.length > 0 ? [{
        label: 'XGBoost',
        data: xgbScores,
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        tension: 0.1,
      }] : []),
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: colors.textColor,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(50, 50, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: darkMode ? '#fff' : '#000',
        bodyColor: darkMode ? '#fff' : '#000',
        borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        borderWidth: 1,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: colors.textColor,
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          color: colors.gridColor,
        }
      },
      x: {
        ticks: {
          color: colors.textColor,
        },
        grid: {
          color: colors.gridColor,
        }
      },
    },
  };

  // Calculate statistics
  const spamCount = predictionHistory.filter(p => p.label === 'spam').length;
  const hamCount = predictionHistory.filter(p => p.label === 'ham').length;

  // Aggregate explain terms across history for D3 bubble chart
  const explainAgg = useMemo(() => {
    const map = new Map();
    predictionHistory.forEach(p => {
      const label = p.label;
      if (Array.isArray(p.explain)) {
        p.explain.forEach(item => {
          const term = item.term || item.feature || item.word || String(item);
          if (!term) return;
          const weight = typeof item.weight === 'number' ? Math.abs(item.weight) : (typeof item.score === 'number' ? Math.abs(item.score) : 1);
          const prev = map.get(term) || { term, value: 0, spam: 0, ham: 0, count: 0 };
          prev.value += weight;
          prev.count += 1;
          if (label === 'spam') prev.spam += 1; else if (label === 'ham') prev.ham += 1;
          map.set(term, prev);
        });
      }
      // Include simple reasons as weight 1 if no explain present
      if ((!p.explain || p.explain.length === 0) && Array.isArray(p.reasons)) {
        p.reasons.forEach(r => {
          const term = r.replace(/_/g, ' ');
          const prev = map.get(term) || { term, value: 0, spam: 0, ham: 0, count: 0 };
          prev.value += 1;
          prev.count += 1;
          if (label === 'spam') prev.spam += 1; else if (label === 'ham') prev.ham += 1;
          map.set(term, prev);
        });
      }
    });
    const children = Array.from(map.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 60); // cap to keep chart readable
    return { name: 'reasons', children };
  }, [predictionHistory]);

  // Individual Chart Export Functions
  const exportBarChartAsPNG = () => {
    const canvas = barChartRef.current?.canvas;
    if (!canvas) return;
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'prediction-score-history.png';
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  const exportLineChartAsPNG = () => {
    const canvas = lineChartRef.current?.canvas;
    if (!canvas) return;
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'model-score-comparison.png';
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  const exportBubbleChartAsPNG = () => {
    const svgElement = bubbleChartRef.current;
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = colors.paper_bgcolor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = 'reasons-bubble-chart.png';
        link.click();
        URL.revokeObjectURL(pngUrl);
      });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const exportBubbleChartAsSVG = () => {
    const svgElement = bubbleChartRef.current;
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reasons-bubble-chart.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export all data as CSV
  const exportAllDataAsCSV = () => {
    const headers = ['Prediction #', 'Label', 'Average Score', 'RF Score', 'XGB Score', 'Timestamp', 'Email Text'];
    const rows = predictionHistory.map((p, idx) => [
      idx + 1,
      p.label,
      (p.averageScore * 100).toFixed(1),
      p.rf ? (p.rf.score * 100).toFixed(1) : 'N/A',
      p.xgb ? (p.xgb.score * 100).toFixed(1) : 'N/A',
      p.timestamp || 'N/A',
      (p.text || '').replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'all-predictions-data.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Reasons Bubble Chart Component
  function ReasonsBubbleChart({ data, chartRef }) {
    const svgRef = useRef();
    const tooltipRef = useRef();

    useEffect(() => {
      if (!data || !data.children || data.children.length === 0) return;

      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();

      const containerWidth = svgRef.current.parentElement.offsetWidth;
      const width = Math.min(containerWidth, 800);
      const height = 360;

      svg.attr('width', width).attr('height', height);

      if (chartRef) {
        chartRef.current = svgRef.current;
      }

      const pack = d3.pack()
        .size([width, height])
        .padding(3);

      const root = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

      const nodes = pack(root).leaves();

      const colorScale = d3.scaleLinear()
        .domain([0, 0.5, 1])
        .range(['#4caf50', '#ffc107', '#f44336']);

      const g = svg.append('g');

      const circles = g.selectAll('circle')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', 0)
        .attr('fill', d => {
          const ratio = d.data.spam / (d.data.spam + d.data.ham || 1);
          return colorScale(ratio);
        })
        .attr('stroke', darkMode ? '#333' : '#fff')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .style('opacity', 0.8);

      circles.transition()
        .duration(800)
        .delay((d, i) => i * 20)
        .attr('r', d => d.r);

      circles.on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.r * 1.15)
          .style('opacity', 1)
          .attr('stroke-width', 2.5);

        const tooltipDiv = tooltipRef.current;
        if (!tooltipDiv) return;

        tooltipDiv.style.position = 'fixed';
        tooltipDiv.style.visibility = 'visible';
        tooltipDiv.style.display = 'block';
        tooltipDiv.style.backgroundColor = darkMode ? '#2a2a2a' : '#1a1a1a';
        tooltipDiv.style.color = 'white';
        tooltipDiv.style.border = 'none';
        tooltipDiv.style.borderRadius = '8px';
        tooltipDiv.style.padding = '16px 20px';
        tooltipDiv.style.pointerEvents = 'none';
        tooltipDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        tooltipDiv.style.zIndex = '99999';
        tooltipDiv.style.fontFamily = 'Arial, sans-serif';
        tooltipDiv.style.minWidth = '220px';
        tooltipDiv.style.left = (event.clientX + 15) + 'px';
        tooltipDiv.style.top = (event.clientY - 10) + 'px';

        tooltipDiv.innerHTML = `
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 12px; color: #fff;">
            ${d.data.term}
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #aaa;">Total Weight:</span>
            <span style="color: #5bc0de; font-weight: bold; margin-left: 15px;">${d.data.value.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #aaa;">Occurrences:</span>
            <span style="color: #f0ad4e; font-weight: bold; margin-left: 15px;">${d.data.count}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #aaa;">In Spam:</span>
            <span style="color: #f44336; font-weight: bold; margin-left: 15px;">${d.data.spam}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #aaa;">In Ham:</span>
            <span style="color: #4caf50; font-weight: bold; margin-left: 15px;">${d.data.ham}</span>
          </div>
        `;
      });

      circles.on('mousemove', function(event) {
        const tooltipDiv = tooltipRef.current;
        if (tooltipDiv) {
          tooltipDiv.style.left = (event.clientX + 15) + 'px';
          tooltipDiv.style.top = (event.clientY - 10) + 'px';
        }
      });

      circles.on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d => d.r)
          .style('opacity', 0.8)
          .attr('stroke-width', 1.5);

        const tooltipDiv = tooltipRef.current;
        if (tooltipDiv) {
          tooltipDiv.style.visibility = 'hidden';
          tooltipDiv.style.display = 'none';
        }
      });

      const texts = g.selectAll('text')
        .data(nodes.filter(d => d.r > 20))
        .enter()
        .append('text')
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .style('fill', darkMode ? '#fff' : '#000')
        .style('font-size', d => Math.min(d.r / 3, 14) + 'px')
        .style('font-weight', 'bold')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .text(d => {
          const maxLen = Math.floor(d.r / 4);
          return d.data.term.length > maxLen ? d.data.term.substring(0, maxLen) + '...' : d.data.term;
        });

      texts.transition()
        .duration(800)
        .delay((d, i) => i * 20 + 200)
        .style('opacity', 1);

    }, [data, darkMode]);

    return (
      <>
        <svg ref={svgRef} style={{ display: 'block', maxWidth: '100%' }}></svg>
        <div ref={tooltipRef} style={{ 
          position: 'fixed',
          visibility: 'hidden',
          pointerEvents: 'none'
        }}></div>
      </>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ color: colors.textColor, mb: 0 }}>
            Previous Predictions
          </Typography>
          {hasHistory && (
            <Box>
              <Button
                variant="contained"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportClick}
              >
                Export Data
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={exportMenuOpen}
                onClose={handleExportClose}
              >
                <MenuItem onClick={() => { exportAllDataAsCSV(); handleExportClose(); }}>
                  Export All as CSV
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>

        {!hasHistory ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <AssessmentIcon sx={{ fontSize: 80, color: colors.textDisabled, mb: 2 }} />
            <Typography variant="h5" sx={{ color: colors.textSecondary, mb: 1 }}>
              No prediction history yet
            </Typography>
            <Typography variant="body1" sx={{ color: colors.textDisabled }}>
              Start analyzing emails to see your prediction history and statistics here
            </Typography>
          </Box>
        ) : (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h3" sx={{ color: colors.textColor }}>
                      {predictionHistory.length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                      Total Predictions
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: darkMode ? 'error.dark' : 'error.light' }}>
                  <CardContent>
                    <Typography variant="h3" sx={{ color: colors.textColor }}>
                      {spamCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                      Spam Detected
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: darkMode ? 'success.dark' : 'success.light' }}>
                  <CardContent>
                    <Typography variant="h3" sx={{ color: colors.textColor }}>
                      {hamCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                      Legitimate
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Bar Chart - Prediction Scores */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: colors.paper_bgcolor }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: colors.textColor }}>
                  Prediction Score History
                </Typography>
                <Button
                  size="small"
                  startIcon={<FileDownloadIcon />}
                  onClick={exportBarChartAsPNG}
                  sx={{ 
                    color: colors.textColor,
                    borderColor: colors.borderColor,
                    '&:hover': { 
                      bgcolor: colors.paper_bgcolor,
                      borderColor: colors.textColor 
                    }
                  }}
                  variant="outlined"
                >
                  Export Chart
                </Button>
              </Box>
              <Box sx={{ height: 300 }}>
                <Bar ref={barChartRef} data={barChartData} options={chartOptions} />
              </Box>
            </Paper>

            {/* Line Chart - Model Comparison */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: colors.paper_bgcolor }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: colors.textColor }}>
                  Model Score Comparison Over Time
                </Typography>
                <Button
                  size="small"
                  startIcon={<FileDownloadIcon />}
                  onClick={exportLineChartAsPNG}
                  sx={{ 
                    color: colors.textColor,
                    borderColor: colors.borderColor,
                    '&:hover': { 
                      bgcolor: colors.paper_bgcolor,
                      borderColor: colors.textColor 
                    }
                  }}
                  variant="outlined"
                >
                  Export Chart
                </Button>
              </Box>
              <Box sx={{ height: 300 }}>
                <Line ref={lineChartRef} data={lineChartData} options={chartOptions} />
              </Box>
            </Paper>

            {/* D3 Bubble Chart - Reasons from Explain field in API */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: colors.paper_bgcolor }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="h6" sx={{ color: colors.textColor }}>
                    Reasons Bubble Chart (Explain Aggregation)
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 1 }}>
                    Bubble size reflects cumulative importance; color leans red for spam-associated terms and green for ham.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<FileDownloadIcon />}
                    onClick={exportBubbleChartAsPNG}
                    sx={{ 
                      color: colors.textColor,
                      borderColor: colors.borderColor,
                      '&:hover': { 
                        bgcolor: colors.paper_bgcolor,
                        borderColor: colors.textColor 
                      }
                    }}
                    variant="outlined"
                  >
                    PNG
                  </Button>
                  <Button
                    size="small"
                    startIcon={<FileDownloadIcon />}
                    onClick={exportBubbleChartAsSVG}
                    sx={{ 
                      color: colors.textColor,
                      borderColor: colors.borderColor,
                      '&:hover': { 
                        bgcolor: colors.paper_bgcolor,
                        borderColor: colors.textColor 
                      }
                    }}
                    variant="outlined"
                  >
                    SVG
                  </Button>
                </Box>
              </Box>
              <Box sx={{ height: 360, mt: 2 }}>
                <ReasonsBubbleChart data={explainAgg} chartRef={bubbleChartRef} />
              </Box>
            </Paper>

            {/* Recent Predictions List - FIXED: Latest prediction is now #1 */}
            <Paper sx={{ p: 3, bgcolor: colors.paper_bgcolor }}>
              <Typography variant="h6" gutterBottom sx={{ color: colors.textColor }}>
                Recent Predictions
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: colors.textSecondary }}>
                Showing most recent 15 predictions from both single and batch analyses
              </Typography>
              {predictionHistory.slice().reverse().slice(0, 15).map((prediction, idx) => (
                <Card key={idx} sx={{ 
                  mb: 2, 
                  bgcolor: colors.paper_bgcolor,
                  borderLeft: 4,
                  borderColor: prediction.label === 'spam' ? 'error.main' : 'success.main'
                }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={2}>
                        <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                          Prediction #{idx + 1}
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          color: prediction.label === 'spam' ? 'error.main' : 'success.main',
                          textTransform: 'capitalize'
                        }}>
                          {prediction.label}
                        </Typography>
                        {prediction.timestamp && (
                          <Typography variant="caption" sx={{ color: colors.textDisabled, display: 'block', mt: 0.5 }}>
                            {new Date(prediction.timestamp).toLocaleTimeString()}
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                          Average Score
                        </Typography>
                        <Typography variant="h6" sx={{ color: colors.textColor }}>
                          {(prediction.averageScore * 100).toFixed(1)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3.5}>
                        <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                          Random Forest
                        </Typography>
                        <Typography variant="body1" sx={{ color: colors.textColor }}>
                          {prediction.rf ? `${(prediction.rf.score * 100).toFixed(1)}%` : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3.5}>
                        <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                          XGBoost
                        </Typography>
                        <Typography variant="body1" sx={{ color: colors.textColor }}>
                          {prediction.xgb ? `${(prediction.xgb.score * 100).toFixed(1)}%` : 'N/A'}
                        </Typography>
                      </Grid>
                      {prediction.text && (
                        <Grid item xs={12}>
                          <Box sx={{ 
                            mt: 1, 
                            p: 1.5, 
                            bgcolor: colors.paper_bgcolor, 
                            borderRadius: 1,
                            border: 1,
                            borderColor: colors.borderColor,
                            maxHeight: 80,
                            overflow: 'auto'
                          }}>
                            <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mb: 0.5 }}>
                              Email Text:
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: colors.textColor,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              fontSize: '0.875rem'
                            }}>
                              {prediction.text.length > 200 
                                ? prediction.text.substring(0, 200) + '...' 
                                : prediction.text}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Paper>
          </>
        )}
      </Box>
    </Container>
  );
}

export default PreviousResults;