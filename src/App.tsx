import { useState, useEffect } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
// import { Header } from './components/Header'; // <-- ELIMINADO
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

    // 1. CARGA INICIAL INTELIGENTE + CAPTURA DE USERNAME
    useEffect(() => {
        if (user && !authLoading) {
            const fetchInitialData = async () => {
                // A. OBTENER DATOS DE TELEGRAM
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const tg = (window as any).Telegram?.WebApp;
                const tgUser = tg?.initDataUnsafe?.user;
                // Usamos el username, o el primer nombre, o "Miner" como respaldo
                const username = tgUser?.username || tgUser?.first_name || 'Miner';

                // B. BUSCAR USUARIO EN SUPABASE
                const { data } = await supabase.from('user_score').select('*').eq('user_id', user.id).single();
                
                if (data) {
                    // SI EL USUARIO YA EXISTE:
                    setScore(data.score);
                    
                    // Lógica de regeneración offline
                    const lastUpdate = new Date(data.last_energy_update).getTime();
                    const now = new Date().getTime();
                    const secondsPassed = Math.floor((now - lastUpdate) / 1000);
                    
                    const mySpeed = GAME_CONFIG.speed.values[Math.max(0, (data.speed_level || 1) - 1)];
                    const myLimit = GAME_CONFIG.limit.values[Math.max(0, (data.limit_level || 1) - 1)];
                    
                    const generatedOffline = secondsPassed * mySpeed;
                    const totalEnergy = Math.min(myLimit, data.energy + generatedOffline);
                    
                    setEnergy(totalEnergy);
                    
                    setLevels({ 
                        multitap: data.multitap_level || 1, 
                        limit: data.limit_level || 1, 
                        speed: data.speed_level || 1 
                    });

                    // C. ACTUALIZAR NOMBRE SI ES NECESARIO
                    // Si el nombre en la base de datos es diferente al de Telegram, lo actualizamos
                    if (data.username !== username) {
                        await supabase
                            .from('user_score')
                            .update({ username: username })
                            .eq('user_id', user.id);
                    }

                } else {
                    // SI ES UN USUARIO NUEVO (No existe en la tabla):
                    // Creamos el registro inicial con el nombre de usuario
                    const { error: insertError } = await supabase.from('user_score').insert([{
                        user_id: user.id,
                        score: 0,
                        energy: 500,
                        username: username, // Guardamos el nombre desde el principio
                        last_energy_update: new Date().toISOString()
                    }]);

                    if (!insertError) {
                        setScore(0);
                        setEnergy(500);
                        setLevels({ multitap: 1, limit: 1, speed: 1 });
                    }
                }
            };
            fetchInitialData();
        }
    }, [user, authLoading]);

    // 2. REGENERACIÓN EN VIVO
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
            <div className="app-container" style={{ height: '100dvh', overflow: 'hidden', background: '#000', color: 'white', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                
                {/* HEADER ELIMINADO PARA MÁS ESPACIO */}
                
                <div style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    position: 'relative',
                    display: 'flex', flexDirection: 'column',
                    paddingTop: '20px' 
                }}>
                    {currentTab === 'mine' && (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '0 15px', marginBottom: '0', flexShrink: 0 }}>
                                <MarketDashboard />
                            </div>
                            
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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

                <div style={{ flexShrink: 0 }}>
                    <BottomNav activeTab={currentTab} setTab={setCurrentTab} />
                </div>
            </div>
        </TonConnectUIProvider>
    );
}