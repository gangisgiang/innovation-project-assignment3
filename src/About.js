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
          • Real-time email analysis
          • Machine learning-based detection
          • Detailed confidence scores
          • Multi-model ensemble approach
          • Explanation of decisions
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Technology Stack
        </Typography>
        <Typography variant="body1" paragraph>
          • Frontend: React with Material-UI
          • Backend: FastAPI
          • ML Models: rf, xgb
          • Visualization: Plotly.js
        </Typography>
        <Typography variant="body1" sx={{ mt: 4 }}>
          This project was developed as part of COS30049 - Computing Technology Innovation Project
        </Typography>
      </Box>
    </Container>
  );
}

export default About;