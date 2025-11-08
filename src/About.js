import React from 'react';
import {
  Typography,
  Container,
  Box,
} from '@mui/material';

function About() {
  return (
    <Container component="main" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          About Our Project
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Spam and Malware Detection System
        </Typography>
        <Typography variant="body1" paragraph>
          Our system uses advanced machine learning algorithms to detect potential spam and malware threats in emails.
          By analyzing patterns and characteristics in the text, we can identify suspicious content with high accuracy.
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Key Features
        </Typography>
        <Typography variant="body1" paragraph>
            <ul>
                <li>Real-time email analysis</li>
                <li>Machine learning-based detection</li>
                <li>Detailed confidence scores</li>
                <li>Multi-model ensemble approach</li>
                <li>Explanation of decisions</li>
            </ul>
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Technology Stack
        </Typography>
        <Typography variant="body1" paragraph>
            <ul>
                <li>Frontend: React with Material-UI</li>
                <li>Backend: FastAPI</li>
                <li>ML Models: Random Forest, XGBoost</li>
                <li>Visualization: Plotly.js, Chart.js, D3.js</li>
            </ul>
        </Typography>
        <Typography variant="body1" sx={{ mt: 4 }}>
          This project was developed as part of COS30049 - Computing Technology Innovation Project
        </Typography>
      </Box>
    </Container>
  );
}

export default About;