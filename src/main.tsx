// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
// 🎯 SOLUCIÓN: Importación por defecto (SIN LLAVES)
import App from './App.tsx'; 
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);