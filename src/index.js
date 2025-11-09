import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import About from './About';
import PreviousResults from './PreviousResults';
import Background from './background';
import { PredictionProvider } from './PredictionProvider';

const theme = createTheme();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Background>
          <PredictionProvider>
            <Routes>
              <Route path="/about" element={<About />} />
              <Route path="/previous-results" element={<PreviousResults />} />
              <Route path="/" element={<App />} />
            </Routes>
          </PredictionProvider>
        </Background>
      </Router>
    </ThemeProvider>
  </React.StrictMode>
);
