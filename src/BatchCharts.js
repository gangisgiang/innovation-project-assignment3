// src/BatchCharts.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Box, Paper, Typography, ButtonGroup, Button } from '@mui/material';

/* ========= ScoreDistributionBarChart ========= */
export const ScoreDistributionBarChart = ({ distributionData, darkMode }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [selectedBar, setSelectedBar] = useState(null);

  useEffect(() => {
    if (!distributionData) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const hideTooltip = () => {
      const t = tooltipRef.current;
      if (t) { t.style.visibility = 'hidden'; t.style.display = 'none'; }
    };

    const containerWidth = svgRef.current.parentElement.offsetWidth;
    const margin = { top: 40, right: 40, bottom: 60, left: 80 };
    const width = Math.min(containerWidth - margin.left - margin.right - 40, 800);
    const height = 350 - margin.top - margin.bottom;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const barData = Object.entries(distributionData).map(([range, count]) => ({ range, count }));
    const xBar = d3.scaleBand().domain(barData.map(d => d.range)).range([0, width]).padding(0.4);
    const yBar = d3.scaleLinear().domain([0, Math.ceil(d3.max(barData, d => d.count))]).range([height, 0]);

    const colorScale = d3
      .scaleOrdinal()
      .domain(['0.0-0.2', '0.2-0.4', '0.4-0.6', '0.6-0.8', '0.8-1.0'])
      .range(['#4caf50', '#8bc34a', '#ffc107', '#ff9800', '#f44336']);

    const axisColor = darkMode ? '#ffffff' : '#000000';
    const gridColor = darkMode ? 'rgba(255,255,255,0.18)' : '#e0e0e0';

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xBar))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('fill', axisColor);

    g.append('g')
      .call(d3.axisLeft(yBar).ticks(Math.ceil(d3.max(barData, d => d.count))).tickFormat(d3.format('d')))
      .selectAll('text')
      .style('fill', axisColor);

    g.selectAll('.domain').attr('stroke', axisColor);
    g.selectAll('.tick line').attr('stroke', gridColor);

    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.18)
      .call(d3.axisLeft(yBar).ticks(Math.ceil(d3.max(barData, d => d.count))).tickSize(-width).tickFormat(''))
      .selectAll('line')
      .attr('stroke', gridColor);

      const bars = g.selectAll('rect.bar')
      .data(barData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xBar(d.range))
      .attr('width', xBar.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', d => colorScale(d.range))
      .attr('rx', 4)
      .style('cursor', 'pointer')
      .attr('stroke', 'none')
      .attr('stroke-width', 0);

    // Helper: chuẩn hoá style cho tất cả bars theo selected + hover
    const applyStyles = (hoverRange = null, selected = selectedBar) => {
      bars.each(function (d) {
        const bar = d3.select(this);
        const isSelected = selected !== null && selected === d.range;
        const isHover = hoverRange !== null && hoverRange === d.range;

        // Opacity logic
        const opacity =
          selected === null
            ? (isHover ? 0.85 : 1)
            : (isSelected ? 1 : (isHover ? 0.85 : 0.3));

        // Stroke logic
        const strokeOn = isSelected || isHover;
        const strokeW = isSelected ? 3 : (isHover ? 2 : 0);

        bar
          .attr('opacity', opacity)
          .attr('stroke', strokeOn ? axisColor : 'none')
          .attr('stroke-width', strokeW);
      });
    };

    bars.transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr('y', d => yBar(d.count))
      .attr('height', d => height - yBar(d.count))
      .on('end', () => applyStyles(null)); // init style sau transition

    bars.on('mouseenter', function (event, d) {
      applyStyles(d.range);
      const totalCount = barData.reduce((sum, item) => sum + item.count, 0);
      const percentage = ((d.count / totalCount) * 100).toFixed(1);
      const t = tooltipRef.current;
      if (!t) return;
      t.style.position = 'fixed';
      t.style.visibility = 'visible';
      t.style.display = 'block';
      t.style.backgroundColor = darkMode ? '#2a2a2a' : '#1a1a1a';
      t.style.color = 'white';
      t.style.borderRadius = '8px';
      t.style.padding = '16px 20px';
      t.style.pointerEvents = 'none';
      t.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      t.style.zIndex = '99999';
      t.style.minWidth = '200px';
      t.style.left = event.clientX + 15 + 'px';
      t.style.top = event.clientY - 10 + 'px';
      t.innerHTML = `
        <div style="font-size: 20px; font-weight: bold; margin-bottom: 12px; color: #fff;">Score Range ${d.range}</div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #aaa;">Count:</span>
          <span style="color: #5bc0de; font-weight: bold; font-size: 18px; margin-left: 20px;">${d.count}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #aaa;">Percentage:</span>
          <span style="color: #f0ad4e; font-weight: bold; font-size: 18px; margin-left: 20px;">${percentage}%</span>
        </div>`;
    });

    bars.on('mousemove', (event) => {
      const t = tooltipRef.current;
      if (t) {
        t.style.left = event.clientX + 15 + 'px';
        t.style.top = event.clientY - 10 + 'px';
      }
    });

    bars.on('mouseleave', function () {
      applyStyles(null);
      hideTooltip();
    });

    bars.on('click', (event, d) => {
      event.stopPropagation();
      const next = (selectedBar === d.range) ? null : d.range;
      setSelectedBar(next);
      applyStyles(null, next); // cập nhật ngay lập tức
      hideTooltip();
    });

    svg.on('click', () => {
      setSelectedBar(null);
      applyStyles(null, null);
      hideTooltip();
    });

    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 55)
      .attr('text-anchor', 'middle')
      .style('fill', axisColor)
      .style('font-size', '12px')
      .text('Score Range');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -60)
      .attr('text-anchor', 'middle')
      .style('fill', axisColor)
      .style('font-size', '12px')
      .text('Number of Messages');

    return () => window.removeEventListener('scroll', hideTooltip);
  }, [distributionData, darkMode, selectedBar]);

  return (
    <Paper sx={{ p: 2, position: 'relative', bgcolor: darkMode ? '#0f0f0f' : 'background.paper' }}>
      <Typography variant="h6" gutterBottom sx={{ color: darkMode ? '#fff' : 'inherit' }}>Score Distribution</Typography>
      <Typography variant="caption" color={darkMode ? 'inherit' : 'textSecondary'} display="block" sx={{ mb: 2, opacity: darkMode ? 0.8 : 1 }}>
        Distribution of spam scores across all messages • Hover for details • Click to highlight
      </Typography>
      <Box sx={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg ref={svgRef} style={{ display: 'block', maxWidth: '100%' }} />
        <div ref={tooltipRef} style={{ position: 'fixed', visibility: 'hidden', pointerEvents: 'none' }} />
      </Box>
    </Paper>
  );
};

