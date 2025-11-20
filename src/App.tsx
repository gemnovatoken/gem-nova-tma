import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { MyMainTMAComponent } from './components/MyMainTMAComponent';
import { MarketDashboard } from './components/MarketDashboard';
import { BulkStore } from './components/BulkStore';
// 👇 IMPORTACIONES NUEVAS
import { SquadZone } from './components/SquadZone';
import { WalletRoadmap } from './components/WalletRoadmap';

const MANIFEST_URL = 'https://gem-nova-tma.vercel.app/tonconnect-manifest.json'; 

export default function App() {
  const [currentTab, setCurrentTab] = useState('mine');

  return (
    <AuthProvider>
      <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
        <div className="app-container" style={{ minHeight: '100vh', paddingBottom: '100px', color: 'white' }}>
          
          <Header />

          {/* --- PESTAÑA 1: MINAR --- */}
          {currentTab === 'mine' && (
            <div style={{ paddingTop: '10px', animation: 'fadeIn 0.5s' }}>
               <div style={{ padding: '0 20px' }}><MarketDashboard /></div>
               <MyMainTMAComponent />
            </div>
          )}

          {/* --- PESTAÑA 2: MERCADO --- */}
          {currentTab === 'market' && (
             <div style={{ animation: 'fadeIn 0.5s' }}>
                <BulkStore />
             </div>
          )}

          {/* --- PESTAÑA 3: MISIÓN (Aún en construcción) --- */}
          {currentTab === 'mission' && (
             <div style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.7, animation: 'fadeIn 0.5s' }}>
                <div style={{ fontSize: '50px', marginBottom: '15px' }}>🗺️</div>
                <h2>Expedition</h2>
                <p style={{ color: '#aaa' }}>Daily Quests coming in Phase 1.5.</p>
             </div>
          )}

          {/* --- PESTAÑA 4: SQUAD (REFERIDOS) --- */}
          {/* 👇 AQUÍ CONECTAMOS EL COMPONENTE NUEVO */}
          {currentTab === 'squad' && (
             <div style={{ animation: 'fadeIn 0.5s' }}>
                 <SquadZone />
             </div>
          )}

          {/* --- PESTAÑA 5: AIRDROP (WALLET) --- */}
          {/* 👇 AQUÍ CONECTAMOS EL ROADMAP */}
          {currentTab === 'wallet' && (
             <div style={{ animation: 'fadeIn 0.5s' }}>
                 <WalletRoadmap />
             </div>
          )}

          <BottomNav activeTab={currentTab} setTab={setCurrentTab} />
          
        </div>
      </TonConnectUIProvider>
    </AuthProvider>
  );
}