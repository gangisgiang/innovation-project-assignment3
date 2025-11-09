import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  MenuItem,
  IconButton,
  Snackbar,
  Alert,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  LineElement,
  PointElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

import { ThemeContext } from './background';
import { PredictionContext } from './PredictionProvider';

import AssessmentIcon from '@mui/icons-material/Assessment';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import * as d3 from 'd3';

// ── Chart.js register
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  LineElement,
  PointElement
);

// ── Config
const API_BASE = 'http://localhost:8000';
const CHART_LIMIT = 20; // charts + bubble + recents

// ─────────────────────────────────────────────────────────────
// Float look components: glassy + soft glow underneath
// ─────────────────────────────────────────────────────────────
function FloatPaper({ children, sx = {}, darkMode, ...rest }) {
  const base = {
    position: 'relative',
    borderRadius: 2,
    border: '1px solid',
    borderColor: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
    bgcolor: darkMode ? 'rgba(17,25,40,0.45)' : 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(8px) saturate(120%)',
    WebkitBackdropFilter: 'blur(8px) saturate(120%)',
    boxShadow: darkMode
      ? '0 12px 30px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.25)'
      : '0 12px 30px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    '&::after': {
      content: '""',
      position: 'absolute',
      left: 24,
      right: 24,
      bottom: -12,
      height: 24,
      borderRadius: '50%',
      background: darkMode
        ? 'radial-gradient(60% 60% at 50% 0%, rgba(0,0,0,0.35), rgba(0,0,0,0))'
        : 'radial-gradient(60% 60% at 50% 0%, rgba(0,0,0,0.16), rgba(0,0,0,0))',
      filter: 'blur(8px)',
      pointerEvents: 'none'
    }
  };
  return (
    <Paper elevation={0} sx={{ ...base, ...sx }} {...rest}>
      {children}
    </Paper>
  );
}

