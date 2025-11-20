import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { MyMainTMAComponent } from './components/MyMainTMAComponent';
import { MarketDashboard } from './components/MarketDashboard';
import { BulkStore } from './components/BulkStore';

const MANIFEST_URL = 'https://gem-nova-tma.vercel.app/tonconnect-manifest.json'; 

export default function App() {
  const [currentTab, setCurrentTab] = useState('mine');

  return (
    <AuthProvider>
      <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
        <div className="app-container">
          {/* Header is always visible */}
          <Header />

          {/* Tab: MINE */}
          {currentTab === 'mine' && (
            <div style={{paddingTop: '20px'}}>
               {/* Show Market Stats on Home too for FOMO */}
               <div style={{padding: '0 20px'}}><MarketDashboard /></div>
               <MyMainTMAComponent />
            </div>
          )}

          {/* Tab: MARKET */}
          {currentTab === 'market' && <BulkStore />}

          {/* Other Tabs (Placeholders) */}
          {currentTab === 'mission' && <div style={{padding: 20}}>Coming Soon: Expedition...</div>}
          {currentTab === 'squad' && <div style={{padding: 20}}>Coming Soon: Referrals...</div>}
          {currentTab === 'wallet' && <div style={{padding: 20}}>Wallet Profile</div>}

          <BottomNav activeTab={currentTab} setTab={setCurrentTab} />
        </div>
      </TonConnectUIProvider>
    </AuthProvider>
  );
}