import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AdminDashboard } from './components/AdminDashboard';
import './index.css';

// 1. IMPORTAR EL AUTH PROVIDER
// (Asegúrate que esta ruta sea correcta, a veces está en './context/AuthContext')
import { AuthProvider } from './contexts/AuthContext'; 

// 🔐 TU CLAVE MAESTRA
const ADMIN_SECRET = "gem_nova_master_key_2024_xyz"; 

// Detectar si la URL tiene el modo admin
const urlParams = new URLSearchParams(window.location.search);
const isAdminMode = urlParams.get('mode') === ADMIN_SECRET;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 🔥 AQUÍ ESTABA EL ERROR: Faltaba envolver todo en AuthProvider */}
    <AuthProvider>
      {isAdminMode ? (
        <AdminDashboard onClose={() => window.location.href = '/'} />
      ) : (
        <App />
      )}
    </AuthProvider>
  </React.StrictMode>,
);