function FloatCard({ children, sx = {}, darkMode, ...rest }) {
  const base = {
    position: 'relative',
    borderRadius: 2,
    border: '1px solid',
    borderColor: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
    bgcolor: darkMode ? 'rgba(17,25,40,0.36)' : 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(6px) saturate(120%)',
    WebkitBackdropFilter: 'blur(6px) saturate(120%)',
    boxShadow: darkMode
      ? '0 10px 26px rgba(0,0,0,0.32), 0 1px 4px rgba(0,0,0,0.22)'
      : '0 10px 26px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
    overflow: 'visible', // để hint không bị cắt
  };
  return (
    <Card elevation={0} sx={{ ...base, ...sx }} {...rest}>
      {children}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Responsive export control: icon on phones, button on larger
// ─────────────────────────────────────────────────────────────
function ResponsiveExportButton({ title = 'Export', onClick, isMobile, outlined = true }) {
  if (isMobile) {
    return (
      <Tooltip title={title}>
        <IconButton
          size="small"
          onClick={onClick}
          sx={{ border: outlined ? '1px solid' : 'none', borderColor: 'divider' }}
        >
          <FileDownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }
  return (
    <Tooltip title={title}>
      <Button
        size="small"
        startIcon={<FileDownloadIcon />}
        variant={outlined ? 'outlined' : 'contained'}
        onClick={onClick}
        sx={{
          minWidth: 0,
          px: 1.25,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {title.toUpperCase()}
      </Button>
    </Tooltip>
  );
}

// ─────────────────────────────────────────────────────────────
// Delete button with custom tooltip (bám sát icon, không lệch)
// ─────────────────────────────────────────────────────────────
function DeleteButtonWithHint({ disabled, onClick, top = { xs: 6, sm: 10 }, right = { xs: 6, sm: 10 } }) {
  return (
    <Box sx={{ position: 'absolute', top, right, zIndex: 2 }}>
      <Box
        sx={{
          position: 'relative',
          display: 'inline-block',
          '&:hover .delete-hint, &:focus-within .delete-hint': {
            opacity: 1,
            transform: 'translateY(-50%) translateX(0)'
          }
        }}
      >
        <IconButton
          aria-label="delete-record"
          size="small"
          color="error"
          disabled={disabled}
          onClick={onClick}
          sx={{
            backgroundColor: 'rgba(244,67,54,0.06)',
            '&:hover': { backgroundColor: 'rgba(244,67,54,0.12)' },
            transition: 'background-color 0.2s ease'
          }}
        >
          <DeleteOutline />
        </IconButton>

        {/* Tooltip tự code – luôn bám sát icon */}
        <Box
          className="delete-hint"
          sx={{
            position: 'absolute',
            right: 'calc(100% + 8px)',   // sát bên trái icon 8px
            top: '50%',
            transform: 'translateY(-50%) translateX(6px)', // lúc ẩn lùi nhẹ
            px: 1,
            py: 0.5,
            bgcolor: 'rgba(97,97,97,0.92)',
            color: '#fff',
            borderRadius: 1,
            fontSize: '12px',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity .15s ease, transform .15s ease',
            '&::after': {
              content: '""',
              position: 'absolute',
              left: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              borderWidth: '6px',
              borderStyle: 'solid',
              borderColor: 'transparent transparent transparent rgba(97,97,97,0.92)'
            }
          }}
        >
          Delete this record from server history
        </Box>
      </Box>
    </Box>
  );
}

// ── API helpers
async function apiGetHistory() {
  const resp = await fetch(`${API_BASE}/history`);
  const payload = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(payload?.detail || payload?.message || 'Failed to fetch history');

  // Hỗ trợ mọi kiểu payload: success_response, mảng trần, hay {items:[]}
  const items =
    payload?.data?.items ??
    (Array.isArray(payload) ? payload : (payload?.items ?? []));

  return items.map((it) => {
    const ensemble = it.ensemble || {};
    return {
      id: it.id ?? it.record_id ?? it._id ?? null,
      label: it.label || it.prediction || 'ham',
      score: typeof it.score === 'number'
        ? it.score
        : (typeof it.averageScore === 'number' ? it.averageScore : 0),
      rf: ensemble.rf || null,
      xgb: ensemble.xgb || null,
      text: it.text || '',
      timestamp: it.timestamp || it.time || null,
      reasons: Array.isArray(it.reasons) ? it.reasons : [],
      explain: Array.isArray(it.explain) ? it.explain : [],
      action: it.action || 'allow',
    };
  });
}


async function apiDeleteHistory(id) {
  const resp = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data?.detail || data?.message || 'Failed to delete');
  return data;
}

/** ─────────────────────────────────────────────────────────────
 *  Zoomable + wrapped-labels Bubble Chart (D3)
 *  - Scroll to zoom, drag to pan, double-click to reset
 *  - On-canvas + / − / ⟲ buttons (anchored top-right)
 *  - Wrapped labels up to 3 lines (ellipsis if truncated)
 *  - Hover tooltip with term + stats
 *  - chartRef.current → <svg> (for PNG/SVG export)
 *  ────────────────────────────────────────────────────────────*/
function ReasonsBubbleChart({ data, chartRef, darkMode }) {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const containerWidth = svgEl.parentElement?.offsetWidth || 800;
    const width = Math.min(containerWidth, 800);
    const height = 360;

    svg.attr('width', width).attr('height', height);
    if (chartRef) chartRef.current = svgEl;

    if (!data || !data.children || data.children.length === 0) return;

    const gRoot = svg.append('g');
    const gContent = gRoot.append('g').attr('class', 'content');

    const pack = d3.pack().size([width, height]).padding(3);
    const root = d3.hierarchy(data).sum(d => d.value).sort((a, b) => b.value - a.value);
    const nodes = pack(root).leaves();

    const colorScale = d3.scaleLinear().domain([0, 0.5, 1]).range(['#4caf50', '#ffc107', '#f44336']);

    // Circles
    const circles = gContent.selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 0)
      .attr('fill', d => {
        const total = (d.data.spam + d.data.ham) || 1;
        return colorScale(d.data.spam / total);
      })
      .attr('stroke', darkMode ? '#333' : '#fff')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .style('opacity', 0.85);

    circles.transition().duration(800).delay((d, i) => i * 20).attr('r', d => d.r);

    // Tooltip (native HTML)
    circles.on('mouseenter', function (event, d) {
      d3.select(this).transition().duration(150)
        .attr('r', d.r * 1.15).style('opacity', 1).attr('stroke-width', 2.5);

      const tip = tooltipRef.current;
      if (!tip) return;
      tip.style.visibility = 'visible';
      tip.style.display = 'block';
      tip.style.left = `${event.pageX + 10}px`;
      tip.style.top = `${event.pageY + 10}px`;
      tip.style.backgroundColor = darkMode ? 'rgba(30,30,30,0.96)' : 'rgba(255,255,255,0.96)';
      tip.style.color = darkMode ? '#fff' : '#000';
      tip.style.border = `1px solid ${darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'}`;
      tip.style.padding = '8px 10px';
      tip.style.borderRadius = '6px';
      tip.style.fontSize = '12px';
      tip.innerHTML = `
        <div style="font-weight:600; margin-bottom:4px">${d.data.term}</div>
        <div>Weight: ${d.data.value.toFixed(2)}</div>
        <div>Spam: ${d.data.spam} • Ham: ${d.data.ham}</div>
      `;
    });

    circles.on('mouseleave', function () {
      d3.select(this).transition().duration(150)
        .attr('r', d => d.r).style('opacity', 0.85).attr('stroke-width', 1.5);
      const tip = tooltipRef.current;
      if (tip) { tip.style.visibility = 'hidden'; tip.style.display = 'none'; }
    });

    // Labels: shrink + wrap (max 3 lines)
    const MAX_LINES = 3;
    const MIN_FONT = 8;
    const BASE_FONT = d => Math.min(16, d.r / 2.4);

    const labels = gContent.selectAll('text')
      .data(nodes.filter(d => d.r > 18))
      .enter()
      .append('text')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('fill', darkMode ? '#fff' : '#000')
      .style('font-weight', 700)
      .style('pointer-events', 'none')
      .style('opacity', 0);

    function wrapText(textSel, d) {
      const maxWidth = d.r * 2 * 0.85;
      let fontSize = Math.floor(BASE_FONT(d));
      textSel.style('font-size', fontSize + 'px').text(d.data.term);

      // Try single-line shrink
      let length = textSel.node().getComputedTextLength();
      if (length > maxWidth) {
        const scale = Math.max(maxWidth / length, MIN_FONT / fontSize);
        fontSize = Math.floor(fontSize * scale);
        textSel.style('font-size', fontSize + 'px');
      }

      // If still long → wrap
      if (textSel.node().getComputedTextLength() > maxWidth) {
        const words = d.data.term.split(/\s+/);
        textSel.text(null);

        let line = [];
        let lineNumber = 0;
        const lineHeightEm = 1.05;
        let tspan = textSel.append('tspan')
          .attr('x', d.x).attr('y', d.y).attr('dy', 0).text('');

        for (let i = 0; i < words.length; i++) {
          line.push(words[i]);
          tspan.text(line.join(' '));
          if (tspan.node().getComputedTextLength() > maxWidth && line.length > 1) {
            line.pop();
            tspan.text(line.join(' '));
            line = [words[i]];
            lineNumber++;
            if (lineNumber >= MAX_LINES) break;
            tspan = textSel.append('tspan')
              .attr('x', d.x).attr('y', d.y)
              .attr('dy', lineNumber * lineHeightEm + 'em')
              .text(words[i]);
          }
        }

        if (lineNumber >= MAX_LINES) {
          const last = textSel.select('tspan:last-child');
          last.text(last.text() + '…');
        }

        // Vertical center tspans
        const tspans = textSel.selectAll('tspan').nodes();
        const totalLines = tspans.length;
        tspans.forEach((span, i) => {
          const shift = (i - (totalLines - 1) / 2) * lineHeightEm;
          span.setAttribute('dy', shift + 'em');
        });

        // Ensure height fits circle
        const totalHeightPx = totalLines * fontSize * lineHeightEm;
        const maxHeightPx = d.r * 2 * 0.9;
        if (totalHeightPx > maxHeightPx) {
          const scale = maxHeightPx / totalHeightPx;
          const newFont = Math.max(MIN_FONT, Math.floor(fontSize * scale));
          textSel.style('font-size', newFont + 'px');
        }
      }
    }

    labels.each(function (d) { wrapText(d3.select(this), d); })
      .transition().duration(800).delay((d, i) => i * 20 + 200)
      .style('opacity', 1);

    // Zoom/pan/reset
    const zoom = d3.zoom()
      .scaleExtent([0.8, 6])
      .translateExtent([[-50, -50], [width + 50, height + 50]])
      .on('zoom', (event) => gContent.attr('transform', event.transform));

    svg.call(zoom);
    svg.on('dblclick', () => {
      svg.transition().duration(350).call(zoom.transform, d3.zoomIdentity);
    });

    // On-canvas controls (anchored top-right inside svg)
    const CTRL_WIDTH = 96; // 3 * 32
    const PADDING = 12;
    const ctrl = gRoot.append('g')
      .attr('class', 'zoom-controls')
      .attr('transform', `translate(${width - CTRL_WIDTH - PADDING}, ${PADDING})`);

    const btnData = [
      { key: 'in',  label: '+',  x: 0 },
      { key: 'out', label: '−',  x: 32 },
      { key: 'rst', label: '⟲', x: 64 },
    ];

    const btn = ctrl.selectAll('g.btn')
      .data(btnData)
      .enter()
      .append('g')
      .attr('class', 'btn')
      .style('cursor', 'pointer')
      .attr('transform', d => `translate(${d.x},0)`)
      .on('click', (_, d) => {
        if (d.key === 'in')  svg.transition().duration(200).call(zoom.scaleBy, 1.25);
        if (d.key === 'out') svg.transition().duration(200).call(zoom.scaleBy, 0.8);
        if (d.key === 'rst') svg.transition().duration(250).call(zoom.transform, d3.zoomIdentity);
      });

    btn.append('rect')
      .attr('width', 28).attr('height', 24).attr('rx', 6)
      .attr('fill', darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')
      .attr('stroke', darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)');

    btn.append('text')
      .attr('x', 14).attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('fill', darkMode ? '#fff' : '#000')
      .style('font-weight', 700)
      .style('font-size', '13px')
      .text(d => d.label);
  }, [data, darkMode, chartRef]);

  return (
    <>
      <svg
        ref={svgRef}
        style={{
          display: 'block',
          maxWidth: '100%',
          margin: '0 auto'
        }}
      />
      <div ref={tooltipRef} style={{ position: 'fixed', visibility: 'hidden', pointerEvents: 'none' }} />
    </>
  );
}

// ── Main component
function PreviousResults() {
  const { darkMode, colors } = useContext(ThemeContext);
  const { predictionHistory } = useContext(PredictionContext);

  // Responsive hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));        // <600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm','md')); // 600–900
  const chartHeight = isMobile ? 220 : (isTablet ? 260 : 300);

  // State
  const [serverHistory, setServerHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackSeverity, setSnackSeverity] = useState('info');
  const [snackMsg, setSnackMsg] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const exportMenuOpen = Boolean(anchorEl);

  // Refs
  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const bubbleChartRef = useRef(null);

  const openSnack = (msg, severity = 'info') => {
    setSnackMsg(msg);
    setSnackSeverity(severity);
    setSnackOpen(true);
  };

  // Load history from backend
  const loadServerHistory = async () => {
    setLoading(true);
    try {
      const items = await apiGetHistory();
      setServerHistory(items);
    } catch (e) {
      openSnack(String(e?.message || e), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadServerHistory(); }, []);

  // Prefer server; fallback to context (reversed to newest-first)
  const listForUI = serverHistory.length > 0
    ? serverHistory.slice()
    : predictionHistory.slice().reverse();

  // Charts + Bubble + Recent: only 20 latest
  const limited = listForUI.slice(0, CHART_LIMIT);

  // Summary (use full list)
  const spamCount = listForUI.filter(p => p.label === 'spam').length;
  const hamCount = listForUI.filter(p => p.label === 'ham').length;

  // Chart datasets (numbers for y values)
  const labels = limited.map((_, idx) => `Prediction ${idx + 1}`);
  const avgNum = limited.map(p => Math.round(((p.score ?? 0) * 100) * 10) / 10);
  const rfNum  = limited.map(p => (p?.rf?.score != null)  ? Math.round(p.rf.score  * 1000) / 10 : null);
  const xgbNum = limited.map(p => (p?.xgb?.score != null) ? Math.round(p.xgb.score * 1000) / 10 : null);

  const barChartData = {
    labels,
    datasets: [{
      label: 'Average Score',
      data: avgNum,
      backgroundColor: limited.map(p =>
        p.label === 'spam' ? 'rgba(244, 67, 54, 0.6)' : 'rgba(76, 175, 80, 0.6)'
      ),
      borderColor: limited.map(p =>
        p.label === 'spam' ? 'rgba(244, 67, 54, 1)' : 'rgba(76, 175, 80, 1)'
      ),
      borderWidth: 2,
    }],
  };

  const lineChartData = {
    labels,
    datasets: [
      {
        label: 'Average',
        data: avgNum,
        borderColor: 'rgb(33, 150, 243)',
        backgroundColor: 'rgba(33, 150, 243, 0.5)',
        tension: 0.1,
      },
      {
        label: 'Random Forest',
        data: rfNum,
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        tension: 0.1,
      },
      {
        label: 'XGBoost',
        data: xgbNum,
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: colors.textColor, font: { size: isMobile ? 10 : 12 } }
      },
      title: { display: false },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(50, 50, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: darkMode ? '#fff' : '#000',
        bodyColor: darkMode ? '#fff' : '#000',
        borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
        borderWidth: 1,
        callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}%` }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: colors.textColor,
          callback: v => v + '%',
          font: { size: isMobile ? 10 : 12 }
        },
        grid: { color: colors.gridColor }
      },
      x: {
        ticks: {
          color: colors.textColor,
          font: { size: isMobile ? 10 : 12 }
        },
        grid: { color: colors.gridColor }
      }
    }
  };

  // Explain aggregation for Bubble (on the limited list)
  const explainAgg = useMemo(() => {
    const map = new Map();
    limited.forEach(p => {
      const label = p.label;
      if (Array.isArray(p.explain)) {
        p.explain.forEach(item => {
          const term = item?.term || item?.feature || item?.word || String(item);
          if (!term) return;
          const w = Math.abs(item?.weight ?? item?.score ?? 1);
          const prev = map.get(term) || { term, value: 0, spam: 0, ham: 0 };
          prev.value += w;
          if (label === 'spam') prev.spam += 1; else prev.ham += 1;
          map.set(term, prev);
        });
      } else if (Array.isArray(p.reasons)) {
        p.reasons.forEach(r => {
          const term = String(r).replace(/_/g, ' ');
          const prev = map.get(term) || { term, value: 0, spam: 0, ham: 0 };
          prev.value += 1;
          if (label === 'spam') prev.spam += 1; else prev.ham += 1;
          map.set(term, prev);
        });
      }
    });
    return { name: 'reasons', children: Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, 60) };
  }, [limited]);

  // Export CSV (full source list)
  const exportAllDataAsCSV = () => {
    const headers = ['#', 'Label', 'Average Score', 'RF Score', 'XGB Score', 'Timestamp', 'Email Text'];
    const rows = listForUI.map((p, idx) => [
      idx + 1,
      p.label,
      Math.round(((p.score ?? 0) * 100) * 10) / 10,
      p?.rf?.score != null ? Math.round(p.rf.score * 1000) / 10 : 'N/A',
      p?.xgb?.score != null ? Math.round(p.xgb.score * 1000) / 10 : 'N/A',
      p.timestamp || 'N/A',
      (p.text || '').replace(/"/g, '""'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${c}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all-predictions-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportClick = (e) => setAnchorEl(e.currentTarget);
  const handleExportClose = () => setAnchorEl(null);

  const hasAnyHistory = listForUI.length > 0;

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: { xs: 2.5, sm: 3, md: 4 },
        px: { xs: 2, sm: 3, md: 4 },
        position: 'relative',
        background: darkMode
          ? 'linear-gradient(180deg, rgba(11,15,25,0.55), rgba(11,15,25,0.35))'
          : 'linear-gradient(180deg, rgba(250,250,252,0.6), rgba(250,250,252,0.4))'
      }}
    >
      <Box>
        {/* Header + Export (wrap safe) */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ color: colors.textColor, mb: 0, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}
          >
            Previous Predictions
          </Typography>

          {hasAnyHistory && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <ResponsiveExportButton
                title="Export all CSV"
                isMobile={isMobile}
                outlined={false}
                onClick={() => { exportAllDataAsCSV(); handleExportClose(); }}
              />
            </Box>
          )}
        </Box>

        {/* Empty state */}
        {!hasAnyHistory ? (
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
            <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
              <Grid item xs={12} md={4}>
                <FloatCard darkMode={darkMode}>
                  <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                    <Typography variant="h3" sx={{ color: colors.textColor }}>
                      {listForUI.length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                      Total Predictions
                    </Typography>
                  </CardContent>
                </FloatCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <FloatCard darkMode={darkMode}>
                  <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                    <Typography variant="h3" sx={{ color: 'error.main' }}>
                      {spamCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                      Spam Detected
                    </Typography>
                  </CardContent>
                </FloatCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <FloatCard darkMode={darkMode}>
                  <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                    <Typography variant="h3" sx={{ color: 'success.main' }}>
                      {hamCount}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                      Legitimate
                    </Typography>
                  </CardContent>
                </FloatCard>
              </Grid>
            </Grid>

            {/* Bar Chart (latest 20) */}
            <FloatPaper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }} darkMode={darkMode}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 1.5,
                  mb: 2,
                  flexWrap: 'wrap'
                }}
              >
                <Box sx={{ pr: 2, minWidth: 240, flex: '1 1 320px' }}>
                  <Typography variant="h6" sx={{ color: colors.textColor }}>
                    Prediction Score History (latest {CHART_LIMIT})
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.75, fontSize: { xs: '0.875rem', sm: '0.95rem' } }}>
                    Average spam likelihood (%) for your most recent predictions. Bars are colored by final label
                    (red = spam, green = ham).
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.textDisabled,
                      mt: 0.5,
                      fontSize: { xs: '0.85rem', sm: '0.9rem' },
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere'
                    }}
                  >
                    Tip: <strong>Hover</strong> a bar to see the exact percentage. Use the legend to focus. Export as PNG.
                  </Typography>
                </Box>

                <ResponsiveExportButton
                  title="Export PNG"
                  isMobile={isMobile}
                  onClick={() => {
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
                  }}
                />
              </Box>

              <Box sx={{ height: chartHeight }}>
                <Bar ref={barChartRef} data={barChartData} options={chartOptions} />
              </Box>
            </FloatPaper>

            {/* Line Chart (latest 20) */}
            <FloatPaper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }} darkMode={darkMode}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 1.5,
                  mb: 2,
                  flexWrap: 'wrap'
                }}
              >
                <Box sx={{ pr: 2, minWidth: 240, flex: '1 1 320px' }}>
                  <Typography variant="h6" sx={{ color: colors.textColor }}>
                    Model Score Comparison Over Time (latest {CHART_LIMIT})
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.75, fontSize: { xs: '0.875rem', sm: '0.95rem' } }}>
                    Tracks the <em>Average</em> score and (when available) individual model scores (Random Forest, XGBoost)
                    for each recent prediction.
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.textDisabled,
                      mt: 0.5,
                      fontSize: { xs: '0.85rem', sm: '0.9rem' },
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere'
                    }}
                  >
                    Tip: <strong>Hover</strong> to read values. Toggle series in the legend. Export as PNG.
                  </Typography>
                </Box>

                <ResponsiveExportButton
                  title="Export PNG"
                  isMobile={isMobile}
                  onClick={() => {
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
                  }}
                />
              </Box>

              <Box sx={{ height: chartHeight }}>
                <Line ref={lineChartRef} data={lineChartData} options={chartOptions} />
              </Box>
            </FloatPaper>

            {/* Bubble Chart (latest 20) */}
            <FloatPaper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }} darkMode={darkMode}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 1.5,
                  mb: 1,
                  flexWrap: 'wrap'
                }}
              >
                <Box sx={{ pr: 2, minWidth: 240, flex: '1 1 360px' }}>
                  <Typography variant="h6" sx={{ color: colors.textColor }}>
                    Reasons Bubble Chart (latest {CHART_LIMIT})
                  </Typography>

                  <Typography variant="body2" sx={{ color: colors.textSecondary, mt: 0.75, fontSize: { xs: '0.875rem', sm: '0.95rem' } }}>
                    Aggregated “explain” terms from recent predictions. Bubble size reflects cumulative importance;
                    color shifts toward red when a term appears more with spam and toward green with ham.
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.textDisabled,
                      mt: 0.5,
                      fontSize: { xs: '0.85rem', sm: '0.9rem' },
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere'
                    }}
                  >
                    Tip: <strong>Scroll</strong> to zoom, <strong>drag</strong> to pan, <strong>double-click</strong> to reset.
                    Use the in-chart <strong>+</strong>/<strong>−</strong>/<strong>⟲</strong> buttons. Hover a bubble for details.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <ResponsiveExportButton
                    title="Export PNG"
                    isMobile={isMobile}
                    onClick={() => {
                      const svgElement = bubbleChartRef.current;
                      if (!svgElement) return;
                      const svgData = new XMLSerializer().serializeToString(svgElement);
                      const canvas = document.createElement('canvas');
                      const ctx = canvas.getContext('2d');
                      const img = new Image();
                      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                      const url = URL.createObjectURL(svgBlob);
                      img.onload = () => {
                        canvas.width = img.width; canvas.height = img.height;
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                        canvas.toBlob((blob) => {
                          const pngUrl = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = pngUrl; link.download = 'reasons-bubble-chart.png';
                          link.click();
                          URL.revokeObjectURL(pngUrl);
                        });
                        URL.revokeObjectURL(url);
                      };
                      img.src = url;
                    }}
                  />
                  <ResponsiveExportButton
                    title="Export SVG"
                    isMobile={isMobile}
                    onClick={() => {
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
                    }}
                  />
                </Box>
              </Box>

              {/* Centered bubble chart area */}
              <Box
                sx={{
                  mt: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  maxWidth: 900,
                  mx: 'auto',
                  width: '100%',
                  height: chartHeight + 60,
                }}
              >
                <ReasonsBubbleChart data={explainAgg} chartRef={bubbleChartRef} darkMode={darkMode} />
              </Box>
            </FloatPaper>

            {/* Recent Predictions (latest 20) */}
            <FloatPaper sx={{ p: { xs: 2, sm: 3 } }} darkMode={darkMode}>
              <Typography variant="h6" gutterBottom sx={{ color: colors.textColor }}>
                Recent Predictions (latest {CHART_LIMIT})
              </Typography>

              {loading && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Loading history from server...
                </Alert>
              )}

              {limited.map((prediction, idx) => (
                <FloatCard
                  key={prediction.id ?? `local-${idx}`}
                  darkMode={darkMode}
                  sx={{
                    mb: 2,
                    borderLeft: 4,
                    borderColor: prediction.label === 'spam' ? 'error.main' : 'success.main',
                    position: 'relative'
                  }}
                >
                  {/* Delete fixed at top-right with custom tooltip */}
                  <DeleteButtonWithHint
                    disabled={!prediction.id || loading}
                    onClick={async () => {
                      if (!prediction.id) {
                        openSnack('This item has no server id; cannot delete via API.', 'warning');
                        return;
                      }
                      try {
                        await apiDeleteHistory(prediction.id);
                        openSnack('Deleted successfully', 'success');
                        await loadServerHistory();
                      } catch (e) {
                        openSnack(String(e?.message || e), 'error');
                      }
                    }}
                  />

                  <CardContent sx={{ p: { xs: 1.5, sm: 2 }, pr: { xs: 5.5, sm: 7 } }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={2}>
                        <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                          Prediction #{idx + 1}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            color: prediction.label === 'spam' ? 'error.main' : 'success.main',
                            textTransform: 'capitalize'
                          }}
                        >
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
                          {Math.round(((prediction.score ?? 0) * 100) * 10) / 10}%
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={3.5}>
                        <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                          Random Forest
                        </Typography>
                        <Typography variant="body1" sx={{ color: colors.textColor }}>
                          {prediction?.rf?.score != null ? `${Math.round(prediction.rf.score * 1000) / 10}%` : 'N/A'}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={3.5}>
                        <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                          XGBoost
                        </Typography>
                        <Typography variant="body1" sx={{ color: colors.textColor }}>
                          {prediction?.xgb?.score != null ? `${Math.round(prediction.xgb.score * 1000) / 10}%` : 'N/A'}
                        </Typography>
                      </Grid>

                      {/* Email text */}
                      <Grid item xs={12}>
                        <Box sx={{
                          mt: 1,
                          p: 1.5,
                          bgcolor: 'transparent',
                          borderRadius: 1,
                          border: 1,
                          borderColor: colors.borderColor,
                          display: 'block'
                        }}>
                          {prediction.text && (
                            <>
                              <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mb: 0.5 }}>
                                Email Text:
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: colors.textColor,
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                  fontSize: '0.875rem',
                                  maxHeight: 80,
                                  overflow: 'auto'
                                }}
                                title={prediction.text}
                              >
                                {prediction.text.length > 200 ? prediction.text.substring(0, 200) + '…' : prediction.text}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </FloatCard>
              ))}
            </FloatPaper>
          </>
        )}
      </Box>

      {/* Global Snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={4500}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} sx={{ width: '100%' }}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default PreviousResults;