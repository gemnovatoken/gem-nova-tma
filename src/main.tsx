// src/main.tsx (El archivo que monta la aplicación)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; 
import './index.css';

// 1. Importar el AuthProvider
import { AuthProvider } from './contexts/AuthContext'; 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 2. El AuthProvider DEBE envolver a App */}
    <AuthProvider>
        <App />
    </AuthProvider>
  </React.StrictMode>,
);