// src/main.tsx (El archivo que monta la aplicación)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; 
import './index.css';

// 1. Importar el AuthProvider
import { AuthProvider } from './contexts/AuthContext'; 

console.log("DEBUG URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("DEBUG KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "Presente" : "Falta");

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 2. El AuthProvider DEBE envolver a App */}
    <AuthProvider>
        <App />
    </AuthProvider>
  </React.StrictMode>,
);