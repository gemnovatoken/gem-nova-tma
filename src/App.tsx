// src/App.tsx
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { MyMainTMAComponent } from './components/MyMainTMAComponent.tsx'; 
// Asegúrate de que este componente exista o reemplaza con la lógica de tu TMA
import { Header } from './components/Header.tsx'; // ⬅️ 1. Importación con nombre (con llaves)
import { AuthProvider } from './contexts/AuthContext';


// URL HTTPS pública donde se encuentra el archivo tonconnect-manifest.json
// ¡REEMPLAZA ESTA URL CON TU URL REAL DE DESPLIEGUE!
const MANIFEST_URL = 'https://openings-international-fit-dinner.trycloudflare.com/tonconnect-manifest.json';

export default function App() {
  return (
    <AuthProvider> {/* Si estás usando AuthProvider */}
      <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
        <div className="app-container">
          
          {/* 2. Asegúrate de que el componente esté siendo usado aquí: */}
          TMA Tap-to-Earn <Header /> 
          
          <MyMainTMAComponent />
        </div>
      </TonConnectUIProvider>
    </AuthProvider>
  );
}