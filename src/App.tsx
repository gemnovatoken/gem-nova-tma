import { useState, useEffect, useRef, useCallback } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { BottomNav } from './components/BottomNav';
import { MyMainTMAComponent } from './components/MyMainTMAComponent';
import { MarketDashboard } from './components/MarketDashboard'; // Asegúrate que este sea el componente GLOBAL que te di antes
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

// Interfaz TS
interface TelegramWebApp {
    initDataUnsafe?: { user?: { username?: string; first_name?: string; }; };
}

export default function App() {
    const [currentTab, setCurrentTab] = useState('mine');
    
    // Estados Juego
    const [score, setScore] = useState(0);
    const [energy, setEnergy] = useState(0); 
    const [levels, setLevels] = useState({ multitap: 1, limit: 1, speed: 1 });
    
    // Estado Barra Global
    const [globalProgress, setGlobalProgress] = useState(0);

    // Seguridad
    const [canSave, setCanSave] = useState(false);

    const energyRef = useRef(0);
    const scoreRef = useRef(0);
    
    const [botTime, setBotTime] = useState(0);
    const [adsWatched, setAdsWatched] = useState(0);

    const { user, loading: authLoading } = useAuth();
    
    const limitIdx = Math.min(Math.max(0, levels.limit - 1), 7);
    const speedIdx = Math.min(Math.max(0, levels.speed - 1), 7);
    const maxEnergy = GAME_CONFIG.limit.values[limitIdx] || 500;
    const regenRate = GAME_CONFIG.speed.values[speedIdx] || 1;

    useEffect(() => { energyRef.current = energy; }, [energy]);
    useEffect(() => { scoreRef.current = score; }, [score]);

    // AUTO-SAVE
    const saveProgress = useCallback(async () => {
        if (!user || !canSave) return; 
        const { error } = await supabase.rpc('save_game_progress', {
            user_id_in: user.id,
            new_energy: Math.floor(energyRef.current),
            new_score: scoreRef.current
        });
        if (error) console.error("Save Error:", error);
    }, [user, canSave]);

    // 1. CARGA INICIAL
    useEffect(() => {
        if (user && !authLoading) {
            const fetchInitialData = async () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const tg = (window as any).Telegram?.WebApp as TelegramWebApp;
                const username = tg?.initDataUnsafe?.user?.username || 'Miner';

                const { data: userData } = await supabase
                    .from('user_score')
                    .select('limit_level, speed_level, multitap_level, bot_active_until, bot_ads_watched_today, last_bot_ad_date') 
                    .eq('user_id', user.id)
                    .single();
                
                if (userData) {
                    const mySpeed = GAME_CONFIG.speed.values[Math.max(0, (userData.speed_level || 1) - 1)];
                    const myLimit = GAME_CONFIG.limit.values[Math.max(0, (userData.limit_level || 1) - 1)];

                    // Sincronización Energía
                    const { data: syncData, error: syncError } = await supabase.rpc('sync_energy_on_load', { 
                        user_id_in: user.id,
                        my_regen_rate: mySpeed,
                        my_max_energy: myLimit
                    });

                    if (!syncError && syncData && syncData.length > 0) {
                        const result = syncData[0];
                        setScore(result.current_score);
                        setEnergy(result.synced_energy);
                        energyRef.current = result.synced_energy;
                        scoreRef.current = result.current_score;

                        setLevels({ 
                            multitap: userData.multitap_level || 1, 
                            limit: userData.limit_level || 1, 
                            speed: userData.speed_level || 1 
                        });

                        if (userData.bot_active_until) {
                            const botExpiry = new Date(userData.bot_active_until).getTime();
                            const now = new Date().getTime();
                            setBotTime(Math.max(0, Math.floor((botExpiry - now) / 1000)));
                        }

                        const today = new Date().toISOString().split('T')[0];
                        setAdsWatched(userData.last_bot_ad_date !== today ? 0 : (userData.bot_ads_watched_today || 0));

                        setTimeout(() => setCanSave(true), 2000);
                    }
                    await supabase.from('user_score').update({ username: username }).eq('user_id', user.id);

                } else {
                    await supabase.from('user_score').insert([{
                        user_id: user.id, score: 0, energy: 0, username: username,
                        last_energy_update: new Date().toISOString()
                    }]);
                    setEnergy(0);
                    energyRef.current = 0;
                    setCanSave(true);
                }
            };
            fetchInitialData();
        }
    }, [user, authLoading]);

    // 2. 🔥 FETCH BARRA GLOBAL (Esto actualiza la barra del 100% al 0%)
    useEffect(() => {
        const fetchGlobalProgress = async () => {
            const { data, error } = await supabase.rpc('get_global_launch_progress');
            if (!error && data !== null) {
                console.log("Global Progress:", data);
                setGlobalProgress(Number(data));
            }
        };

        fetchGlobalProgress(); // Cargar al inicio
        const interval = setInterval(fetchGlobalProgress, 60000); // Refrescar cada 1 min
        return () => clearInterval(interval);
    }, []);

    // 3. GAME LOOP & SAVE
    useEffect(() => {
        const timer = setInterval(() => {
            setEnergy(p => {
                if (p >= maxEnergy) return p;
                return Math.min(maxEnergy, p + regenRate);
            });
            setBotTime(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [maxEnergy, regenRate]);

    useEffect(() => {
        if (!user || !canSave) return;
        const intervalId = setInterval(saveProgress, 5000);
        const handleVisibilityChange = () => { if (document.visibilityState === 'hidden') saveProgress(); };
        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', saveProgress);
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', saveProgress);
        };
    }, [user, canSave, saveProgress]);

    return (
        <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
            <div className="app-container" style={{ height: '100dvh', overflow: 'hidden', background: '#000', color: 'white', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column', paddingTop: '20px' }}>
                    {currentTab === 'mine' && (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '0 15px', marginBottom: '0', flexShrink: 0 }}>
                                {/* 🔥 AQUÍ PASAMOS EL DATO GLOBAL */}
                                <MarketDashboard globalProgress={globalProgress} />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <MyMainTMAComponent 
                                    score={score} setScore={setScore} 
                                    energy={energy} setEnergy={setEnergy} 
                                    levels={levels} setLevels={setLevels}
                                    maxEnergy={maxEnergy} regenRate={regenRate}
                                    botTime={botTime} setBotTime={setBotTime}
                                    adsWatched={adsWatched} setAdsWatched={setAdsWatched}
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