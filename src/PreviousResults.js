import React, { useContext, useEffect, useMemo, useRef } from 'react';
import {
  Typography,
  Container,
  Box,
  Paper,
  Card,
  CardContent,
  Grid
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

  // Prepare data for charts
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

  function ReasonsBubbleChart({ data }) {
    const containerRef = useRef(null);
    const svgRef = useRef(null);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const width = Math.max(280, container.clientWidth);
      const height = 360;

      // Clear previous svg
      d3.select(svgRef.current).selectAll('*').remove();

      const svg = d3
        .select(svgRef.current)
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('background', 'transparent');

      // No data available
      if (!data.children || data.children.length === 0) {
        svg
          .append('text')
          .attr('x', width / 2)
          .attr('y', height / 2)
          .attr('text-anchor', 'middle')
          .attr('fill', colors.textSecondary)
          .style('font-size', '14px')
          .text('No explain data available yet');
        return;
      }

      const root = d3.hierarchy(data).sum(d => d.value);
      const pack = d3.pack().size([width, height]).padding(3);
      const nodes = pack(root).leaves();

      // Color by ham ratio (green) vs spam ratio (red)
      const colorScale = d3.scaleSequential(d3.interpolateRdYlGn).domain([0, 1]);

      svg
        .selectAll('g.node')
        .data(nodes, d => d.data.term)
        .join(enter => {
          const g = enter.append('g').attr('class', 'node').attr('transform', d => `translate(${d.x},${d.y})`);
          g.append('circle')
            .attr('r', 0)
            .attr('fill', d => {
              const total = d.data.spam + d.data.ham || 1;
              const hamRatio = d.data.ham / total;
              return colorScale(hamRatio);
            })
            .attr('stroke', colors.borderColor)
            .attr('stroke-width', 1)
            .transition()
            .duration(500)
            .attr('r', d => d.r);

          g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.3em')
            .style('pointer-events', 'none')
            .style('fill', colors.textColor)
            .style('font-weight', 600)
            .style('font-size', d => `${Math.min(16, d.r / 3 + 6)}px`)
            .text(d => {
              const term = d.data.term;
              return term.length > 20 ? term.slice(0, 17) + '…' : term;
            })
            .attr('opacity', d => (d.r > 18 ? 0.9 : 0));

          // Tooltip on hover
          g.append('title').text(d => {
            const total = d.data.spam + d.data.ham;
            const hamRatio = total ? (d.data.ham / total) : 0;
            const spamRatio = total ? (d.data.spam / total) : 0;
            return `${d.data.term}\nWeight: ${d.data.value.toFixed(2)}\nSpam: ${(spamRatio*100).toFixed(0)}%  Ham: ${(hamRatio*100).toFixed(0)}%`;
          });

          return g;
        });

      const onResize = () => {
        const w = Math.max(280, container.clientWidth);
        svg.attr('width', w);
      };
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, [data, darkMode, colors]);

    return (
      <Box ref={containerRef} sx={{ width: '100%' }}>
        <svg ref={svgRef} />
      </Box>
    );
  }

  return (
    <Container component="main" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ color: colors.textColor, mb: 3 }}>
          Previous Results
        </Typography>

        {!hasHistory ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: colors.paper_bgcolor }}>
            <Typography variant="h6" sx={{ color: colors.textSecondary }}>
              No prediction history available yet
            </Typography>
            <Typography variant="body2" sx={{ mt: 2, color: colors.textDisabled }}>
              Make some predictions to see your history here
            </Typography>
          </Paper>
        ) : (
          <>

        {/* Summary Statistics */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: colors.paper_bgcolor }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ color: colors.textColor }}>
                  {predictionHistory.length}
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                  Total Predictions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: colors.paper_bgcolor }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ color: colors.textColor }}>
                  {spamCount}
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                  Spam Detected
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: colors.paper_bgcolor }}>
              <CardContent sx={{ textAlign: 'center' }}>
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
          <Typography variant="h6" gutterBottom sx={{ color: colors.textColor }}>
            Prediction Score History
          </Typography>
          <Box sx={{ height: 300 }}>
            <Bar data={barChartData} options={chartOptions} />
          </Box>
        </Paper>

        {/* Line Chart - Model Comparison */}
  <Paper sx={{ p: 3, mb: 3, bgcolor: colors.paper_bgcolor }}>
          <Typography variant="h6" gutterBottom sx={{ color: colors.textColor }}>
            Model Score Comparison Over Time
          </Typography>
          <Box sx={{ height: 300 }}>
            <Line data={lineChartData} options={chartOptions} />
          </Box>
        </Paper>

        {/* D3 Bubble Chart - Reasons from Explain field in API */}
  <Paper sx={{ p: 3, mb: 3, bgcolor: colors.paper_bgcolor }}>
          <Typography variant="h6" gutterBottom sx={{ color: colors.textColor }}>
            Reasons Bubble Chart (Explain Aggregation)
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 2 }}>
            Bubble size reflects cumulative importance; color leans red for spam-associated terms and green for ham.
          </Typography>
          <Box sx={{ height: 360 }}>
            <ReasonsBubbleChart data={explainAgg} />
          </Box>
        </Paper>

        {/* Recent Predictions List */}
  <Paper sx={{ p: 3, bgcolor: colors.paper_bgcolor }}>
          <Typography variant="h6" gutterBottom sx={{ color: colors.textColor }}>
            Recent Predictions (Last 10)
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: colors.textSecondary }}>
            Showing most recent predictions from both single and batch analyses
          </Typography>
          {predictionHistory.slice().reverse().slice(0, 10).map((prediction, idx) => (
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
                      Prediction #{predictionHistory.length - idx}
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
