// src/BatchChartsContainer.js
import React, { useState } from 'react';
import { Grid } from '@mui/material';
import { ScoreDistributionBarChart, ScatterPlotChart, SpamHamPieChart } from './BatchCharts';

export default function BatchChartsContainer({ distributionData, scatterData, overview, darkMode }) {
  const [selectedRange, setSelectedRange] = useState(null);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <ScoreDistributionBarChart
          distributionData={distributionData}
          darkMode={darkMode}
          selectedRange={selectedRange}
          onRangeSelect={setSelectedRange}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <SpamHamPieChart overview={overview} darkMode={darkMode} />
      </Grid>

      <Grid item xs={12}>
        <ScatterPlotChart
          data={scatterData}
          darkMode={darkMode}
          selectedRange={selectedRange}
          onRangeSelect={setSelectedRange}
        />
      </Grid>
    </Grid>
  );
}