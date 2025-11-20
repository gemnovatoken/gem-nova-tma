import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { MyMainTMAComponent } from './components/MyMainTMAComponent';
import { MarketDashboard } from './components/MarketDashboard';
import { BulkStore } from './components/BulkStore';

// URL de tu manifiesto (Verifica que sea la de Vercel)
const MANIFEST_URL = 'https://gem-nova-tma.vercel.app/tonconnect-manifest.json'; 

export default function App() {
  const [currentTab, setCurrentTab] = useState('mine');

  return (
    <AuthProvider>
      <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
        {/* 👇 IMPORTANTE: paddingBottom evita que el menú tape el contenido */}
        <div className="app-container" style={{ minHeight: '100vh', paddingBottom: '100px', color: 'white' }}>
          
          {/* Header siempre visible */}
          <Header />

          {/* --- Tab: MINE (Juego) --- */}
          {currentTab === 'mine' && (
            <div style={{ paddingTop: '10px', animation: 'fadeIn 0.5s' }}>
               {/* Mostramos el Mercado aquí también para dar FOMO */}
               <div style={{ padding: '0 20px' }}><MarketDashboard /></div>
               <MyMainTMAComponent />
            </div>
          )}

          {/* --- Tab: MARKET (Tesorería) --- */}
          {currentTab === 'market' && (
             <div style={{ animation: 'fadeIn 0.5s' }}>
                <BulkStore />
             </div>
          )}

          {/* --- Tabs: COMING SOON (Relleno) --- */}
          {(currentTab === 'mission' || currentTab === 'squad' || currentTab === 'wallet') && (
             <div style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.7, animation: 'fadeIn 0.5s' }}>
                <div style={{ fontSize: '50px', marginBottom: '15px' }}>🚧</div>
                <h2>Coming Soon</h2>
                <p style={{ color: '#aaa' }}>This feature will be unlocked in Phase 2.</p>
             </div>
          )}

          {/* Menú de Navegación Inferior */}
          <BottomNav activeTab={currentTab} setTab={setCurrentTab} />
          
        </div>
      </TonConnectUIProvider>
    </AuthProvider>
  );
}