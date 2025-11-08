import React from 'react';
import {
  Typography,
  Container,
  Box,
  List,
  ListItem,
  ListItemText
} from '@mui/material';

function About() {
  return (
    <Container component="main" sx={{ mt: 6, mb: 6 }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          About This Project
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: 'text.secondary', mb: 3 }}>
          Intelligent Email Spam & Malware Detection
        </Typography>

        <Typography variant="body1" paragraph>
          <strong>SPECTER</strong> is a smart detection platform built to analyze and classify
          incoming emails using machine learning. It helps users and organizations identify
          potential spam or malware threats in real time, turning raw text into actionable insight.
        </Typography>

        <Typography variant="body1" paragraph>
          By combining multiple ML models with explainable AI, SPECTER goes beyond a simple
          “spam/not spam” label. It reveals why an email was flagged,
          providing transparency and trust in every prediction.
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 5 }}>
        Core Features
        </Typography>
        <List dense>
          <ListItem><ListItemText primary="Real-time text-based email scanning" /></ListItem>
          <ListItem><ListItemText primary="Ensemble model prediction using Random Forest & XGBoost" /></ListItem>
          <ListItem><ListItemText primary="Detailed confidence scores with visual dashboards" /></ListItem>
          <ListItem><ListItemText primary="Explainable AI: feature and keyword attribution" /></ListItem>
          <ListItem><ListItemText primary="Batch and single email analysis modes" /></ListItem>
        </List>

        <Typography variant="h6" gutterBottom sx={{ mt: 5 }}>
        Technology Stack
        </Typography>
        <List dense>
          <ListItem><ListItemText primary="Frontend: React + Material UI" /></ListItem>
          <ListItem><ListItemText primary="Backend: FastAPI (Python)" /></ListItem>
          <ListItem><ListItemText primary="Machine Learning: Scikit-learn, XGBoost, RandomForest" /></ListItem>
          <ListItem><ListItemText primary="Visualization: Plotly.js, Chart.js, D3.js" /></ListItem>
        </List>

        <Typography variant="body1" paragraph sx={{ mt: 5 }}>
          This project was developed as part of the <strong>COS30049 – Computing Technology Innovation Project</strong>,
          aiming to demonstrate the practical use of data science and AI in cybersecurity applications.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
        © 2025 SPECTER — A student-built AI security project.        </Typography>
      </Box>
    </Container>
  );
}

export default About;