/* ========= ScatterPlotChart ========= */
export const ScatterPlotChart = ({ data, darkMode }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'spam', 'ham'

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const hideTooltip = () => {
      const t = tooltipRef.current;
      if (t) { t.style.visibility = 'hidden'; t.style.display = 'none'; }
    };

    const containerWidth = svgRef.current.parentElement.offsetWidth;
    const margin = { top: 20, right: 80, bottom: 60, left: 80 };
    const width = Math.min(containerWidth - margin.left - margin.right - 40, 800);
    const height = 400 - margin.top - margin.bottom;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const numberedData = data.map((d, i) => ({ ...d, messageNumber: i + 1 }));
    const filteredData = viewMode === 'all' ? numberedData : numberedData.filter(d => d.label === viewMode);

    const x = d3.scaleLinear().domain([0.5, numberedData.length + 0.5]).range([0, width]);
    const y = d3.scaleLinear().domain([0, 1]).range([height, 0]);

    const axisColor = darkMode ? '#ffffff' : '#000000';
    const gridColor = darkMode ? 'rgba(255,255,255,0.18)' : '#e0e0e0';

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(Math.min(20, numberedData.length)))
      .selectAll('text')
      .style('fill', axisColor);

    g.append('g')
      .call(d3.axisLeft(y).ticks(10).tickFormat(d => (d * 100) + '%'))
      .selectAll('text')
      .style('fill', axisColor);

    g.selectAll('.domain').attr('stroke', axisColor);
    g.selectAll('.tick line').attr('stroke', gridColor);

    // Grid
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.18)
      .call(d3.axisLeft(y).ticks(10).tickSize(-width).tickFormat(''))
      .selectAll('line')
      .attr('stroke', gridColor);

    // Reference line at 50%
    g.append('line')
      .attr('x1', 0).attr('x2', width)
      .attr('y1', y(0.5)).attr('y2', y(0.5))
      .attr('stroke', gridColor).attr('stroke-width', 2).attr('stroke-dasharray', '5,5');

    const circles = g.selectAll('circle')
      .data(filteredData)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.messageNumber))
      .attr('cy', d => y(d.score))
      .attr('r', 0)
      .attr('fill', d => d.label === 'spam' ? '#f44336' : '#4caf50')
      .attr('stroke', 'white')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .attr('opacity', 0.8);

    circles.each(function(d) {
      const circle = d3.select(this);
      const isSelected = selectedPoint === d.messageNumber;
      const radius = isSelected ? 12 : 7;
      const opacity = (selectedPoint === null || isSelected) ? 0.8 : 0.3;
      circle.attr('r', radius).attr('opacity', opacity);
    });

    circles.transition().duration(800).delay((d, i) => i * 50).attr('r', d => (selectedPoint === d.messageNumber) ? 12 : 7);

    circles.on('mouseenter', function(event, d) {
      if (selectedPoint !== d.messageNumber) d3.select(this).transition().duration(150).attr('r', 10).attr('stroke-width', 2.5);

      const preview = d.text ? d.text.substring(0, 50) + '...' : 'No preview available';
      const scorePercent = (d.score * 100).toFixed(1);
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
      tooltipDiv.style.minWidth = '240px';
      tooltipDiv.style.left = (event.clientX + 15) + 'px';
      tooltipDiv.style.top = (event.clientY - 10) + 'px';
      tooltipDiv.innerHTML = `
        <div style="font-size: 20px; font-weight: bold; margin-bottom: 12px; color: #fff;">Message #${d.messageNumber}</div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #aaa;">Spam Score:</span><span style="color: #5bc0de; font-weight: bold; font-size: 18px; margin-left: 20px;">${scorePercent}%</span></div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px;"><span style="color: #aaa;">Classification:</span><span style="color: ${d.label === 'spam' ? '#f0ad4e' : '#5cb85c'}; font-weight: bold; font-size: 18px; margin-left: 20px;">${d.label.toUpperCase()}</span></div>
        <div style="border-top: 1px solid #444; padding-top: 8px; margin-top: 8px;"><div style="color: #888; font-size: 12px; margin-bottom: 4px;">Preview:</div><div style="color: #ccc; font-size: 13px; line-height: 1.4;">${preview}</div></div>`;
    });

    circles.on('mousemove', function(event) {
      const tooltipDiv = tooltipRef.current;
      if (tooltipDiv) { tooltipDiv.style.left = (event.clientX + 15) + 'px'; tooltipDiv.style.top = (event.clientY - 10) + 'px'; }
    });

    circles.on('mouseleave', function() {
      if (selectedPoint === null) d3.select(this).transition().duration(150).attr('r', 7).attr('stroke-width', 1.5);
      hideTooltip();
    });

    circles.on('click', function(event, d) { event.stopPropagation(); setSelectedPoint(selectedPoint === d.messageNumber ? null : d.messageNumber); hideTooltip(); });
    svg.on('click', () => { setSelectedPoint(null); hideTooltip(); });
    svg.on('mousemove', (event) => { const t = event.target; if (!(t instanceof Element) || t.tagName.toLowerCase() !== 'circle') hideTooltip(); });

    g.append('text')
      .attr('x', width / 2).attr('y', height + margin.bottom - 10).attr('text-anchor', 'middle')
      .style('fill', axisColor).style('font-size', '12px').text('Message Number (Sequence)');

    g.append('text')
      .attr('transform', 'rotate(-90)').attr('x', -height / 2).attr('y', -60).attr('text-anchor', 'middle')
      .style('fill', axisColor).style('font-size', '12px').text('Spam Probability Score');

  }, [data, darkMode, selectedPoint, viewMode]);

  return (
    <Paper sx={{ p: 2, position: 'relative', bgcolor: darkMode ? '#0f0f0f' : 'background.paper' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ color: darkMode ? '#fff' : 'inherit' }}>Message Score Distribution</Typography>
          <Typography variant="caption" color={darkMode ? 'inherit' : 'textSecondary'} sx={{ opacity: darkMode ? 0.8 : 1 }}>
            Each dot represents a message • Hover for details • Click to highlight
          </Typography>
        </Box>
        <ButtonGroup size="small" variant="outlined">
          <Button onClick={() => setViewMode('all')} variant={viewMode === 'all' ? 'contained' : 'outlined'}>All</Button>
          <Button onClick={() => setViewMode('spam')} variant={viewMode === 'spam' ? 'contained' : 'outlined'} sx={{ color: viewMode === 'spam' ? 'white' : 'error.main' }}>Spam</Button>
          <Button onClick={() => setViewMode('ham')} variant={viewMode === 'ham' ? 'contained' : 'outlined'} sx={{ color: viewMode === 'ham' ? 'white' : 'success.main' }}>Ham</Button>
        </ButtonGroup>
      </Box>
      <Box sx={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg ref={svgRef} style={{ display: 'block', maxWidth: '100%' }}></svg>
        <div ref={tooltipRef} style={{ position: 'fixed', visibility: 'hidden', pointerEvents: 'none' }}></div>
      </Box>
    </Paper>
  );
};

