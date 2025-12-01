import { useState, useEffect } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { MyMainTMAComponent } from './components/MyMainTMAComponent';
import { MarketDashboard } from './components/MarketDashboard';
import { BulkStore } from './components/BulkStore';
import { SquadZone } from './components/SquadZone';
import { WalletRoadmap } from './components/WalletRoadmap';
import { supabase } from './services/supabase';
import { useAuth } from './hooks/useAuth';
import { MissionZone } from './components/MissionZone';

const GAME_CONFIG = {
    limit: { values: [500, 1000, 1500, 2000, 4000, 6000, 8500, 12000] },
    speed: { values: [1, 2, 3, 4, 5, 6, 8, 10] }
};

const MANIFEST_URL = 'https://gem-nova-tma.vercel.app/tonconnect-manifest.json'; 

export default function App() {
    const [currentTab, setCurrentTab] = useState('mine');
    const [score, setScore] = useState(0);
    const [energy, setEnergy] = useState(0);
    const [levels, setLevels] = useState({ multitap: 1, limit: 1, speed: 1 });
    const { user, loading: authLoading } = useAuth();
    
    const limitIdx = Math.min(Math.max(0, levels.limit - 1), 7);
    const speedIdx = Math.min(Math.max(0, levels.speed - 1), 7);
    const maxEnergy = GAME_CONFIG.limit.values[limitIdx] || 500;
    const regenRate = GAME_CONFIG.speed.values[speedIdx] || 1;

    useEffect(() => {
        if (user && !authLoading) {
            const fetchInitialData = async () => {
                const { data } = await supabase.from('user_score').select('*').eq('user_id', user.id).single();
                if (data) {
                    setScore(data.score);
                    setEnergy(data.energy);
                    setLevels({ multitap: data.multitap_level || 1, limit: data.limit_level || 1, speed: data.speed_level || 1 });
                }
            };
            fetchInitialData();
        }
    }, [user, authLoading]);

    useEffect(() => {
        const timer = setInterval(() => {
            setEnergy(p => {
                if (p >= maxEnergy) return p;
                return Math.min(maxEnergy, p + regenRate);
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [maxEnergy, regenRate]);

    return (
        <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
            {/* 🛡️ CORRECCIÓN 1: Cambiamos minHeight por height: 100dvh (Altura fija real) */}
            {/* Quitamos el paddingBottom: 100px que causaba el espacio vacío */}
            <div className="app-container" style={{ height: '100dvh', overflow: 'hidden', background: '#000', color: 'white', position: 'relative' }}>
                
                <Header />

                {/* Contenedor de contenido con scroll interno solo si es necesario */}
                <div style={{ 
                    height: 'calc(100dvh - 140px)', // Espacio restante exacto
                    overflowY: 'auto', // Scroll solo aquí dentro
                    paddingBottom: '0px' // Sin espacio extra
                }}>
                    {currentTab === 'mine' && (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {/* 🛡️ CORRECCIÓN 2: Quitamos paddingTop extra y márgenes */}
                            <div style={{ padding: '0 15px', marginBottom: '0' }}><MarketDashboard /></div>
                            
                            {/* El componente principal se encargará de llenar el resto */}
                            <div style={{ flex: 1 }}>
                                <MyMainTMAComponent 
                                    score={score} setScore={setScore} 
                                    energy={energy} setEnergy={setEnergy} 
                                    levels={levels} setLevels={setLevels}
                                    maxEnergy={maxEnergy} regenRate={regenRate}
                                />
                            </div>
                        </div>
                    )}
                    
                    {currentTab === 'market' && <div style={{ animation: 'fadeIn 0.3s' }}><BulkStore /></div>}
                    {currentTab === 'mission' && <div style={{ animation: 'fadeIn 0.3s' }}><MissionZone /></div>}
                    {currentTab === 'squad' && <div style={{ padding: '20px', animation: 'fadeIn 0.3s' }}><SquadZone /></div>}
                    {currentTab === 'wallet' && <div style={{ animation: 'fadeIn 0.3s' }}><WalletRoadmap /></div>}
                </div>

                <BottomNav activeTab={currentTab} setTab={setCurrentTab} />
            </div>
        </TonConnectUIProvider>
    );
}