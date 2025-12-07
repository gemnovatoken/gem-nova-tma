import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AdminDashboard } from './components/AdminDashboard'; // Importamos el Dashboard
import './index.css';

// 🔐 TU CLAVE MAESTRA
// Cámbiala por algo difícil que solo tú sepas.
const ADMIN_SECRET = "gem_nova_master_key_2024_xyz"; 

// 1. Detectar si la URL tiene el modo admin
const urlParams = new URLSearchParams(window.location.search);
const isAdminMode = urlParams.get('mode') === ADMIN_SECRET;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAdminMode ? (
      // 🕵️ MODO ADMIN: Si la clave coincide, mostramos el Dashboard
      // Le pasamos una función para "salir" que simplemente recarga la página sin la clave
      <AdminDashboard onClose={() => window.location.href = '/'} />
    ) : (
      // 🎮 MODO JUGADOR: Para todo el mundo en Telegram
      <App />
    )}
  </React.StrictMode>,
);