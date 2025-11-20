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

          {/* --- Tab: WALLET / AIRDROP (NUEVO BLOQUE SEPARADO) --- */}
          {currentTab === 'wallet' && (
            <div style={{ padding: '20px', textAlign: 'left', animation: 'fadeIn 0.5s' }}>
                <h2 style={{display:'flex', alignItems:'center', gap:'10px', marginTop: 0}}>
                    🪂 Airdrop Status
                </h2>
                
                <div className="glass-card">
                    <div style={{color: '#aaa', fontSize: '12px', marginBottom: '5px'}}>STATUS</div>
                    <div style={{color: '#00F2FE', fontWeight: 'bold', fontSize: '18px'}}>PHASE 1: MINING</div>
                    <p style={{fontSize: '13px', marginTop: '10px'}}>
                        Keep tapping and upgrading. Listing date will be announced once we hit the liquidity goal.
                    </p>
                </div>

                {/* SECCIÓN LEGAL - EL TOQUE PROFESIONAL */}
                <div style={{
                    marginTop: '30px', 
                    padding: '15px', 
                    borderLeft: '3px solid #FFD700', 
                    background: 'rgba(255, 215, 0, 0.05)',
                    borderRadius: '0 8px 8px 0'
                }}>
                    <p style={{fontSize: '10px', color: '#888', margin: 0, lineHeight: '1.5'}}>
                        <strong>LEGAL DISCLAIMER:</strong><br/>
                        "GNOVA Points are game assets. Future conversion to tokens involves risk and depends on community liquidity goals. Not financial advice."
                    </p>
                </div>
            </div>
          )}

          {/* --- Tabs: COMING SOON (Solo Mission y Squad) --- */}
          {(currentTab === 'mission' || currentTab === 'squad') && (
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