/* ========= SpamHamPieChart ========= */
export const SpamHamPieChart = ({ overview, darkMode }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [selectedSegment, setSelectedSegment] = useState(null);

  useEffect(() => {
    if (!overview) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 400, height = 400;
    const radius = Math.min(width, height) / 2 - 40;

    const g = svg.attr('width', width).attr('height', height).append('g').attr('transform', `translate(${width / 2},${height / 2})`);

    const pieData = [
      { label: 'Spam', value: overview.spam_count, color: '#f44336' },
      { label: 'Ham', value: overview.ham_count, color: '#4caf50' }
    ];

    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    const arcHover = d3.arc().innerRadius(0).outerRadius(radius + 10);

    const arcs = g.selectAll('.arc').data(pie(pieData)).enter().append('g').attr('class', 'arc').style('cursor', 'pointer');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', darkMode ? '#0f0f0f' : '#ffffff')
      .attr('stroke-width', 2)
      .style('opacity', d => (selectedSegment === null || selectedSegment === d.data.label ? 1 : 0.3))
      .on('mouseenter', function(event, d) {
        const isSelected = selectedSegment === d.data.label;
        if (!isSelected) d3.select(this).transition().duration(200).attr('d', arcHover).style('opacity', 0.85);

        const tooltipDiv = tooltipRef.current;
        if (!tooltipDiv) return;
        const percentage = ((d.data.value / overview.total_messages) * 100).toFixed(1);

        tooltipDiv.style.position = 'fixed';
        tooltipDiv.style.visibility = 'visible';
        tooltipDiv.style.display = 'block';
        tooltipDiv.style.backgroundColor = darkMode ? '#2a2a2a' : '#1a1a1a';
        tooltipDiv.style.color = 'white';
        tooltipDiv.style.borderRadius = '8px';
        tooltipDiv.style.padding = '16px 20px';
        tooltipDiv.style.pointerEvents = 'none';
        tooltipDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        tooltipDiv.style.zIndex = '99999';
        tooltipDiv.style.minWidth = '200px';
        tooltipDiv.style.left = (event.clientX + 15) + 'px';
        tooltipDiv.style.top = (event.clientY - 10) + 'px';
        tooltipDiv.innerHTML = `
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 12px; color: #fff;">${d.data.label}</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #aaa;">Count:</span><span style="color: #5bc0de; font-weight: bold; font-size: 18px; margin-left: 20px;">${d.data.value}</span></div>
          <div style="display: flex; justify-content: space-between;"><span style="color: #aaa;">Percentage:</span><span style="color: #f0ad4e; font-weight: bold; font-size: 18px; margin-left: 20px;">${percentage}%</span></div>`;
      })
      .on('mousemove', function(event) {
        const tooltipDiv = tooltipRef.current;
        if (tooltipDiv) { tooltipDiv.style.left = (event.clientX + 15) + 'px'; tooltipDiv.style.top = (event.clientY - 10) + 'px'; }
      })
      .on('mouseleave', function(event, d) {
        const isSelected = selectedSegment === d.data.label;
        if (!isSelected) d3.select(this).transition().duration(200).attr('d', arc).style('opacity', selectedSegment === null ? 1 : 0.3);
        const tooltipDiv = tooltipRef.current;
        if (tooltipDiv) { tooltipDiv.style.visibility = 'hidden'; tooltipDiv.style.display = 'none'; }
      })
      .on('click', function(event, d) { event.stopPropagation(); setSelectedSegment(selectedSegment === d.data.label ? null : d.data.label); });

    svg.on('click', () => setSelectedSegment(null));

    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('fill', '#ffffff')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text(d => d.data.value);

    const legend = svg.append('g').attr('transform', `translate(20, ${height - 60})`);
    pieData.forEach((item, i) => {
      const legendRow = legend.append('g').attr('transform', `translate(0, ${i * 25})`);
      legendRow.append('rect').attr('width', 18).attr('height', 18).attr('fill', item.color);
      legendRow.append('text').attr('x', 25).attr('y', 14).style('fill', darkMode ? '#ffffff' : '#000000').style('font-size', '14px').text(`${item.label}: ${item.value}`);
    });

  }, [overview, darkMode, selectedSegment]);

  return (
    <Paper sx={{ p: 2, position: 'relative', bgcolor: darkMode ? '#0f0f0f' : 'background.paper' }}>
      <Typography variant="h6" gutterBottom sx={{ color: darkMode ? '#fff' : 'inherit' }}>Spam vs Ham Distribution</Typography>
      <Typography variant="caption" color={darkMode ? 'inherit' : 'textSecondary'} display="block" sx={{ mb: 2, opacity: darkMode ? 0.8 : 1 }}>
        Hover for details • Click to highlight
      </Typography>
      <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <svg ref={svgRef}></svg>
        <div ref={tooltipRef} style={{ position: 'fixed', visibility: 'hidden', pointerEvents: 'none' }}></div>
      </Box>
    </Paper>
  );
};