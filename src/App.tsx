import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { MyMainTMAComponent } from './components/MyMainTMAComponent';
import { MarketDashboard } from './components/MarketDashboard';
import { BulkStore } from './components/BulkStore';
import { SquadZone } from './components/SquadZone';
import { WalletRoadmap } from './components/WalletRoadmap';
import { supabase } from './services/supabase';
import { useAuth } from './hooks/useAuth'; // La línea crucial

// Configuración High Stakes (Necesaria para calcular niveles)
const GAME_CONFIG = {
    limit: { values: [500, 1000, 1500, 2000, 4000, 6000, 8500, 12000] },
    speed: { values: [1, 2, 3, 4, 5, 6, 8, 10] }
};

const MANIFEST_URL = 'https://gem-nova-tma.vercel.app/tonconnect-manifest.json'; 

export default function App() {
    const [currentTab, setCurrentTab] = useState('mine');
    
    // ESTADOS CENTRALES DEL JUEGO (Persisten entre pestañas)
    const [score, setScore] = useState(0);
    const [energy, setEnergy] = useState(0);
    const [levels, setLevels] = useState({ multitap: 1, limit: 1, speed: 1 });
    const { user, loading: authLoading } = useAuth();
    
    // Cálculos de Configuración
    const limitIdx = Math.min(Math.max(0, levels.limit - 1), 7);
    const speedIdx = Math.min(Math.max(0, levels.speed - 1), 7);
    const maxEnergy = GAME_CONFIG.limit.values[limitIdx] || 500;
    const regenRate = GAME_CONFIG.speed.values[speedIdx] || 1;

    // 1. CARGA INICIAL DE DATOS (Se ejecuta UNA sola vez al inicio)
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

    // 2. REGENERACIÓN AUTOMÁTICA (Persistente)
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
        <AuthProvider>
            <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
                <div className="app-container" style={{ minHeight: '100vh', paddingBottom: '100px', color: 'white' }}>
                    
                    <Header />

                    {/* --- PESTAÑA 1: MINAR --- */}
                    {currentTab === 'mine' && (
                        <div style={{ paddingTop: '10px', animation: 'fadeIn 0.5s' }}>
                            <div style={{ padding: '0 20px' }}><MarketDashboard /></div>
                            {/* 🎯 SOLUCIÓN AL ERROR DE PROPIEDADES (TS2740) 🎯 */}
                            <MyMainTMAComponent 
                                score={score} setScore={setScore} 
                                energy={energy} setEnergy={setEnergy} 
                                levels={levels} setLevels={setLevels}
                                maxEnergy={maxEnergy} regenRate={regenRate}
                            />
                        </div>
                    )}
                    
                    {/* --- PESTAÑA 2: MERCADO --- */}
                    {currentTab === 'market' && (
                        <div style={{ animation: 'fadeIn 0.5s' }}>
                            <BulkStore />
                        </div>
                    )}

                    {/* --- PESTAÑA 3: MISIÓN --- */}
                    {currentTab === 'mission' && (
                        <div style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.7, animation: 'fadeIn 0.5s' }}>
                            <div style={{ fontSize: '50px', marginBottom: '15px' }}>🗺️</div>
                            <h2>Expedition</h2>
                            <p style={{ color: '#aaa' }}>Daily Quests coming in Phase 1.5.</p>
                        </div>
                    )}

                    {/* --- PESTAÑA 4: SQUAD --- */}
                    {currentTab === 'squad' && (
                        <div style={{ padding: '20px', animation: 'fadeIn 0.5s' }}>
                            <SquadZone />
                        </div>
                    )}

                    {/* --- PESTAÑA 5: AIRDROP/WALLET --- */}
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