import React, { createContext, useState } from 'react';

// Create a context for prediction history
export const PredictionContext = createContext({
  predictionHistory: [],
  addPrediction: () => {}
});

export function PredictionProvider({ children }) {
  const [predictionHistory, setPredictionHistory] = useState([]);

  const addPrediction = (predictionData) => {
    setPredictionHistory(prev => {
      const updated = [...prev, predictionData];
      // Keep only the most recent 10 predictions
      return updated.slice(-15);
    });
  };

  return (
    <PredictionContext.Provider value={{ predictionHistory, addPrediction }}>
      {children}
    </PredictionContext.Provider>
  );
}
